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
    
    // 先查看是否已有今日投票记录
    const existingVote = await getTodayVote(userId);
    
    let vote: AV.Object | null = null;
    let isUpdating = false;
    
    if (existingVote) {
      // 尝试更新现有投票
      try {
        vote = AV.Object.createWithoutData('DailyVote', existingVote.objectId);
        vote.set('wantsToPlay', voteForm.wantsToPlay);
        vote.set('selectedGames', voteForm.selectedGames);
        vote.set('gamePreferences', voteForm.gamePreferences || []);
        // 更新用户昵称（以防用户改了昵称）
        vote.set('user', userName);
        vote.set('userId', userId);
        isUpdating = true;
      } catch (error) {
        console.warn('创建更新对象失败，将创建新记录:', error);
        vote = null;
      }
    }
    
    // 如果没有现有记录或者更新对象创建失败，创建新投票
    if (!vote) {
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
      result = await vote.save();
      console.log('投票保存成功:', result.id);
    } catch (saveError: any) {
      console.error('保存投票时发生错误:', saveError);
      
      // 如果是404错误（记录不存在），清除缓存并创建新记录
      if (saveError.code === 404) {
        console.warn('投票记录不存在（404错误），清除缓存并创建新记录');
        console.log('错误详情:', {
          code: saveError.code,
          message: saveError.message,
          isUpdating,
          voteId: isUpdating ? vote?.id : 'new'
        });
        
        // 清除相关缓存
        clearVotesCaches();
        console.log('缓存已清除');
        
        // 无论什么情况，都创建新记录
        vote = new AV.Object('DailyVote');
        vote.set('date', today);
        vote.set('user', userName);
        vote.set('userId', userId);
        vote.set('wantsToPlay', voteForm.wantsToPlay);
        vote.set('selectedGames', voteForm.selectedGames);
        vote.set('gamePreferences', voteForm.gamePreferences || []);
        
        console.log('正在创建新的投票记录...');
        result = await vote.save();
        console.log('新投票记录创建成功:', result.id);
      } else {
        // 其他错误，直接抛出
        console.error('非404错误，直接抛出:', saveError);
        throw saveError;
      }
    }
    
    // 清除相关缓存
    clearVotesCaches();
    
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
    console.error('提交投票失败:', error);
    
    // 如果是404错误（表不存在），尝试初始化表
    if (error.code === 404 && error.message?.includes('doesn\'t exists')) {
      console.log('DailyVote表不存在，尝试自动创建...');
      try {
        await initDailyVoteTable();
        console.log('DailyVote表创建成功，重新尝试提交...');
        // 重新执行提交
        return await submitTodayVote(userId, voteForm);
      } catch (initError) {
        console.error('自动创建DailyVote表失败:', initError);
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