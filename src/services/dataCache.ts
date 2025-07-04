/**
 * 数据缓存和批量查询服务
 * 用于优化数据查询性能，减少API并发请求
 */

import AV from './leancloud';
import { Game } from '../types/game';
import { DailyVote } from '../types/vote';

// 缓存接口定义
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number; // 毫秒
}

interface GameFavoriteData {
  gameId: string;
  favoriteCount: number;
}

interface UserFavoriteMap {
  [userId: string]: string[]; // 用户ID -> 收藏的游戏ID数组
}

// 内存缓存
class DataCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  
  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // 默认5分钟缓存
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: ttl
    });
  }
  
  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  /**
   * 清除缓存
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
  
  /**
   * 获取所有缓存键
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * 检查键是否存在且未过期
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

// 全局缓存实例
const dataCache = new DataCache();

/**
 * 批量获取游戏收藏数据
 * 一次性获取所有用户的收藏数据，然后本地计算每个游戏的收藏数
 */
export const getGamesFavoriteData = async (): Promise<GameFavoriteData[]> => {
  const cacheKey = 'games_favorite_data';
  
  // 检查缓存
  const cached = dataCache.get<GameFavoriteData[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    // 方案1：尝试通过UserFavorite表获取（如果存在的话）
    let favoriteData: GameFavoriteData[] = [];
    
    try {
      const favoriteQuery = new AV.Query('UserFavorite');
      favoriteQuery.limit(10000); // 获取大量数据
      const favorites = await favoriteQuery.find();
      
      // 统计每个游戏的收藏数
      const favoriteCountMap = new Map<string, number>();
      favorites.forEach(favorite => {
        const gameId = favorite.get('game');
        if (gameId) {
          favoriteCountMap.set(gameId, (favoriteCountMap.get(gameId) || 0) + 1);
        }
      });
      
      favoriteData = Array.from(favoriteCountMap.entries()).map(([gameId, count]) => ({
        gameId,
        favoriteCount: count
      }));
      
      console.log(`通过UserFavorite表获取到 ${favoriteData.length} 个游戏的收藏数据`);
      
    } catch (userFavoriteError) {
      console.log('UserFavorite表不存在或查询失败，尝试其他方案:', userFavoriteError);
      
      // 方案2：如果UserFavorite表不存在，获取所有用户的favoriteGames字段
      try {
        const userQuery = new AV.Query('_User');
        userQuery.exists('favoriteGames');
        userQuery.select('favoriteGames');
        userQuery.limit(10000);
        
        const users = await userQuery.find();
        
        // 统计每个游戏的收藏数
        const favoriteCountMap = new Map<string, number>();
        
        users.forEach(user => {
          const favoriteGames = user.get('favoriteGames') || [];
          favoriteGames.forEach((gameId: string) => {
            favoriteCountMap.set(gameId, (favoriteCountMap.get(gameId) || 0) + 1);
          });
        });
        
        favoriteData = Array.from(favoriteCountMap.entries()).map(([gameId, count]) => ({
          gameId,
          favoriteCount: count
        }));
        
        console.log(`通过用户favoriteGames字段获取到 ${favoriteData.length} 个游戏的收藏数据`);
        
      } catch (userQueryError) {
        console.log('_User表查询失败，使用默认收藏数据', userQueryError);
        
        // 方案3：如果查询失败，使用空数据
        try {
          const gameQuery = new AV.Query('Game');
          gameQuery.select('objectId');
          gameQuery.limit(10000);
          const games = await gameQuery.find();
          
          favoriteData = games.map(game => ({
            gameId: game.id || '',
            favoriteCount: 0
          }));
          
          console.log(`为 ${favoriteData.length} 个游戏设置默认收藏数0`);
        } catch (gameError) {
          console.log('Game表查询失败，返回空数据:', gameError);
          favoriteData = [];
        }
      }
    }
    
    // 缓存结果（5分钟缓存，因为收藏数据变化不频繁）
    dataCache.set(cacheKey, favoriteData, 5 * 60 * 1000);
    
    return favoriteData;
  } catch (error) {
    console.error('获取游戏收藏数据失败:', error);
    return [];
  }
};

/**
 * 批量获取游戏信息
 * 支持缓存，避免重复查询
 */
