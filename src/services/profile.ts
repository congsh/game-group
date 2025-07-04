/**
 * 个人中心服务层
 * 提供用户数据获取、统计分析和导出功能
 */

import AV from 'leancloud-storage';
import { Game } from '../types/game';
import { DailyVote } from '../types/vote';
import { WeekendTeam } from '../types/team';

// 用户统计数据接口
export interface UserStats {
  totalVotes: number;           // 总投票次数
  totalTeams: number;           // 总组队次数
  totalFavorites: number;       // 总收藏数量
  activeDays: number;           // 活跃天数
  favoriteCategory: string;     // 最喜欢的游戏类型
  averageRating: number;        // 平均评分
  leaderCount: number;          // 担任队长次数
  memberCount: number;          // 参与成员次数
  mostActiveTime: string;       // 最活跃时间段
  consecutiveDays: number;      // 连续活跃天数
}

// 投票历史数据接口
export interface VoteHistoryItem {
  id: string;
  date: string;
  gameName: string;
  gameId: string;
  tendency: number;
  createdAt: string;
}

// 组队历史数据接口
export interface TeamHistoryItem {
  id: string;
  activity: string;
  game: string;
  role: 'leader' | 'member';
  time: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

// 收藏游戏数据接口
export interface FavoriteGameItem {
  id: string;
  name: string;
  category: string;
  description: string;
  favoritedAt: string;
}

class ProfileService {
  /**
   * 获取用户统计数据
   */
  async getUserStats(userId: string, dateRange?: [Date, Date]): Promise<UserStats> {
    try {
      // 并行获取各种统计数据
      const [
        voteStats,
        teamStats, 
        favoriteStats,
        activityStats
      ] = await Promise.all([
        this.getVoteStats(userId, dateRange),
        this.getTeamStats(userId, dateRange),
        this.getFavoriteStats(userId, dateRange),
        this.getActivityStats(userId, dateRange)
      ]);

      return {
        totalVotes: 0,
        totalTeams: 0,
        totalFavorites: 0,
        activeDays: 0,
        favoriteCategory: '暂无数据',
        averageRating: 0,
        leaderCount: 0,
        memberCount: 0,
        mostActiveTime: '暂无数据',
        consecutiveDays: 0,
        ...voteStats,
        ...teamStats,
        ...favoriteStats,
        ...activityStats
      };
    } catch (error) {
      console.error('获取用户统计数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取投票统计数据
   */
  private async getVoteStats(userId: string, dateRange?: [Date, Date]): Promise<Partial<UserStats>> {
    try {
      const query = new AV.Query('DailyVote');
      query.equalTo('userId', userId);

      if (dateRange) {
        query.greaterThanOrEqualTo('createdAt', dateRange[0]);
        query.lessThanOrEqualTo('createdAt', dateRange[1]);
      }

      const votes = await query.find();
      // 计算统计数据
      let totalVotes = 0;
      let totalRating = 0;
      const categoryCount: Record<string, number> = {};
      const gameIds = new Set<string>();

      for (const vote of votes) {
        const gameIds_attr = vote.get('selectedGames') || [];
        const gamePreferences = vote.get('gamePreferences') || [];
        totalVotes += gameIds_attr.length;
        
        // 统计评分
        for (const pref of gamePreferences) {
          if (pref.tendency) {
            totalRating += pref.tendency;
            console.log('pref.tendency', pref.tendency);
            gameIds.add(pref.gameId);
          }
        }
      }

      // 获取游戏信息统计类型偏好
      if (gameIds.size > 0) {
        const gameQuery = new AV.Query('Game');
        gameQuery.containedIn('objectId', Array.from(gameIds));
        const games = await gameQuery.find();
        
        for (const game of games) {
          const category = game.get('type') || '其他';
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        }
      }

      // 找出最喜欢的游戏类型
      const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
        categoryCount[a] > categoryCount[b] ? a : b, '暂无数据'
      );

      const averageRating = totalVotes > 0 ? totalRating / totalVotes : 0;
      console.log('gameIds.size', gameIds.size);
      console.log('totalRating', totalRating);
      console.log('totalRating / totalVotes', totalRating / totalVotes);
      return {
        totalVotes,
        favoriteCategory,
        averageRating
      };
    } catch (error) {
      console.error('获取投票统计失败:', error);
      return {
        totalVotes: 0,
        favoriteCategory: '暂无数据',
        averageRating: 0
      };
    }
  }

  /**
   * 获取组队统计数据
   */
  private async getTeamStats(userId: string, dateRange?: [Date, Date]): Promise<Partial<UserStats>> {
    try {
      const query = new AV.Query('WeekendTeam');
      
      if (dateRange) {
        query.greaterThanOrEqualTo('createdAt', dateRange[0]);
        query.lessThanOrEqualTo('createdAt', dateRange[1]);
      }

      const teams = await query.find();
      
      let totalTeams = 0;
      let leaderCount = 0;
      let memberCount = 0;

      for (const team of teams) {
        const leader = team.get('leader');
        const memberTimeInfos = team.get('memberTimeInfos') || [];
        
        // 检查是否是队长
        if (leader === userId) {
          totalTeams++;
          leaderCount++;
        } else {
          // 检查是否是成员
          const isMember = memberTimeInfos.some((info: any) => info.userId === userId);
          if (isMember) {
            totalTeams++;
            memberCount++;
          }
        }
      }

      return {
        totalTeams,
        leaderCount,
        memberCount
      };
    } catch (error) {
      console.error('获取组队统计失败:', error);
      return {
        totalTeams: 0,
        leaderCount: 0,
        memberCount: 0
      };
    }
  }

  /**
   * 获取收藏统计数据
   */
  private async getFavoriteStats(userId: string, dateRange?: [Date, Date]): Promise<Partial<UserStats>> {
    try {
      const query = new AV.Query('UserFavorite');
      query.equalTo('userId', userId);
      
      if (dateRange) {
        query.greaterThanOrEqualTo('createdAt', dateRange[0]);
        query.lessThanOrEqualTo('createdAt', dateRange[1]);
      }

      const favorites = await query.find();
      
      return {
        totalFavorites: favorites.length
      };
    } catch (error) {
      console.error('获取收藏统计失败:', error);
      return {
        totalFavorites: 0
      };
    }
  }

  /**
   * 获取活跃度统计数据
   */
  private async getActivityStats(userId: string, dateRange?: [Date, Date]): Promise<Partial<UserStats>> {
    try {
      // 获取所有相关活动的日期
      const [voteQuery, teamQuery, favoriteQuery] = [
        new AV.Query('DailyVote'),
        new AV.Query('WeekendTeam'),
        new AV.Query('UserFavorite')
      ];

      voteQuery.equalTo('user', AV.Object.createWithoutData('_User', userId));
      favoriteQuery.equalTo('userId', userId);

      if (dateRange) {
        voteQuery.greaterThanOrEqualTo('createdAt', dateRange[0]);
        voteQuery.lessThanOrEqualTo('createdAt', dateRange[1]);
        teamQuery.greaterThanOrEqualTo('createdAt', dateRange[0]);
        teamQuery.lessThanOrEqualTo('createdAt', dateRange[1]);
        favoriteQuery.greaterThanOrEqualTo('createdAt', dateRange[0]);
        favoriteQuery.lessThanOrEqualTo('createdAt', dateRange[1]);
      }

      const [votes, teams, favorites] = await Promise.all([
        voteQuery.find(),
        teamQuery.find(),
        favoriteQuery.find()
      ]);

      // 统计活跃日期
      const activeDates = new Set<string>();
      
      // 添加投票日期
      votes.forEach(vote => {
        const date = vote.get('createdAt').toISOString().split('T')[0];
        activeDates.add(date);
      });

      // 添加组队日期（包括作为队长和成员）
      teams.forEach(team => {
        const leader = team.get('leader');
        const memberTimeInfos = team.get('memberTimeInfos') || [];
        const isInvolved = leader === userId || memberTimeInfos.some((info: any) => info.userId === userId);
        
        if (isInvolved) {
          const date = team.get('createdAt').toISOString().split('T')[0];
          activeDates.add(date);
        }
      });

      // 添加收藏日期
      favorites.forEach(favorite => {
        const date = favorite.get('createdAt').toISOString().split('T')[0];
        activeDates.add(date);
      });

      // 计算连续活跃天数
      const sortedDates = Array.from(activeDates).sort();
      let consecutiveDays = 0;
      if (sortedDates.length > 0) {
        let current = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const prev = new Date(sortedDates[i - 1]);
          const curr = new Date(sortedDates[i]);
          const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          
          if (diffDays === 1) {
            current++;
          } else {
            consecutiveDays = Math.max(consecutiveDays, current);
            current = 1;
          }
        }
        consecutiveDays = Math.max(consecutiveDays, current);
      }

      // 分析最活跃时间段（简化版本）
      const timeSlots: Record<string, number> = {
        '上午': 0,
        '下午': 0,
        '晚上': 0
      };

      [...votes, ...teams, ...favorites].forEach(item => {
        const hour = item.get('createdAt').getHours();
        if (hour >= 6 && hour < 12) {
          timeSlots['上午']++;
        } else if (hour >= 12 && hour < 18) {
          timeSlots['下午']++;
        } else {
          timeSlots['晚上']++;
        }
      });

      const mostActiveTime = Object.keys(timeSlots).reduce((a, b) => 
        timeSlots[a] > timeSlots[b] ? a : b, '暂无数据'
      );

      return {
        activeDays: activeDates.size,
        consecutiveDays,
        mostActiveTime
      };
    } catch (error) {
      console.error('获取活跃度统计失败:', error);
      return {
        activeDays: 0,
        consecutiveDays: 0,
        mostActiveTime: '暂无数据'
      };
    }
  }

  /**
   * 获取投票历史
   */
  async getVoteHistory(userId: string, dateRange?: [Date, Date]): Promise<VoteHistoryItem[]> {
    try {
      const query = new AV.Query('DailyVote');
      query.equalTo('userId', userId);
      query.descending('createdAt');
      
      if (dateRange) {
        query.greaterThanOrEqualTo('createdAt', dateRange[0]);
        query.lessThanOrEqualTo('createdAt', dateRange[1]);
      }

      const votes = await query.find();
      const gameIds = new Set<string>();
      const voteItems: VoteHistoryItem[] = [];

      // 收集所有游戏ID
      votes.forEach(vote => {
        const gamePreferences = vote.get('gamePreferences') || [];
        gamePreferences.forEach((pref: any) => {
          gameIds.add(pref.gameId);
        });
      });

      // 批量获取游戏信息
      const gameMap = new Map<string, string>();
      if (gameIds.size > 0) {
        const gameQuery = new AV.Query('Game');
        gameQuery.containedIn('objectId', Array.from(gameIds));
        const games = await gameQuery.find();
        
        games.forEach(game => {
          if (typeof game.id === 'string') {
            gameMap.set(game.id, game.get('name'));
          }
        });
      }

      // 构建投票历史数据
      votes.forEach(vote => {
        const date = vote.get('date');
        const createdAt = vote.get('createdAt');
        const gamePreferences = vote.get('gamePreferences') || [];
        gamePreferences.forEach((pref: any) => {
          voteItems.push({
            id: `${vote.id}_${pref.gameId}`,
            date: date ? (date instanceof Date ? date.toISOString().split('T')[0] : date) : '',
            gameName: gameMap.get(pref.gameId) || '未知游戏',
            gameId: pref.gameId || '',
            tendency: typeof pref.tendency === 'number' ? pref.tendency : 0,
            createdAt: createdAt ? createdAt.toISOString() : ''
          });
        });
      });

      return voteItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('获取投票历史失败:', error);
      return [];
    }
  }

  /**
   * 获取组队历史
   */
  async getTeamHistory(userId: string, dateRange?: [Date, Date]): Promise<TeamHistoryItem[]> {
    try {
      const query = new AV.Query('WeekendTeam');
      query.descending('createdAt');
      
      if (dateRange) {
        query.greaterThanOrEqualTo('createdAt', dateRange[0]);
        query.lessThanOrEqualTo('createdAt', dateRange[1]);
      }

      const teams = await query.find();
      const teamItems: TeamHistoryItem[] = [];
      const gameIdSet = new Set<string>();

      // 收集所有涉及的游戏ID
      teams.forEach(team => {
        const leader = team.get('leader');
        const memberTimeInfos = team.get('memberTimeInfos') || [];
        let role: 'leader' | 'member' | null = null;
        if (leader === userId) {
          role = 'leader';
        } else if (memberTimeInfos.some((info: any) => info.userId === userId)) {
          role = 'member';
        }
        if (role) {
          const gameId = team.get('game');
          if (gameId) gameIdSet.add(gameId);
        }
      });

      // 批量获取游戏信息
      const gameMap = new Map<string, string>();
      if (gameIdSet.size > 0) {
        const gameQuery = new AV.Query('Game');
        gameQuery.containedIn('objectId', Array.from(gameIdSet));
        const games = await gameQuery.find();
        games.forEach(game => {
          if (typeof game.id === 'string') {
            gameMap.set(game.id, game.get('name'));
          }
        });
      }

      // 构建组队历史数据
      teams.forEach(team => {
        const leader = team.get('leader');
        const memberTimeInfos = team.get('memberTimeInfos') || [];
        const activity = team.get('activity');
        const gameId = team.get('game');
        const dateObj = team.get('eventDate');
        const timeObj = team.get('startTime');
        const createdAt = team.get('createdAt');
        let role: 'leader' | 'member' | null = null;
        if (leader === userId) {
          role = 'leader';
        } else if (memberTimeInfos.some((info: any) => info.userId === userId)) {
          role = 'member';
        }
        if (role) {
          // 状态判断
          const now = new Date();
          // 日期格式化
          let dateStr = '';
          if (dateObj instanceof Date) {
            dateStr = dateObj.toISOString().split('T')[0];
          } else if (typeof dateObj === 'string') {
            dateStr = dateObj;
          }
          // 时间格式化
          let timeStr = '';
          if (timeObj instanceof Date) {
            const h = timeObj.getHours().toString().padStart(2, '0');
            const m = timeObj.getMinutes().toString().padStart(2, '0');
            timeStr = `${h}:${m}`;
          } else if (typeof timeObj === 'string') {
            timeStr = timeObj;
          }
          const teamDate = new Date(`${dateStr}T${timeStr || '00:00'}`);
          let status: 'active' | 'completed' | 'cancelled' = 'active';
          if (teamDate < now) {
            status = 'completed';
          }
          teamItems.push({
            id: team.id || '',
            activity: activity || '',
            game: gameMap.get(gameId) || '未知游戏',
            role,
            time: dateStr && timeStr ? `${dateStr} ${timeStr}` : (dateStr || ''),
            status,
            createdAt: createdAt.toISOString()
          });
        }
      });

      return teamItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('获取组队历史失败:', error);
      return [];
    }
  }

  /**
   * 获取收藏游戏列表
   */
  async getFavoriteGames(userId: string, dateRange?: [Date, Date]): Promise<FavoriteGameItem[]> {
    try {
      // 直接用UserFavorite表统计和展示
      const query = new AV.Query('UserFavorite');
      query.equalTo('user', userId);
      query.descending('createdAt');
      
      if (dateRange) {
        query.greaterThanOrEqualTo('createdAt', dateRange[0]);
        query.lessThanOrEqualTo('createdAt', dateRange[1]);
      }

      const favorites = await query.find();
      const gameIds = favorites.map(fav => fav.get('game'));

      if (gameIds.length === 0) {
        return [];
      }

      // 批量获取游戏信息
      const gameQuery = new AV.Query('Game');
      gameQuery.containedIn('objectId', gameIds);
      const games = await gameQuery.find();

      const gameMap = new Map();
      games.forEach(game => {
        if (typeof game.id === 'string') {
          gameMap.set(game.id, {
            name: game.get('name'),
            category: game.get('type'),
            description: game.get('description')
          });
        }
      });

      return favorites.map(favorite => {
        const gameId = favorite.get('game');
        const gameInfo = gameMap.get(gameId) || {};
        return {
          id: favorite.id || '',
          name: gameInfo.name || '未知游戏',
          category: gameInfo.category || '其他',
          description: gameInfo.description || '',
          favoritedAt: favorite.get('createdAt') ? favorite.get('createdAt').toISOString() : ''
        };
      });
    } catch (error) {
      console.error('获取收藏游戏失败:', error);
      return [];
    }
  }

  /**
   * 导出用户数据
   */
  async exportUserData(userId: string): Promise<any> {
    try {
      const [stats, voteHistory, teamHistory, favoriteGames] = await Promise.all([
        this.getUserStats(userId),
        this.getVoteHistory(userId),
        this.getTeamHistory(userId),
        this.getFavoriteGames(userId)
      ]);

      return {
        exportTime: new Date().toISOString(),
        userId,
        stats,
        voteHistory,
        teamHistory,
        favoriteGames
      };
    } catch (error) {
      console.error('导出用户数据失败:', error);
      throw error;
    }
  }
}

export const profileService = new ProfileService(); 