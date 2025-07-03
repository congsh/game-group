/**
 * 报表数据服务层
 * 提供各种报表数据的获取和处理接口
 */

import AV from 'leancloud-storage';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import {
  GameFavoriteReport,
  VoteReport,
  TeamReport,
  ReportQuery,
  ExportData,
  TimeRange
} from '../types/report';
import { initUserFavoriteTable } from '../utils/initData';

/**
 * 获取时间范围的开始和结束日期
 * @param timeRange 时间范围
 * @returns 开始和结束日期
 */
const getDateRange = (timeRange: TimeRange): { startDate: Date; endDate: Date } => {
  const endDate = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case 'week':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
  }

  return { startDate, endDate };
};

/**
 * 格式化日期为字符串
 * @param date 日期对象
 * @returns YYYY-MM-DD格式的日期字符串
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * 获取游戏收藏情况报表
 * @param query 查询参数
 * @returns 游戏收藏报表数据
 */
export const getGameFavoriteReport = async (query: ReportQuery): Promise<GameFavoriteReport> => {
  try {
    // 获取所有游戏及其收藏统计
    const gameQuery = new AV.Query('Game');
    const games = await gameQuery.find();

    // 获取用户收藏数据
    let favorites: any[] = [];
    try {
      const favoriteQuery = new AV.Query('UserFavorite');
      if (query.startDate && query.endDate) {
        favoriteQuery.greaterThanOrEqualTo('createdAt', new Date(query.startDate));
        favoriteQuery.lessThanOrEqualTo('createdAt', new Date(query.endDate));
      }
      favoriteQuery.limit(10000);
      favorites = await favoriteQuery.find();
    } catch (error: any) {
      console.warn('UserFavorite表不存在，尝试自动创建...');
      if (error.code === 404) {
        try {
          await initUserFavoriteTable();
          console.log('UserFavorite表创建成功，重新查询...');
          const favoriteQuery = new AV.Query('UserFavorite');
          if (query.startDate && query.endDate) {
            favoriteQuery.greaterThanOrEqualTo('createdAt', new Date(query.startDate));
            favoriteQuery.lessThanOrEqualTo('createdAt', new Date(query.endDate));
          }
          favoriteQuery.limit(10000);
          favorites = await favoriteQuery.find();
        } catch (initError) {
          console.warn('UserFavorite表创建失败，使用空数据:', initError);
          favorites = [];
        }
      } else {
        console.warn('查询UserFavorite失败，使用空数据:', error);
        favorites = [];
      }
    }

    // 计算游戏收藏排行榜
    const gameFavoriteMap = new Map<string, number>();
    const gameLikeMap = new Map<string, number>();
    const gameNameMap = new Map<string, string>();

    games.forEach(game => {
      const gameId = game.id!;
      gameNameMap.set(gameId, game.get('name'));
      gameFavoriteMap.set(gameId, game.get('favoriteCount') || 0);
      gameLikeMap.set(gameId, game.get('likeCount') || 0);
    });

    const topFavoriteGames = Array.from(gameFavoriteMap.entries())
      .map(([gameId, favoriteCount]) => ({
        gameId,
        gameName: gameNameMap.get(gameId) || '未知游戏',
        favoriteCount,
        likeCount: gameLikeMap.get(gameId) || 0,
        hotScore: (favoriteCount * 2) + (gameLikeMap.get(gameId) || 0)
      }))
      .sort((a, b) => b.hotScore - a.hotScore)
      .slice(0, 10);

    // 计算用户收藏数量分布
    const userFavoriteCountMap = new Map<string, number>();
    favorites.forEach(favorite => {
      const userId = favorite.get('user');
      userFavoriteCountMap.set(userId, (userFavoriteCountMap.get(userId) || 0) + 1);
    });

    const userFavoriteDistribution = [
      { range: '0', userCount: 0 },
      { range: '1-5', userCount: 0 },
      { range: '6-10', userCount: 0 },
      { range: '11-20', userCount: 0 },
      { range: '20+', userCount: 0 }
    ];

    userFavoriteCountMap.forEach(count => {
      if (count === 0) userFavoriteDistribution[0].userCount++;
      else if (count <= 5) userFavoriteDistribution[1].userCount++;
      else if (count <= 10) userFavoriteDistribution[2].userCount++;
      else if (count <= 20) userFavoriteDistribution[3].userCount++;
      else userFavoriteDistribution[4].userCount++;
    });

    // 生成收藏趋势数据（最近30天）
    const favoriteTrend: Array<{ date: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      
      const dayFavorites = favorites.filter(favorite => {
        const createdAt = favorite.get('createdAt');
        return formatDate(createdAt) === dateStr;
      });
      
      favoriteTrend.push({
        date: dateStr,
        count: dayFavorites.length
      });
    }

    // 计算总体统计
    const totalFavorites = favorites.length;
    const totalGames = games.length;
    const averageFavoritesPerGame = totalGames > 0 ? totalFavorites / totalGames : 0;
    const mostFavoritedGame = topFavoriteGames.length > 0 ? topFavoriteGames[0].gameName : '暂无';

    return {
      topFavoriteGames,
      userFavoriteDistribution,
      favoriteTrend,
      summary: {
        totalGames,
        totalFavorites,
        averageFavoritesPerGame,
        mostFavoritedGame
      }
    };
  } catch (error) {
    console.error('获取游戏收藏报表失败:', error);
    throw error;
  }
};