export const getBatchGames = async (gameIds: string[]): Promise<Game[]> => {
  if (gameIds.length === 0) return [];
  
  const cacheKey = `batch_games_${gameIds.sort().join(',')}`;
  
  // 检查缓存
  const cached = dataCache.get<Game[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    const query = new AV.Query('Game');
    query.containedIn('objectId', gameIds);
    query.limit(1000);
    query.include('createdBy');
    
    const results = await query.find();
    
    const games: Game[] = results.map(game => ({
      objectId: game.id || '',
      name: game.get('name') || '',
      minPlayers: game.get('minPlayers') || 0,
      maxPlayers: game.get('maxPlayers') || 0,
      platform: game.get('platform') || '',
      description: game.get('description') || '',
      type: game.get('type') || '',
      likeCount: game.get('likeCount') || 0,
      favoriteCount: 0, // 将通过其他方式计算
      hotScore: 0, // 将通过其他方式计算
      createdBy: game.get('createdBy')?.id || game.get('createdBy') || '',
      createdAt: game.get('createdAt') || new Date(),
      updatedAt: game.get('updatedAt') || new Date()
    }));
    
    // 缓存结果（10分钟缓存）
    dataCache.set(cacheKey, games, 10 * 60 * 1000);
    
    return games;
  } catch (error) {
    console.error('批量获取游戏信息失败:', error);
    return [];
  }
};

/**
 * 获取增强的游戏数据（包含收藏数和热度分数）
 */
export const getEnhancedGames = async (gameIds?: string[]): Promise<Game[]> => {
  try {
    // 并行获取游戏基础数据和收藏数据
    const [gamesData, favoriteData] = await Promise.all([
      gameIds ? getBatchGames(gameIds) : getAllGames(),
      getGamesFavoriteData()
    ]);
    
    // 创建收藏数映射
    const favoriteMap = new Map<string, number>();
    favoriteData.forEach(item => {
      favoriteMap.set(item.gameId, item.favoriteCount);
    });
    
    // 为每个游戏添加收藏数和计算热度分数
    const enhancedGames = gamesData.map(game => {
      const favoriteCount = favoriteMap.get(game.objectId) || 0;
      const likeCount = game.likeCount || 0;
      
      // 计算综合热度分数
      const createdAt = game.createdAt || new Date();
      const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const timeFactor = Math.max(0, 30 - daysSinceCreated) / 30; // 30天内的时间加成
      const hotScore = (likeCount * 0.6 + favoriteCount * 0.4) * (1 + timeFactor * 0.2);
      
      return {
        ...game,
        favoriteCount,
        hotScore: Number(hotScore.toFixed(2))
      };
    });
    
    return enhancedGames;
  } catch (error) {
    console.error('获取增强游戏数据失败:', error);
    return [];
  }
};

/**
 * 获取所有游戏数据
 */
const getAllGames = async (): Promise<Game[]> => {
  const cacheKey = 'all_games';
  
  // 检查缓存
  const cached = dataCache.get<Game[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    const query = new AV.Query('Game');
    query.limit(10000);
    query.include('createdBy');
    
    const results = await query.find();
    
    const games: Game[] = results.map(game => ({
      objectId: game.id || '',
      name: game.get('name') || '',
      minPlayers: game.get('minPlayers') || 0,
      maxPlayers: game.get('maxPlayers') || 0,
      platform: game.get('platform') || '',
      description: game.get('description') || '',
      type: game.get('type') || '',
      likeCount: game.get('likeCount') || 0,
      favoriteCount: 0,
      hotScore: 0,
      createdBy: game.get('createdBy')?.id || game.get('createdBy') || '',
      createdAt: game.get('createdAt') || new Date(),
      updatedAt: game.get('updatedAt') || new Date()
    }));
    
    // 缓存结果（5分钟缓存）
    dataCache.set(cacheKey, games, 5 * 60 * 1000);
    
    return games;
  } catch (error) {
    console.error('获取所有游戏数据失败:', error);
    return [];
  }
};

/**
 * 获取最近的投票数据
 * 一次性获取多天数据以减少请求数量
 */
