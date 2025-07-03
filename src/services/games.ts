/**
 * 游戏相关服务
 */

import AV from './leancloud';
import { Game, GameForm, GameFilters, BatchImportResult } from '../types/game';
import { getEnhancedGames, getBatchGames, clearGamesCaches } from './dataCache';

/**
 * 获取游戏列表
 * @param filters 筛选条件
 * @param page 页码
 * @param limit 每页数量
 * @returns 游戏列表
 */
export const getGames = async (
  filters: GameFilters = {},
  page = 1,
  limit = 20
): Promise<{ games: Game[]; total: number }> => {
  try {
    const query = new AV.Query('Game');
    
    // 搜索条件
    if (filters.search) {
      query.contains('name', filters.search);
    }
    
    // 平台筛选
    if (filters.platform) {
      query.equalTo('platform', filters.platform);
    }
    
    // 类型筛选
    if (filters.type) {
      query.equalTo('type', filters.type);
    }
    
    // 如果是收藏数或综合热度排序，需要先获取所有数据再排序
    const needCustomSort = filters.sortBy === 'favoriteCount' || filters.sortBy === 'hotScore';
    
    if (!needCustomSort) {
      // 普通排序（数据库支持的字段）
      switch (filters.sortBy) {
        case 'name':
          if (filters.sortOrder === 'desc') {
            query.descending('name');
          } else {
            query.ascending('name');
          }
          break;
        case 'likeCount':
          if (filters.sortOrder === 'asc') {
            query.ascending('likeCount');
          } else {
            query.descending('likeCount');
          }
          break;
        default:
          query.descending('createdAt');
      }
      
      // 分页
      query.skip((page - 1) * limit);
      query.limit(limit);
    } else {
      // 自定义排序需要获取更多数据
      query.limit(1000); // 获取足够多的数据用于排序
    }
    
    // 包含创建者信息
    query.include('createdBy');
    
    const [results, total] = await Promise.all([
      query.find(),
      query.count()
    ]);
    
    // 提取查询结果的游戏ID列表
    const gameIds = results.map(item => item.id || '').filter(id => id);
    
    // 使用优化的批量查询获取完整的游戏数据（包含收藏数和热度分数）
    // 这避免了为每个游戏单独查询收藏数的429错误问题
    const allEnhancedGames = await getEnhancedGames();
    
    // 创建增强游戏数据的映射，便于快速查找
    const enhancedGameMap = new Map(
      allEnhancedGames.map(game => [game.objectId, game])
    );
    
    // 构建最终的游戏列表，保持原查询的顺序和筛选结果
    let gameWithStats: Game[] = results.map(item => {
      const gameId = item.id || '';
      const enhancedGame = enhancedGameMap.get(gameId);
      
      if (enhancedGame) {
        return enhancedGame;
      }
      
      // 如果没有找到增强数据，使用原始数据（备用方案）
      return {
        objectId: gameId,
        name: item.get('name') || '',
        minPlayers: item.get('minPlayers') || 0,
        maxPlayers: item.get('maxPlayers') || 0,
        platform: item.get('platform') || '',
        description: item.get('description') || '',
        type: item.get('type') || '',
        likeCount: item.get('likeCount') || 0,
        favoriteCount: 0,
        hotScore: 0,
        createdBy: item.get('createdBy')?.id || item.get('createdBy') || '',
        createdAt: item.get('createdAt') || new Date(),
        updatedAt: item.get('updatedAt') || new Date()
      };
    });
    
    // 如果需要自定义排序，进行排序和分页
    if (needCustomSort) {
      // 排序
      if (filters.sortBy === 'favoriteCount') {
        gameWithStats.sort((a, b) => {
          const order = filters.sortOrder === 'asc' ? 1 : -1;
          const aCount = a.favoriteCount ?? 0;
          const bCount = b.favoriteCount ?? 0;
          return (aCount - bCount) * order;
        });
      } else if (filters.sortBy === 'hotScore') {
        gameWithStats.sort((a, b) => {
          const order = filters.sortOrder === 'asc' ? 1 : -1;
          const aScore = a.hotScore ?? 0;
          const bScore = b.hotScore ?? 0;
          return (aScore - bScore) * order;
        });
      }
      
      // 手动分页
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      gameWithStats = gameWithStats.slice(startIndex, endIndex);
    }
    
    return { games: gameWithStats, total };
  } catch (error: any) {
    // 如果是数据表不存在的错误，返回空结果
    if (error.code === 404) {
      console.log('Game表还不存在，返回空结果');
      return { games: [], total: 0 };
    }
    console.error('获取游戏列表失败:', error);
    throw new Error(`获取游戏列表失败: ${error.message}`);
  }
};

/**
 * 根据ID获取游戏详情
 * @param gameId 游戏ID
 * @returns 游戏详情
 */
