/**
 * 每日投票服务层
 * 提供投票相关的数据操作接口
 */

import AV from 'leancloud-storage';
import { DailyVote, VoteForm, VoteStats, GamePreference } from '../types/vote';
import { initDailyVoteTable } from '../utils/initData';
import { getCachedTodayVote, getBatchVoteStats, clearVotesCaches } from './dataCache';

/**
 * 获取今日用户投票记录
 * @param userId 用户ID
 * @returns 今日投票记录或null
 */
export const getTodayVote = async (userId: string): Promise<DailyVote | null> => {
  try {
    // 首先尝试从缓存获取
    const cachedVote = await getCachedTodayVote(userId);
    if (cachedVote) {
      return cachedVote;
    }
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const query = new AV.Query('DailyVote');
    // 优先按userId查询（新版本），如果没有则按user查询（兼容旧版本）
    const orQuery1 = new AV.Query('DailyVote');
    orQuery1.equalTo('userId', userId);
    orQuery1.equalTo('date', today);
    
    const orQuery2 = new AV.Query('DailyVote');
    orQuery2.equalTo('user', userId);
    orQuery2.equalTo('date', today);
    
    const mainQuery = AV.Query.or(orQuery1, orQuery2);
    mainQuery.descending('createdAt');
    
    const result = await mainQuery.first();
    
    if (!result) {
      return null;
    }
    
    return {
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
  } catch (error: any) {
    console.error('获取今日投票失败:', error);
    
    // 如果是404错误（表不存在），尝试初始化表
    if (error.code === 404) {
      console.log('DailyVote表不存在，尝试自动创建...');
      try {
        await initDailyVoteTable();
        console.log('DailyVote表创建成功，重新尝试查询...');
        // 重新执行查询
        return await getTodayVote(userId);
      } catch (initError) {
        console.error('自动创建DailyVote表失败:', initError);
      }
    }
    
    throw error;
  }
};

/**
 * 验证投票记录是否在数据库中真实存在
 * @param voteId 投票记录ID
 * @returns 是否存在
 */
export const verifyVoteExists = async (voteId: string): Promise<boolean> => {
  try {
    const query = new AV.Query('DailyVote');
    const result = await query.get(voteId);
    return !!result;
  } catch (error: any) {
    console.log(`验证投票记录 ${voteId} 不存在:`, error.code);
    return false;
  }
};

/**
 * 投票提交前的缓存验证和清理
 * @param userId 用户ID
 * @returns 清理后的状态
 */
export const validateAndCleanVoteCache = async (userId: string): Promise<{ shouldCreateNew: boolean; cachedVote: DailyVote | null }> => {
  console.log('🔍 开始执行投票提交前验证...');
  
  // 获取缓存中的投票记录
  const cachedVote = await getCachedTodayVote(userId);
  
  if (!cachedVote) {
    console.log('✅ 缓存中无投票记录，将创建新记录');
    return { shouldCreateNew: true, cachedVote: null };
  }
  
  // 验证缓存中的记录是否在数据库中真实存在
  const exists = await verifyVoteExists(cachedVote.objectId);
  
  if (!exists) {
    console.log('❌ 缓存中的投票记录在数据库中不存在，清除缓存并准备创建新记录');
    // 清除该用户的投票缓存
    clearVotesCaches(userId);
    return { shouldCreateNew: true, cachedVote: null };
  }
  
  console.log('✅ 缓存中的投票记录验证通过，将更新现有记录');
  return { shouldCreateNew: false, cachedVote };
};

/**
 * 页面初始化时的缓存验证和清理
 * @param userId 用户ID
 * @returns 是否需要显示警告提示
 */
export const validateCacheOnPageInit = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    // 动态导入缓存相关函数
    const { 
      getCachedTodayVote, 
      clearVotesCaches, 
      performCacheHealthCheck 
    } = await import('./dataCache');
    
    console.log('🔍 开始执行增强的缓存检查...');
    
    // 执行全局缓存健康检查
    performCacheHealthCheck();
    
    // 检查当前用户的投票缓存
    const cachedVote = await getCachedTodayVote(userId);
    const today = new Date().toISOString().split('T')[0];
    
    if (cachedVote) {
      // 1. 检查缓存日期是否匹配
      if (cachedVote.date !== today) {
        console.warn(`❌ 检测到日期不匹配的缓存: 缓存日期=${cachedVote.date}, 今日=${today}`);
        clearVotesCaches(userId);
        console.log('✅ 已清除该用户的过期投票缓存');
        return false;
      } else {
        console.log('✅ 投票缓存日期检查通过');
        
        // 2. 验证缓存中的投票记录是否在数据库中真实存在
        console.log('🔍 开始验证缓存投票记录的真实性...');
        const exists = await verifyVoteExists(cachedVote.objectId);
        
        if (!exists) {
          console.warn(`❌ 缓存中的投票记录 ${cachedVote.objectId} 在数据库中不存在，清除缓存`);
          clearVotesCaches(userId);
          console.log('✅ 已清除无效的投票缓存');
          return true; // 返回true表示需要显示警告提示
        } else {
          console.log('✅ 缓存投票记录验证通过，数据库中存在对应记录');
        }
      }
    } else {
      console.log('🔍 缓存中无投票记录');
    }
    
    console.log('🎯 增强的缓存检查完成');
    return false;
  } catch (error) {
    console.error('❌ 缓存检查过程中发生错误:', error);
    return false;
  }
};

