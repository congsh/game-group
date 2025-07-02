/**
 * 每日投票服务层
 * 提供投票相关的数据操作接口
 */

import AV from 'leancloud-storage';
import { DailyVote, VoteForm, VoteStats } from '../types/vote';
import { initDailyVoteTable } from '../utils/initData';

/**
 * 获取今日用户投票记录
 * @param userId 用户ID
 * @returns 今日投票记录或null
 */
export const getTodayVote = async (userId: string): Promise<DailyVote | null> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const query = new AV.Query('DailyVote');
    query.equalTo('user', userId);
    query.equalTo('date', today);
    query.descending('createdAt');
    
    const result = await query.first();
    
    if (!result) {
      return null;
    }
    
    return {
      objectId: result.id || '',
      date: result.get('date'),
      user: result.get('user'),
      wantsToPlay: result.get('wantsToPlay'),
      selectedGames: result.get('selectedGames') || [],
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
    
    // 先查看是否已有今日投票记录
    const existingVote = await getTodayVote(userId);
    
    let vote: AV.Object;
    
    if (existingVote) {
      // 更新现有投票
      vote = AV.Object.createWithoutData('DailyVote', existingVote.objectId);
      vote.set('wantsToPlay', voteForm.wantsToPlay);
      vote.set('selectedGames', voteForm.selectedGames);
    } else {
      // 创建新投票
      vote = new AV.Object('DailyVote');
      vote.set('date', today);
      vote.set('user', userId);
      vote.set('wantsToPlay', voteForm.wantsToPlay);
      vote.set('selectedGames', voteForm.selectedGames);
    }
    
    const result = await vote.save();
    
    return {
      objectId: result.id || '',
      date: result.get('date'),
      user: result.get('user'),
      wantsToPlay: result.get('wantsToPlay'),
      selectedGames: result.get('selectedGames') || [],
      createdAt: result.get('createdAt'),
      updatedAt: result.get('updatedAt'),
    };
  } catch (error: any) {
    console.error('提交投票失败:', error);
    
    // 如果是404错误（表不存在），尝试初始化表
    if (error.code === 404) {
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
 * 获取今日投票统计
 * @returns 今日投票统计数据
 */
export const getTodayVoteStats = async (): Promise<VoteStats> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 获取今日所有投票
    const query = new AV.Query('DailyVote');
    query.equalTo('date', today);
    query.limit(1000); // 假设单日投票不会超过1000条
    
    const votes = await query.find();
    
    let totalVotes = 0;
    let wantToPlayCount = 0;
    const gameVoteCounts: Record<string, number> = {};
    
    votes.forEach(vote => {
      totalVotes++;
      
      if (vote.get('wantsToPlay')) {
        wantToPlayCount++;
      }
      
      const selectedGames = vote.get('selectedGames') || [];
      selectedGames.forEach((gameId: string) => {
        gameVoteCounts[gameId] = (gameVoteCounts[gameId] || 0) + 1;
      });
    });
    
    // 获取游戏名称，用于topGames
    const gameIds = Object.keys(gameVoteCounts);
    const gameQuery = new AV.Query('Game');
    gameQuery.containedIn('objectId', gameIds);
    const games = await gameQuery.find();
    
    const gameNameMap: Record<string, string> = {};
    games.forEach(game => {
      const gameId = game.id;
      if (gameId) {
        gameNameMap[gameId] = game.get('name');
      }
    });
    
    // 计算topGames（按投票数排序）
    const topGames = Object.entries(gameVoteCounts)
      .map(([gameId, voteCount]) => ({
        gameId,
        gameName: gameNameMap[gameId] || '未知游戏',
        voteCount,
      }))
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 10); // 取前10名
    
    return {
      date: today,
      totalVotes,
      wantToPlayCount,
      gameVoteCounts,
      topGames,
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
    // 获取指定日期的所有投票
    const query = new AV.Query('DailyVote');
    query.equalTo('date', date);
    query.limit(1000);
    
    const votes = await query.find();
    
    let totalVotes = 0;
    let wantToPlayCount = 0;
    const gameVoteCounts: Record<string, number> = {};
    
    votes.forEach(vote => {
      totalVotes++;
      
      if (vote.get('wantsToPlay')) {
        wantToPlayCount++;
      }
      
      const selectedGames = vote.get('selectedGames') || [];
      selectedGames.forEach((gameId: string) => {
        gameVoteCounts[gameId] = (gameVoteCounts[gameId] || 0) + 1;
      });
    });
    
    // 获取游戏名称
    const gameIds = Object.keys(gameVoteCounts);
    const gameQuery = new AV.Query('Game');
    gameQuery.containedIn('objectId', gameIds);
    const games = await gameQuery.find();
    
    const gameNameMap: Record<string, string> = {};
    games.forEach(game => {
      const gameId = game.id;
      if (gameId) {
        gameNameMap[gameId] = game.get('name');
      }
    });
    
    // 计算topGames
    const topGames = Object.entries(gameVoteCounts)
      .map(([gameId, voteCount]) => ({
        gameId,
        gameName: gameNameMap[gameId] || '未知游戏',
        voteCount,
      }))
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 10);
    
    return {
      date,
      totalVotes,
      wantToPlayCount,
      gameVoteCounts,
      topGames,
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
    const dates: string[] = [];
    const today = new Date();
    
    // 生成最近N天的日期列表
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // 并行获取每天的统计数据
    const statsPromises = dates.map(date => getVoteStatsByDate(date));
    const stats = await Promise.all(statsPromises);
    
    return stats;
  } catch (error) {
    console.error('获取最近投票统计失败:', error);
    throw error;
  }
}; 