export const getGameById = async (gameId: string): Promise<Game> => {
  try {
    // 优先从缓存中获取增强的游戏数据
    const enhancedGames = await getEnhancedGames();
    const enhancedGame = enhancedGames.find(game => game.objectId === gameId);
    
    if (enhancedGame) {
      return enhancedGame;
    }
    
    // 如果缓存中没有，直接查询数据库（备用方案）
    const query = new AV.Query('Game');
    query.include('createdBy');
    const game = await query.get(gameId);
    
    return {
      objectId: game.id || '',
      name: game.get('name') || '',
      minPlayers: game.get('minPlayers') || 0,
      maxPlayers: game.get('maxPlayers') || 0,
      platform: game.get('platform') || '',
      description: game.get('description') || '',
      type: game.get('type') || '',
      likeCount: game.get('likeCount') || 0,
      favoriteCount: 0, // 缓存未命中时使用默认值
      hotScore: 0, // 缓存未命中时使用默认值
      createdBy: game.get('createdBy')?.id || game.get('createdBy') || '',
      createdAt: game.get('createdAt') || new Date(),
      updatedAt: game.get('updatedAt') || new Date()
    };
  } catch (error: any) {
    console.error('获取游戏详情失败:', error);
    throw new Error(`获取游戏详情失败: ${error.message}`);
  }
};

/**
 * 创建新游戏
 * @param gameData 游戏数据
 * @returns 创建的游戏
 */
export const createGame = async (gameData: GameForm): Promise<Game> => {
  try {
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }
    
    const GameClass = AV.Object.extend('Game');
    const game = new GameClass();
    
    game.set('name', gameData.name);
    game.set('minPlayers', gameData.minPlayers);
    game.set('maxPlayers', gameData.maxPlayers);
    game.set('platform', gameData.platform || '');
    game.set('description', gameData.description || '');
    game.set('type', gameData.type || '');
    game.set('likeCount', 0);
    game.set('createdBy', currentUser);
    
    const result = await game.save();
    
    // 清除游戏相关缓存，确保新数据能被正确获取
    clearGamesCaches();
    
    return {
      objectId: result.id || '',
      name: result.get('name') || '',
      minPlayers: result.get('minPlayers') || 0,
      maxPlayers: result.get('maxPlayers') || 0,
      platform: result.get('platform') || '',
      description: result.get('description') || '',
      type: result.get('type') || '',
      likeCount: result.get('likeCount') || 0,
      createdBy: currentUser.id || '',
      createdAt: result.get('createdAt') || new Date(),
      updatedAt: result.get('updatedAt') || new Date()
    };
  } catch (error: any) {
    console.error('创建游戏失败:', error);
    throw new Error(`创建游戏失败: ${error.message}`);
  }
};

/**
 * 更新游戏信息
 * @param gameId 游戏ID
 * @param gameData 游戏数据
 * @returns 更新后的游戏
 */
export const updateGame = async (gameId: string, gameData: GameForm): Promise<Game> => {
  try {
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }
    
    const game = AV.Object.createWithoutData('Game', gameId);
    
    // 检查权限 - 只有创建者能编辑
    const query = new AV.Query('Game');
    const existingGame = await query.get(gameId);
    const createdBy = existingGame.get('createdBy');
    
    if (createdBy?.id !== currentUser.id && createdBy !== currentUser.id) {
      throw new Error('没有权限编辑此游戏');
    }
    
    game.set('name', gameData.name);
    game.set('minPlayers', gameData.minPlayers);
    game.set('maxPlayers', gameData.maxPlayers);
    game.set('platform', gameData.platform || '');
    game.set('description', gameData.description || '');
    game.set('type', gameData.type || '');
    
    const result = await game.save();
    
    // 清除游戏相关缓存，确保更新的数据能被正确获取
    clearGamesCaches();
    
    return {
      objectId: result.id || '',
      name: result.get('name') || '',
      minPlayers: result.get('minPlayers') || 0,
      maxPlayers: result.get('maxPlayers') || 0,
      platform: result.get('platform') || '',
      description: result.get('description') || '',
      type: result.get('type') || '',
      likeCount: result.get('likeCount') || 0,
      createdBy: createdBy?.id || createdBy || '',
      createdAt: result.get('createdAt') || new Date(),
      updatedAt: result.get('updatedAt') || new Date()
    };
  } catch (error: any) {
    console.error('更新游戏失败:', error);
    throw new Error(`更新游戏失败: ${error.message}`);
  }
};

/**
 * 删除游戏
 * @param gameId 游戏ID
 */
export const deleteGame = async (gameId: string): Promise<void> => {
  try {
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }
    
    // 检查权限 - 只有创建者能删除
    const query = new AV.Query('Game');
    const game = await query.get(gameId);
    const createdBy = game.get('createdBy');
    
    if (createdBy?.id !== currentUser.id && createdBy !== currentUser.id) {
      throw new Error('没有权限删除此游戏');
    }
    
    await game.destroy();
    
    // 清除游戏相关缓存，确保删除的游戏不再出现在列表中
    clearGamesCaches();
  } catch (error: any) {
    console.error('删除游戏失败:', error);
    throw new Error(`删除游戏失败: ${error.message}`);
  }
};

/**
 * 点赞游戏
 * @param gameId 游戏ID
 */