/**
 * 表单提交前的简化验证
 * @param userId 用户ID
 * @returns 是否通过验证
 */
export const validateBeforeSubmit = async (userId: string): Promise<boolean> => {
  if (!userId) {
    console.error('❌ 用户未登录');
    return false;
  }

  try {
    // 如果存在缓存的投票记录，验证其真实性
    const { getCachedTodayVote, clearVotesCaches } = await import('./dataCache');
    const cachedVote = await getCachedTodayVote(userId);
    
    if (cachedVote) {
      console.log('🔍 提交前验证缓存记录的真实性...');
      const exists = await verifyVoteExists(cachedVote.objectId);
      
      if (!exists) {
        console.warn('❌ 提交前检测到缓存记录不存在，自动清除缓存');
        clearVotesCaches(userId);
        console.log('✅ 缓存已清除，将创建新记录');
      } else {
        console.log('✅ 提交前验证通过，缓存记录有效');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ 提交前验证失败:', error);
    return true; // 即使验证失败，也允许提交，让后续逻辑处理
  }
};

/**
 * 提交今日投票
 * @param userId 用户ID
 * @param voteForm 投票表单数据
 * @returns 投票记录
 */
export const submitTodayVote = async (userId: string, voteForm: VoteForm): Promise<DailyVote> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 获取当前用户信息，用于存储昵称
    const currentUser = AV.User.current();
    const userName = currentUser?.get('nickname') || currentUser?.get('username') || `用户${userId.slice(-4)}`;
    
    console.log('🚀 开始提交投票，执行预验证...');
    
    // 🔍 投票提交前验证：检查缓存记录的真实性
    const { shouldCreateNew, cachedVote } = await validateAndCleanVoteCache(userId);
    
    let vote: AV.Object | null = null;
    let isUpdating = false;
    
    if (!shouldCreateNew && cachedVote) {
      // 缓存记录验证通过，准备更新现有记录
      try {
        console.log(`📝 准备更新现有投票记录: ${cachedVote.objectId}`);
        vote = AV.Object.createWithoutData('DailyVote', cachedVote.objectId);
        vote.set('wantsToPlay', voteForm.wantsToPlay);
        vote.set('selectedGames', voteForm.selectedGames);
        vote.set('gamePreferences', voteForm.gamePreferences || []);
        // 更新用户昵称（以防用户改了昵称）
        vote.set('user', userName);
        vote.set('userId', userId);
        isUpdating = true;
        console.log('✅ 更新对象创建成功');
      } catch (error) {
        console.warn('❌ 创建更新对象失败，将创建新记录:', error);
        vote = null;
        isUpdating = false;
      }
    }
    
    // 如果验证失败或需要创建新记录
    if (shouldCreateNew || !vote) {
      console.log('📝 创建新的投票记录');
      vote = new AV.Object('DailyVote');
      vote.set('date', today);
      vote.set('user', userName);  // 存储用户昵称
      vote.set('userId', userId);  // 存储用户ID用于查询
      vote.set('wantsToPlay', voteForm.wantsToPlay);
      vote.set('selectedGames', voteForm.selectedGames);
      vote.set('gamePreferences', voteForm.gamePreferences || []);
      isUpdating = false;
    }
    
    let result: AV.Object;
    
    try {
      console.log(`💾 开始保存投票记录 (${isUpdating ? '更新' : '创建'})`);
      result = await vote.save();
      console.log('✅ 投票保存成功:', result.id);
    } catch (saveError: any) {
      console.error('❌ 保存投票时发生错误:', saveError);
      
      // 如果是404错误（记录不存在），强制清除缓存并创建新记录
      if (saveError.code === 404) {
        console.warn('🔄 投票记录不存在（404错误），强制清除缓存并创建新记录');
        console.log('错误详情:', {
          code: saveError.code,
          message: saveError.message,
          isUpdating,
          voteId: isUpdating ? vote?.id : 'new'
        });
        
        // 🧹 强制清除所有相关缓存
        console.log('🧹 强制清除所有相关缓存...');
        clearVotesCaches(userId);  // 清除用户投票缓存
        clearVotesCaches();        // 清除所有投票统计缓存
        console.log('✅ 缓存清除完成');
        
        // 💪 无论什么情况，都创建新记录
        console.log('🔄 创建全新的投票记录...');
        vote = new AV.Object('DailyVote');
        vote.set('date', today);
        vote.set('user', userName);
        vote.set('userId', userId);
        vote.set('wantsToPlay', voteForm.wantsToPlay);
        vote.set('selectedGames', voteForm.selectedGames);
        vote.set('gamePreferences', voteForm.gamePreferences || []);
        
        try {
          result = await vote.save();
          console.log('✅ 新投票记录创建成功:', result.id);
        } catch (retryError: any) {
          console.error('❌ 重试创建投票记录失败:', retryError);
          throw retryError;
        }
      } else {
        // 其他错误，直接抛出
        console.error('❌ 非404错误，直接抛出:', saveError);
        throw saveError;
      }
    }
    
    // 🧹 清除相关缓存以确保数据同步
    clearVotesCaches(userId);
    
    const finalVote: DailyVote = {
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
    
    console.log('🎉 投票提交完成:', finalVote.objectId);
    return finalVote;
    
  } catch (error: any) {
    console.error('❌ 提交投票失败:', error);
    
    // 如果是404错误（表不存在），尝试初始化表
    if (error.code === 404 && error.message?.includes('doesn\'t exists')) {
      console.log('📋 DailyVote表不存在，尝试自动创建...');
      try {
        await initDailyVoteTable();
        console.log('✅ DailyVote表创建成功，重新尝试提交...');
        // 重新执行提交
        return await submitTodayVote(userId, voteForm);
      } catch (initError) {
        console.error('❌ 自动创建DailyVote表失败:', initError);
      }
    }
    
    throw error;
  }
};

/**
 * 计算游戏倾向度统计
 * @param votes 投票记录列表
 * @returns 游戏倾向度统计
 */
const calculateGameTendencies = (votes: AV.Object[]): Record<string, { averageTendency: number; tendencyCount: number }> => {
  const tendencyStats: Record<string, { total: number; count: number }> = {};
  
  votes.forEach((vote: AV.Object) => {
    const gamePreferences: GamePreference[] = vote.get('gamePreferences') || [];
    gamePreferences.forEach(pref => {
      if (!tendencyStats[pref.gameId]) {
        tendencyStats[pref.gameId] = { total: 0, count: 0 };
      }
      tendencyStats[pref.gameId].total += pref.tendency;
      tendencyStats[pref.gameId].count += 1;
    });
  });
  
  const result: Record<string, { averageTendency: number; tendencyCount: number }> = {};
  Object.entries(tendencyStats).forEach(([gameId, stats]) => {
    result[gameId] = {
      averageTendency: stats.total / stats.count,
      tendencyCount: stats.count,
    };
  });
  
  return result;
};

/**
 * 获取今日投票统计
 * @returns 今日投票统计数据
 */
export const getTodayVoteStats = async (): Promise<VoteStats> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 从缓存获取批量统计数据
    const batchStats = await getBatchVoteStats(1);
    
    // 如果今日数据在批量数据中
    if (batchStats[today]) {
      return batchStats[today];
    }
    
    // 如果不在批量数据中，使用旧方法获取
    const query = new AV.Query('DailyVote');
    query.equalTo('date', today);
    query.limit(1000); // 假设单日投票不会超过1000条
    
    const votes = await query.find();
    
    let totalVotes = 0;
    let wantToPlayCount = 0;
    const gameVoteCounts: Record<string, number> = {};
    
    votes.forEach((vote) => {
      totalVotes++;
      
      if (vote.get('wantsToPlay')) {
        wantToPlayCount++;
      }
      
      const selectedGames = vote.get('selectedGames') || [];
      selectedGames.forEach((gameId: string) => {
        gameVoteCounts[gameId] = (gameVoteCounts[gameId] || 0) + 1;
      });
    });
    
    // 计算游戏倾向度统计
    const gameTendencies = calculateGameTendencies(votes as any);
    
    // 生成投票用户列表
    const voterList = votes.map((vote) => ({
      userName: vote.get('user') || `用户${(vote.get('userId') || '').slice(-4)}`,
      userId: vote.get('userId'),
      wantsToPlay: vote.get('wantsToPlay') || false,
      votedAt: vote.get('updatedAt') || vote.get('createdAt')
    })).sort((a, b) => b.votedAt.getTime() - a.votedAt.getTime());
    
    // 获取游戏名称，用于topGames
    const gameIds = Object.keys(gameVoteCounts);
    const gameQuery = new AV.Query('Game');
    gameQuery.containedIn('objectId', gameIds);
    const games = await gameQuery.find();
    
    const gameNameMap: Record<string, string> = {};
    games.forEach((game) => {
      const gameId = game.id;
      if (gameId) {
        gameNameMap[gameId] = game.get('name');
      }
    });
    
    // 计算topGames（按投票数排序），包含平均倾向度
    const topGames = Object.entries(gameVoteCounts)
      .map(([gameId, voteCount]) => ({
        gameId,
        gameName: gameNameMap[gameId] || '未知游戏',
        voteCount,
        averageTendency: gameTendencies[gameId]?.averageTendency,
      }))
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 10); // 取前10名
    
    return {
      date: today,
      totalVotes,
      wantToPlayCount,
      gameVoteCounts,
      topGames,
      gameTendencies,
      voterList,
    };
  } catch (error: any) {
    console.error('获取投票统计失败:', error);
    
    // 如果是404错误（表不存在），尝试初始化表并返回空统计
    if (error.code === 404) {
      console.log('DailyVote表不存在，尝试自动创建...');
      try {
        await initDailyVoteTable();
        console.log('DailyVote表创建成功，返回空统计数据');
        // 返回空的统计数据
        const today = new Date().toISOString().split('T')[0];
        return {
          date: today,
          totalVotes: 0,
          wantToPlayCount: 0,
          gameVoteCounts: {},
          topGames: [],
          gameTendencies: {},
          voterList: [],
        };
      } catch (initError) {
        console.error('自动创建DailyVote表失败:', initError);
      }
    }
    
    throw error;
  }
};