/**
 * 获取每日投票报表
 * @param query 查询参数
 * @returns 每日投票报表数据
 */
export const getVoteReport = async (query: ReportQuery): Promise<VoteReport> => {
  try {
    // 使用批量投票数据获取，减少API请求
    const { getBatchVoteStats } = await import('./dataCache');
    
    // 根据时间范围计算天数
    let days = 7; // 默认7天
    if (query.timeRange === 'month') days = 30;
    else if (query.timeRange === 'quarter') days = 90;
    else if (query.timeRange === 'year') days = 365;
    
    // 获取批量投票统计数据
    const batchStats = await getBatchVoteStats(days);
    
    // 如果批量数据为空，尝试直接查询
    if (Object.keys(batchStats).length === 0) {
      console.log('批量数据为空，尝试直接查询投票数据...');
      
      // 获取投票数据
      const voteQuery = new AV.Query('DailyVote');
      if (query.startDate && query.endDate) {
        voteQuery.greaterThanOrEqualTo('createdAt', new Date(query.startDate));
        voteQuery.lessThanOrEqualTo('createdAt', new Date(query.endDate));
      }
      voteQuery.limit(10000);
      const votes = await voteQuery.find();

      // 获取游戏信息
      const gameQuery = new AV.Query('Game');
      const games = await gameQuery.find();
      const gameNameMap = new Map<string, string>();
      games.forEach(game => {
        gameNameMap.set(game.id!, game.get('name'));
      });

      // 处理投票参与统计
      const dailyStats = new Map<string, { totalVotes: number; wantToPlayCount: number; users: Set<string> }>();
      
      votes.forEach(vote => {
        const date = vote.get('date');
        const user = vote.get('userId') || vote.get('user'); // 兼容新旧字段
        const wantsToPlay = vote.get('wantsToPlay');
        
        if (!dailyStats.has(date)) {
          dailyStats.set(date, { totalVotes: 0, wantToPlayCount: 0, users: new Set() });
        }
        
        const dayStats = dailyStats.get(date)!;
        dayStats.totalVotes++;
        dayStats.users.add(user);
        if (wantsToPlay) {
          dayStats.wantToPlayCount++;
        }
      });

      const participationStats = Array.from(dailyStats.entries()).map(([date, stats]) => ({
        date,
        totalVotes: stats.totalVotes,
        wantToPlayCount: stats.wantToPlayCount,
        participationRate: stats.totalVotes > 0 ? stats.wantToPlayCount / stats.totalVotes : 0
      })).sort((a, b) => a.date.localeCompare(b.date));

      // 处理游戏得票排行
      const gameVoteStats = new Map<string, { totalVotes: number; tendencySum: number; tendencyCount: number; days: Set<string> }>();
      
      votes.forEach(vote => {
        const selectedGames = vote.get('selectedGames') || [];
        const gamePreferences = vote.get('gamePreferences') || [];
        const date = vote.get('date');
        
        selectedGames.forEach((gameId: string) => {
          if (!gameVoteStats.has(gameId)) {
            gameVoteStats.set(gameId, { totalVotes: 0, tendencySum: 0, tendencyCount: 0, days: new Set() });
          }
          
          const gameStats = gameVoteStats.get(gameId)!;
          gameStats.totalVotes++;
          gameStats.days.add(date);
          
          // 查找对应的倾向度
          const preference = gamePreferences.find((pref: any) => pref.gameId === gameId);
          if (preference && preference.tendency) {
            gameStats.tendencySum += preference.tendency;
            gameStats.tendencyCount++;
          }
        });
      });

      const topVotedGames = Array.from(gameVoteStats.entries())
        .map(([gameId, stats]) => ({
          gameId,
          gameName: gameNameMap.get(gameId) || '未知游戏',
          totalVotes: stats.totalVotes,
          averageTendency: stats.tendencyCount > 0 ? stats.tendencySum / stats.tendencyCount : 0,
          uniqueDays: stats.days.size
        }))
        .sort((a, b) => b.totalVotes - a.totalVotes)
        .slice(0, 10);

      // 用户活跃度统计
      const userVoteStats = new Map<string, { voteDays: Set<string>; totalVotes: number; tendencySum: number; tendencyCount: number }>();
      
      votes.forEach(vote => {
        // 优先使用昵称，如果没有则使用ID
        const userName = vote.get('user') || `用户${(vote.get('userId') || '').slice(-4)}`;
        const userId = vote.get('userId') || vote.get('user');
        const date = vote.get('date');
        const gamePreferences = vote.get('gamePreferences') || [];
        
        const userKey = userName; // 使用昵称作为key
        
        if (!userVoteStats.has(userKey)) {
          userVoteStats.set(userKey, { voteDays: new Set(), totalVotes: 0, tendencySum: 0, tendencyCount: 0 });
        }
        
        const userStats = userVoteStats.get(userKey)!;
        userStats.voteDays.add(date);
        userStats.totalVotes++;
        
        gamePreferences.forEach((pref: any) => {
          if (pref.tendency) {
            userStats.tendencySum += pref.tendency;
            userStats.tendencyCount++;
          }
        });
      });

      const userActivity = Array.from(userVoteStats.entries())
        .map(([userName, stats]) => ({
          userId: userName, // 这里存储的是昵称
          username: userName,
          voteDays: stats.voteDays.size,
          totalVotes: stats.totalVotes,
          averageTendency: stats.tendencyCount > 0 ? stats.tendencySum / stats.tendencyCount : 0
        }))
        .sort((a, b) => b.voteDays - a.voteDays)
        .slice(0, 10);

      // 生成投票趋势数据
      const voteTrend = participationStats.map(stat => ({
        date: stat.date,
        totalVotes: stat.totalVotes,
        uniqueUsers: dailyStats.get(stat.date)?.users.size || 0,
        averageTendency: 0 // 需要根据具体数据计算
      }));

      // 简化的峰值数据
      const peakVotes = {
        week: topVotedGames.slice(0, 3).map(game => ({
          gameId: game.gameId,
          gameName: game.gameName,
          voteCount: game.totalVotes,
          weekStart: formatDate(new Date())
        })),
        month: topVotedGames.slice(0, 5).map(game => ({
          gameId: game.gameId,
          gameName: game.gameName,
          voteCount: game.totalVotes,
          month: new Date().getMonth() + 1 + '月'
        })),
        quarter: topVotedGames.slice(0, 5).map(game => ({
          gameId: game.gameId,
          gameName: game.gameName,
          voteCount: game.totalVotes,
          quarter: Math.ceil((new Date().getMonth() + 1) / 3) + '季度'
        }))
      };

      return {
        participationStats,
        topVotedGames,
        peakVotes,
        userActivity,
        voteTrend
      };
    }
    
    // 使用批量统计数据生成报表
    const dates = Object.keys(batchStats).sort();
    
    // 生成参与度统计
    const participationStats = dates.map(date => {
      const dayStats = batchStats[date];
      return {
        date,
        totalVotes: dayStats.totalVotes || 0,
        wantToPlayCount: dayStats.wantToPlayCount || 0,
        participationRate: dayStats.totalVotes > 0 ? dayStats.wantToPlayCount / dayStats.totalVotes : 0
      };
    });
    
    // 聚合游戏得票统计
    const gameVoteStats = new Map<string, { totalVotes: number; gameName: string; days: Set<string> }>();
    
    dates.forEach(date => {
      const dayStats = batchStats[date];
      if (dayStats.topGames) {
        dayStats.topGames.forEach((game: any) => {
          if (!gameVoteStats.has(game.gameId)) {
            gameVoteStats.set(game.gameId, { 
              totalVotes: 0, 
              gameName: game.gameName,
              days: new Set()
            });
          }
          const stats = gameVoteStats.get(game.gameId)!;
          stats.totalVotes += game.voteCount;
          stats.days.add(date);
        });
      }
    });
    
    const topVotedGames = Array.from(gameVoteStats.entries())
      .map(([gameId, stats]) => ({
        gameId,
        gameName: stats.gameName,
        totalVotes: stats.totalVotes,
        averageTendency: 0, // 需要从详细数据计算
        uniqueDays: stats.days.size
      }))
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .slice(0, 10);
    
    // 简化的用户活跃度统计
    const userActivity = [{
      userId: 'aggregate',
      username: '总计数据',
      voteDays: dates.length,
      totalVotes: participationStats.reduce((sum, stat) => sum + stat.totalVotes, 0),
      averageTendency: 0
    }];
    
    // 投票趋势数据
    const voteTrend = participationStats.map(stat => ({
      date: stat.date,
      totalVotes: stat.totalVotes,
      uniqueUsers: stat.totalVotes, // 简化统计
      averageTendency: 0
    }));
    
    // 峰值数据
    const peakVotes = {
      week: topVotedGames.slice(0, 3).map(game => ({
        gameId: game.gameId,
        gameName: game.gameName,
        voteCount: game.totalVotes,
        weekStart: formatDate(new Date())
      })),
      month: topVotedGames.slice(0, 5).map(game => ({
        gameId: game.gameId,
        gameName: game.gameName,
        voteCount: game.totalVotes,
        month: new Date().getMonth() + 1 + '月'
      })),
      quarter: topVotedGames.slice(0, 5).map(game => ({
        gameId: game.gameId,
        gameName: game.gameName,
        voteCount: game.totalVotes,
        quarter: Math.ceil((new Date().getMonth() + 1) / 3) + '季度'
      }))
    };

    return {
      participationStats,
      topVotedGames,
      peakVotes,
      userActivity,
      voteTrend
    };
  } catch (error) {
    console.error('获取投票报表失败:', error);
    
    // 返回空数据以避免页面崩溃
    return {
      participationStats: [],
      topVotedGames: [],
      peakVotes: { week: [], month: [], quarter: [] },
      userActivity: [],
      voteTrend: []
    };
  }
};