export const getBatchVoteStats = async (days: number = 7): Promise<{[date: string]: any}> => {
  const cacheKey = `batch_vote_stats_${days}`;
  
  // 检查缓存
  const cached = dataCache.get<{[date: string]: any}>(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    // 计算日期范围
    const dates: string[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // 查询这个日期范围内的所有投票
    const query = new AV.Query('DailyVote');
    query.containedIn('date', dates);
    query.limit(10000); // 获取足够多的数据
    
    const results = await query.find();
    
    // 按日期分组投票数据
    const votesByDate: {[date: string]: any[]} = {};
    dates.forEach(date => {
      votesByDate[date] = [];
    });
    
    results.forEach(vote => {
      const date = vote.get('date');
      if (votesByDate[date]) {
        votesByDate[date].push(vote);
      }
    });
    
    // 处理每天的投票数据
    const statsMap: {[date: string]: any} = {};
    
    // 获取所有相关的游戏ID
    const gameIds = new Set<string>();
    results.forEach(vote => {
      const selectedGames = vote.get('selectedGames') || [];
      selectedGames.forEach((gameId: string) => {
        gameIds.add(gameId);
      });
    });
    
    // 一次性查询所有相关游戏的信息
    const gameInfoMap = new Map<string, {id: string, name: string}>();
    if (gameIds.size > 0) {
      const gameQuery = new AV.Query('Game');
      gameQuery.containedIn('objectId', Array.from(gameIds));
      // 只选择需要的字段
      gameQuery.select('name');
      
      const games = await gameQuery.find();
      games.forEach(game => {
        gameInfoMap.set(game.id || '', {
          id: game.id || '',
          name: game.get('name') || '未知游戏'
        });
      });
    }
    
    // 处理每天的数据
    Object.entries(votesByDate).forEach(([date, votes]) => {
      let totalVotes = votes.length;
      let wantToPlayCount = 0;
      const gameVoteCounts: Record<string, number> = {};
      const gameTendencies: Record<string, {total: number, count: number}> = {};
      
      votes.forEach(vote => {
        if (vote.get('wantsToPlay')) {
          wantToPlayCount++;
        }
        
        // 处理投票的游戏
        const selectedGames = vote.get('selectedGames') || [];
        selectedGames.forEach((gameId: string) => {
          gameVoteCounts[gameId] = (gameVoteCounts[gameId] || 0) + 1;
        });
        
        // 处理游戏倾向度
        const gamePreferences = vote.get('gamePreferences') || [];
        gamePreferences.forEach((pref: {gameId: string, tendency: number}) => {
          if (!gameTendencies[pref.gameId]) {
            gameTendencies[pref.gameId] = {total: 0, count: 0};
          }
          gameTendencies[pref.gameId].total += pref.tendency;
          gameTendencies[pref.gameId].count++;
        });
      });
      
      // 计算平均倾向度
      const averageTendencies: Record<string, {averageTendency: number, tendencyCount: number}> = {};
      Object.entries(gameTendencies).forEach(([gameId, stats]) => {
        averageTendencies[gameId] = {
          averageTendency: stats.total / stats.count,
          tendencyCount: stats.count
        };
      });
      
      // 计算每天的topGames
      const topGames = Object.entries(gameVoteCounts)
        .map(([gameId, voteCount]) => ({
          gameId,
          gameName: gameInfoMap.get(gameId)?.name || '未知游戏',
          voteCount,
          averageTendency: averageTendencies[gameId]?.averageTendency
        }))
        .sort((a, b) => b.voteCount - a.voteCount)
        .slice(0, 10);
      
      statsMap[date] = {
        date,
        totalVotes,
        wantToPlayCount,
        gameVoteCounts,
        topGames,
        gameTendencies: averageTendencies
      };
    });
    
    // 缓存结果（15分钟缓存）
    dataCache.set(cacheKey, statsMap, 15 * 60 * 1000);
    
    return statsMap;
  } catch (error) {
    console.error('批量获取投票统计失败:', error);
    // 返回空对象
    const emptyStats: {[date: string]: any} = {};
    return emptyStats;
  }
};

/**
 * 生成优化的缓存键值
 * @param userId 用户ID
 * @param date 日期字符串 (YYYY-MM-DD)
 * @returns 优化的缓存键值
 */
const generateOptimizedCacheKey = (userId: string, date: string): string => {
  // 添加时区信息和版本号，确保缓存键值的唯一性
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const version = 'v2'; // 缓存版本，用于强制更新缓存结构
  return `user_vote_${version}_${userId}_${date}_${timezone.replace(/\//g, '_')}`;
};

/**
 * 检查并清理过期的投票缓存
 * @param userId 用户ID
 */
const cleanupExpiredVoteCaches = (userId: string): void => {
  const today = new Date().toISOString().split('T')[0];
  const allKeys = dataCache.keys();
  
  // 查找该用户的所有投票缓存
  const userVoteKeys = allKeys.filter(key => 
    key.includes(`user_vote_`) && key.includes(`_${userId}_`)
  );
  
  userVoteKeys.forEach(key => {
    // 提取缓存中的日期
    const dateMatch = key.match(/_([0-9]{4}-[0-9]{2}-[0-9]{2})_/);
    if (dateMatch) {
      const cacheDate = dateMatch[1];
      // 如果不是今天的缓存，清除它
      if (cacheDate !== today) {
        dataCache.clear(key);
        console.log(`已清除过期投票缓存: ${key}`);
      }
    }
  });
};

/**
 * 获取用户今日投票（优化版）
 * @param userId 用户ID
 */
export const getCachedTodayVote = async (userId: string): Promise<DailyVote | null> => {
  const today = new Date().toISOString().split('T')[0];
  
  // 首先清理过期缓存
  cleanupExpiredVoteCaches(userId);
  
  const cacheKey = generateOptimizedCacheKey(userId, today);
  
  // 检查缓存
  const cached = dataCache.get<DailyVote>(cacheKey);
  if (cached) {
    // 额外验证：确保缓存的日期与今天匹配
    if (cached.date === today) {
      return cached;
    } else {
      // 如果日期不匹配，清除这个缓存
      dataCache.clear(cacheKey);
      console.log(`检测到日期不匹配的缓存，已清除: ${cacheKey}`);
    }
  }
  
  // 查询用户今日的投票数据
  try {
    // 优先按userId查询（新版本），如果没有则按user查询（兼容旧版本）
    const orQuery1 = new AV.Query('DailyVote');
    orQuery1.equalTo('userId', userId);
    orQuery1.equalTo('date', today);
    
    const orQuery2 = new AV.Query('DailyVote');
    orQuery2.equalTo('user', userId);
    orQuery2.equalTo('date', today);
    
    const query = AV.Query.or(orQuery1, orQuery2);
    query.descending('createdAt');
    
    const result = await query.first();
    
    if (!result) {
      return null;
    }
    
    const vote: DailyVote = {
      objectId: result.id || '',
      date: result.get('date'),
      user: result.get('user'),
      userId: result.get('userId'),
      wantsToPlay: result.get('wantsToPlay'),
      selectedGames: result.get('selectedGames') || [],
      gamePreferences: result.get('gamePreferences') || [],
      createdAt: result.get('createdAt'),
      updatedAt: result.get('updatedAt'),
    };
    
    // 缓存结果（优化缓存时间：直到当天结束）
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const timeUntilEndOfDay = endOfDay.getTime() - now.getTime();
    
    // 使用较短的缓存时间和当天结束时间中的较小值
    const cacheTime = Math.min(30 * 60 * 1000, timeUntilEndOfDay); // 最多30分钟，或到当天结束
    dataCache.set(cacheKey, vote, cacheTime);
    
    console.log(`投票缓存已设置，过期时间: ${new Date(now.getTime() + cacheTime).toLocaleString()}`);
    
    return vote;
  } catch (error) {
    console.error('获取用户今日投票失败:', error);
    return null;
  }
};

/**
 * 清除相关缓存（在数据更新后调用）
 */
export const clearGamesCaches = (): void => {
  dataCache.clear('games_favorite_data');
  dataCache.clear('all_games');
  // 清除批量游戏缓存（模糊匹配）
  dataCache.keys().forEach(key => {
    if (key.startsWith('batch_games_')) {
      dataCache.clear(key);
    }
  });
  console.log('游戏相关缓存已清除');
};

/**
 * 清除投票相关缓存（优化版）
 * @param userId 可选，指定用户ID只清除该用户的缓存
 */
export const clearVotesCaches = (userId?: string): void => {
  const allKeys = dataCache.keys();
  let clearedCount = 0;
  
  allKeys.forEach(key => {
    let shouldClear = false;
    
    // 清除批量投票统计缓存
    if (key.startsWith('batch_vote_stats_')) {
      shouldClear = true;
    }
    
    // 清除用户投票缓存（支持新旧格式）
    if (key.includes('user_vote_')) {
      if (userId) {
        // 如果指定了用户ID，只清除该用户的缓存
        if (key.includes(`_${userId}_`)) {
          shouldClear = true;
        }
      } else {
        // 如果没有指定用户ID，清除所有用户投票缓存
        shouldClear = true;
      }
    }
    
    if (shouldClear) {
      dataCache.clear(key);
      clearedCount++;
      console.log(`已清除投票缓存: ${key}`);
    }
  });
  
  const userInfo = userId ? `用户${userId}的` : '所有';
  console.log(`${userInfo}投票相关缓存已清除 (${clearedCount}个条目)`);
};

/**
 * 缓存健康检查和清理
 * 定期清理过期缓存，检查缓存一致性
 */
export const performCacheHealthCheck = (): void => {
  console.log('开始执行缓存健康检查...');
  
  const allKeys = dataCache.keys();
  const today = new Date().toISOString().split('T')[0];
  let cleanedCount = 0;
  
  allKeys.forEach(key => {
    // 检查投票缓存的日期一致性
    if (key.includes('user_vote_')) {
      const dateMatch = key.match(/_([0-9]{4}-[0-9]{2}-[0-9]{2})_/);
      if (dateMatch) {
        const cacheDate = dateMatch[1];
        if (cacheDate !== today) {
          dataCache.clear(key);
          cleanedCount++;
          console.log(`健康检查：清除过期投票缓存 ${key}`);
        }
      }
    }
    
    // 检查旧版本缓存格式
    if (key.startsWith('user_vote_') && !key.includes('_v2_')) {
      dataCache.clear(key);
      cleanedCount++;
      console.log(`健康检查：清除旧版本缓存 ${key}`);
    }
  });
  
  console.log(`缓存健康检查完成，清理了 ${cleanedCount} 个过期/无效缓存`);
};

/**
 * 预热缓存（应用启动时调用）
 */
export const warmupCaches = async (): Promise<void> => {
  try {
    console.log('开始预热数据缓存...');
    
    // 首先执行缓存健康检查
    performCacheHealthCheck();
    
    // 并行预热主要数据
    await Promise.all([
      getGamesFavoriteData(),
      getAllGames(),
      getBatchVoteStats(7)
    ]);
    
    console.log('数据缓存预热完成');
  } catch (error) {
    console.error('缓存预热失败:', error);
  }
};

/**
 * 启动定期缓存清理任务
 * 每小时执行一次缓存健康检查
 */
export const startCacheCleanupScheduler = (): void => {
  // 立即执行一次
  performCacheHealthCheck();
  
  // 设置定期清理（每小时）
  setInterval(() => {
    performCacheHealthCheck();
  }, 60 * 60 * 1000); // 1小时
  
  console.log('缓存清理调度器已启动，将每小时执行一次健康检查');
};

/**
 * 清除所有缓存
 * 用于解决403权限问题和数据同步问题
 */
export const clearAllCaches = (): void => {
  console.log('开始清除所有缓存...');
  
  // 清除内存缓存
  dataCache.clear();
  console.log('✅ 内存缓存已清除');
  
  // 清除localStorage中的相关数据
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('game') || 
        key.includes('vote') || 
        key.includes('team') || 
        key.includes('favorite') ||
        key.includes('leancloud')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    if (keysToRemove.length > 0) {
      console.log(`✅ localStorage缓存已清除 (${keysToRemove.length}个条目)`);
    }
  } catch (error) {
    console.warn('清除localStorage缓存时出现问题:', error);
  }
  
  // 清除sessionStorage中的相关数据
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.includes('game') || 
        key.includes('vote') || 
        key.includes('team') || 
        key.includes('favorite') ||
        key.includes('leancloud')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    if (keysToRemove.length > 0) {
      console.log(`✅ sessionStorage缓存已清除 (${keysToRemove.length}个条目)`);
    }
  } catch (error) {
    console.warn('清除sessionStorage缓存时出现问题:', error);
  }
  
  console.log('🎯 所有缓存清除完成');
};

export default dataCache;