/**
 * 获取指定日期的投票统计
 * @param date 日期 (YYYY-MM-DD)
 * @returns 投票统计数据
 */
export const getVoteStatsByDate = async (date: string): Promise<VoteStats> => {
  try {
    // 优先从批量缓存中获取
    const batchStats = await getBatchVoteStats(7); // 获取最近7天的统计
    if (batchStats[date]) {
      return batchStats[date];
    }
    
    // 如果缓存中没有，单独获取
    const query = new AV.Query('DailyVote');
    query.equalTo('date', date);
    query.limit(1000);
    
    const votes = await query.find();
    
    let totalVotes = 0;
    let wantToPlayCount = 0;
    const gameVoteCounts: Record<string, number> = {};
    
    votes.forEach((vote) => {
      totalVotes++;
      
      if (vote.get('wantsToPlay')) {
        wantToPlayCount++;
      }
      
      const selectedGames = vote.get('selectedGames') || [];
      selectedGames.forEach((gameId: string) => {
        gameVoteCounts[gameId] = (gameVoteCounts[gameId] || 0) + 1;
      });
    });
    
    // 计算游戏倾向度统计
    const gameTendencies = calculateGameTendencies(votes as any);
    
    // 获取游戏名称
    const gameIds = Object.keys(gameVoteCounts);
    const gameQuery = new AV.Query('Game');
    gameQuery.containedIn('objectId', gameIds);
    const games = await gameQuery.find();
    
    const gameNameMap: Record<string, string> = {};
    games.forEach((game) => {
      const gameId = game.id;
      if (gameId) {
        gameNameMap[gameId] = game.get('name');
      }
    });
    
    // 计算topGames，包含平均倾向度
    const topGames = Object.entries(gameVoteCounts)
      .map(([gameId, voteCount]) => ({
        gameId,
        gameName: gameNameMap[gameId] || '未知游戏',
        voteCount,
        averageTendency: gameTendencies[gameId]?.averageTendency,
      }))
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 10);
    
    return {
      date,
      totalVotes,
      wantToPlayCount,
      gameVoteCounts,
      topGames,
      gameTendencies,
    };
  } catch (error: any) {
    console.error('获取投票统计失败:', error);
    
    // 如果是404错误（表不存在），返回空统计
    if (error.code === 404) {
      console.log(`DailyVote表不存在，返回日期 ${date} 的空统计数据`);
      return {
        date,
        totalVotes: 0,
        wantToPlayCount: 0,
        gameVoteCounts: {},
        topGames: [],
        gameTendencies: {},
      };
    }
    
    throw error;
  }
};