/**
 * 获取周末组队报表
 * @param query 查询参数
 * @returns 周末组队报表数据
 */
export const getTeamReport = async (query: ReportQuery): Promise<TeamReport> => {
  try {
    // 获取组队数据
    const teamQuery = new AV.Query('WeekendTeam');
    if (query.startDate && query.endDate) {
      teamQuery.greaterThanOrEqualTo('createdAt', new Date(query.startDate));
      teamQuery.lessThanOrEqualTo('createdAt', new Date(query.endDate));
    }
    teamQuery.limit(10000);
    const teams = await teamQuery.find();

    // 获取游戏信息
    const gameQuery = new AV.Query('Game');
    const games = await gameQuery.find();
    const gameNameMap = new Map<string, string>();
    games.forEach(game => {
      gameNameMap.set(game.id!, game.get('name'));
    });

    // 计算基本统计
    const totalTeams = teams.length;
    let totalParticipants = 0;
    let completedTeams = 0;

    const gamePopularityMap = new Map<string, { teamCount: number; totalParticipants: number }>();
    const userParticipationMap = new Map<string, { teamsJoined: number; teamsCreated: number }>();
    const timeSlotMap = new Map<string, { teamCount: number; participantCount: number }>();

    teams.forEach(team => {
      const members = team.get('members') || [];
      const leader = team.get('leader');
      const gameId = team.get('game');
      const startTime = team.get('startTime');
      const status = team.get('status');
      
      totalParticipants += members.length;
      
      if (status === 'completed') {
        completedTeams++;
      }

      // 游戏热度统计
      if (gameId) {
        if (!gamePopularityMap.has(gameId)) {
          gamePopularityMap.set(gameId, { teamCount: 0, totalParticipants: 0 });
        }
        const gameStats = gamePopularityMap.get(gameId)!;
        gameStats.teamCount++;
        gameStats.totalParticipants += members.length;
      }

      // 用户参与统计
      if (leader) {
        if (!userParticipationMap.has(leader)) {
          userParticipationMap.set(leader, { teamsJoined: 0, teamsCreated: 0 });
        }
        userParticipationMap.get(leader)!.teamsCreated++;
      }

      members.forEach((memberId: string) => {
        if (!userParticipationMap.has(memberId)) {
          userParticipationMap.set(memberId, { teamsJoined: 0, teamsCreated: 0 });
        }
        userParticipationMap.get(memberId)!.teamsJoined++;
      });

      // 时间段分布
      if (startTime) {
        const hour = parseInt(startTime.split(':')[0]);
        let timeSlot = '';
        if (hour >= 9 && hour < 12) timeSlot = '09:00-12:00';
        else if (hour >= 12 && hour < 15) timeSlot = '12:00-15:00';
        else if (hour >= 15 && hour < 18) timeSlot = '15:00-18:00';
        else if (hour >= 18 && hour < 21) timeSlot = '18:00-21:00';
        else timeSlot = '21:00-24:00';
        
        if (!timeSlotMap.has(timeSlot)) {
          timeSlotMap.set(timeSlot, { teamCount: 0, participantCount: 0 });
        }
        const timeStats = timeSlotMap.get(timeSlot)!;
        timeStats.teamCount++;
        timeStats.participantCount += members.length;
      }
    });

    const averageTeamSize = totalTeams > 0 ? totalParticipants / totalTeams : 0;
    const completionRate = totalTeams > 0 ? completedTeams / totalTeams : 0;

    // 生成报表数据
    const gamePopularity = Array.from(gamePopularityMap.entries())
      .map(([gameId, stats]) => ({
        gameId,
        gameName: gameNameMap.get(gameId) || '未知游戏',
        teamCount: stats.teamCount,
        totalParticipants: stats.totalParticipants,
        averageTeamSize: stats.teamCount > 0 ? stats.totalParticipants / stats.teamCount : 0
      }))
      .sort((a, b) => b.teamCount - a.teamCount);

    const userParticipation = Array.from(userParticipationMap.entries())
      .map(([userId, stats]) => ({
        userId,
        username: `用户${userId.slice(-4)}`,
        teamsJoined: stats.teamsJoined,
        teamsCreated: stats.teamsCreated,
        participationRate: totalTeams > 0 ? (stats.teamsJoined + stats.teamsCreated) / totalTeams : 0
      }))
      .sort((a, b) => (b.teamsJoined + b.teamsCreated) - (a.teamsJoined + a.teamsCreated))
      .slice(0, 10);

    const timeDistribution = Array.from(timeSlotMap.entries())
      .map(([timeSlot, stats]) => ({
        timeSlot,
        teamCount: stats.teamCount,
        participantCount: stats.participantCount
      }))
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    // 生成组队趋势数据（按周统计）
    const teamTrend: Array<{ weekStart: string; teamCount: number; participantCount: number; averageTeamSize: number }> = [];
    const weeklyData = new Map<string, { teams: number; participants: number }>();

    teams.forEach(team => {
      const createdAt = team.get('createdAt');
      const weekStart = getWeekStart(createdAt);
      const members = team.get('members') || [];
      
      if (!weeklyData.has(weekStart)) {
        weeklyData.set(weekStart, { teams: 0, participants: 0 });
      }
      
      const weekData = weeklyData.get(weekStart)!;
      weekData.teams++;
      weekData.participants += members.length;
    });

    Array.from(weeklyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([weekStart, data]) => {
        teamTrend.push({
          weekStart,
          teamCount: data.teams,
          participantCount: data.participants,
          averageTeamSize: data.teams > 0 ? data.participants / data.teams : 0
        });
      });

    return {
      teamStats: {
        totalTeams,
        totalParticipants,
        averageTeamSize,
        completionRate
      },
      gamePopularity,
      userParticipation,
      timeDistribution,
      teamTrend
    };
  } catch (error) {
    console.error('获取组队报表失败:', error);
    throw error;
  }
};

/**
 * 获取周开始日期
 * @param date 日期
 * @returns 周开始日期字符串
 */
const getWeekStart = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 周一为一周开始
  d.setDate(diff);
  return formatDate(d);
};

/**
 * 导出数据为Excel文件
 * @param exportData 导出数据
 */
export const exportToExcel = (exportData: ExportData): void => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(exportData.data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, exportData.sheetName || 'Sheet1');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(data, `${exportData.filename}.xlsx`);
  } catch (error) {
    console.error('导出Excel失败:', error);
    throw error;
  }
};

/**
 * 导出数据为CSV文件
 * @param exportData 导出数据
 */
export const exportToCSV = (exportData: ExportData): void => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(exportData.data);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    
    const data = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(data, `${exportData.filename}.csv`);
  } catch (error) {
    console.error('导出CSV失败:', error);
    throw error;
  }
}; 