export const likeGame = async (gameId: string): Promise<void> => {
  try {
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }
    
    const game = AV.Object.createWithoutData('Game', gameId);
    game.increment('likeCount', 1);
    await game.save();
    
    // 清除游戏相关缓存，确保点赞数更新
    clearGamesCaches();
  } catch (error: any) {
    console.error('点赞失败:', error);
    throw new Error(`点赞失败: ${error.message}`);
  }
};

/**
 * 取消点赞游戏
 * @param gameId 游戏ID
 */
export const unlikeGame = async (gameId: string): Promise<void> => {
  try {
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }
    
    const game = AV.Object.createWithoutData('Game', gameId);
    game.increment('likeCount', -1);
    await game.save();
    
    // 清除游戏相关缓存，确保点赞数更新
    clearGamesCaches();
  } catch (error: any) {
    console.error('取消点赞失败:', error);
    throw new Error(`取消点赞失败: ${error.message}`);
  }
};

/**
 * 获取用户收藏的游戏列表
 * @returns 收藏的游戏列表
 */
export const getFavoriteGames = async (): Promise<Game[]> => {
  try {
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }
    
    const favoriteGameIds = currentUser.get('favoriteGames') || [];
    if (favoriteGameIds.length === 0) {
      return [];
    }
    
    const query = new AV.Query('Game');
    query.containedIn('objectId', favoriteGameIds);
    query.include('createdBy');
    
    const results = await query.find();
    
    return results.map(item => ({
      objectId: item.id || '',
      name: item.get('name') || '',
      minPlayers: item.get('minPlayers') || 0,
      maxPlayers: item.get('maxPlayers') || 0,
      platform: item.get('platform') || '',
      description: item.get('description') || '',
      type: item.get('type') || '',
      likeCount: item.get('likeCount') || 0,
      createdBy: item.get('createdBy')?.id || item.get('createdBy') || '',
      createdAt: item.get('createdAt') || new Date(),
      updatedAt: item.get('updatedAt') || new Date()
    }));
  } catch (error: any) {
    // 如果是数据表不存在的错误，返回空数组
    if (error.code === 404) {
      console.log('Game表还不存在，返回空的收藏列表');
      return [];
    }
    console.error('获取收藏游戏失败:', error);
    throw new Error(`获取收藏游戏失败: ${error.message}`);
  }
};

/**
 * 批量导入游戏
 * @param games 游戏数据数组
 * @returns 导入结果
 */
export const batchImportGames = async (games: GameForm[]): Promise<BatchImportResult> => {
  const result: BatchImportResult = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  const currentUser = AV.User.current();
  if (!currentUser) {
    throw new Error('用户未登录');
  }
  
  for (const gameData of games) {
    try {
      await createGame(gameData);
      result.success++;
    } catch (error: any) {
      result.failed++;
      result.errors.push(`${gameData.name}: ${error.message}`);
    }
  }
  
  return result;
};

/**
 * 获取游戏平台列表（用于筛选）
 */
export const getGamePlatforms = async (): Promise<string[]> => {
  try {
    const query = new AV.Query('Game');
    query.select('platform');
    const results = await query.find();
    
    const platforms = new Set<string>();
    results.forEach(game => {
      const platform = game.get('platform');
      if (platform && platform.trim() !== '') {
        platforms.add(platform);
      }
    });
    
    return Array.from(platforms).sort();
  } catch (error: any) {
    // 如果是数据表不存在的错误，返回空数组
    if (error.code === 404) {
      console.log('Game表还不存在，返回空的平台列表');
      return [];
    }
    console.error('获取游戏平台列表失败:', error);
    throw new Error(`获取游戏平台列表失败: ${error.message}`);
  }
};

/**
 * 获取游戏类型列表（用于筛选）
 */
export const getGameTypes = async (): Promise<string[]> => {
  try {
    const query = new AV.Query('Game');
    query.select('type');
    const results = await query.find();
    
    const types = new Set<string>();
    results.forEach(game => {
      const type = game.get('type');
      if (type && type.trim() !== '') {
        types.add(type);
      }
    });
    
    return Array.from(types).sort();
  } catch (error: any) {
    // 如果是数据表不存在的错误，返回空数组
    if (error.code === 404) {
      console.log('Game表还不存在，返回空的类型列表');
      return [];
    }
    console.error('获取游戏类型列表失败:', error);
    throw new Error(`获取游戏类型列表失败: ${error.message}`);
  }
};

/**
 * 获取所有游戏（不受筛选条件影响）
 * @returns 所有游戏列表
 */
export const getAllGames = async (): Promise<Game[]> => {
  try {
    // 使用缓存中的增强游戏数据
    const allEnhancedGames = await getEnhancedGames();
    return allEnhancedGames;
  } catch (error: any) {
    // 如果是数据表不存在的错误，返回空结果
    if (error.code === 404) {
      console.log('Game表还不存在，返回空结果');
      return [];
    }
    console.error('获取所有游戏失败:', error);
    throw new Error(`获取所有游戏失败: ${error.message}`);
  }
}; 