/**
 * 获取最近N天的投票统计（用于趋势分析）
 * @param days 天数，默认7天
 * @returns 投票统计数据数组
 */
export const getRecentVoteStats = async (days: number = 7): Promise<VoteStats[]> => {
  try {
    // 直接从批量缓存获取所有需要的日期的数据
    const batchStats = await getBatchVoteStats(days);
    
    // 生成日期列表以确保按正确顺序返回数据
    const dates: string[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // 根据日期列表构建结果数组
    const stats: VoteStats[] = dates.map(date => {
      if (batchStats[date]) {
        return batchStats[date];
      } else {
        // 如果没有此日期的数据，返回空统计
        return {
          date,
          totalVotes: 0,
          wantToPlayCount: 0,
          gameVoteCounts: {},
          topGames: [],
          gameTendencies: {},
        };
      }
    });
    
    return stats;
  } catch (error) {
    console.error('获取最近投票统计失败:', error);
    throw error;
  }
};

/**
 * 获取指定游戏的投票详情
 * @param gameId 游戏ID
 * @param date 日期 (YYYY-MM-DD)
 * @returns 投票详情列表
 */
export const getVoteDetails = async (gameId: string, date: string) => {
  try {
    // 查询该日期的所有投票记录
    const query = new AV.Query('DailyVote');
    query.equalTo('date', date);
    query.limit(1000);
    
    const votes = await query.find();
    
    // 筛选出投了指定游戏的记录
    const voteDetails = votes
      .filter((vote) => {
        const selectedGames = vote.get('selectedGames') || [];
        return selectedGames.includes(gameId);
      })
      .map((vote) => {
        // 获取该用户对这个游戏的评分
        const gamePreferences: GamePreference[] = vote.get('gamePreferences') || [];
        const gamePref = gamePreferences.find(pref => pref.gameId === gameId);
        
        return {
          userId: vote.get('userId') || '',
          username: vote.get('user') || `用户${(vote.get('userId') || '').slice(-4)}`,
          gameId: gameId,
          gameName: '', // 将在组件中设置
          rating: gamePref?.tendency || 3, // 默认评分为3
          votedAt: vote.get('updatedAt') || vote.get('createdAt'),
        };
      })
      .sort((a, b) => b.votedAt.getTime() - a.votedAt.getTime());
    
    return voteDetails;
  } catch (error) {
    console.error('获取投票详情失败:', error);
    throw error;
  }
}; 