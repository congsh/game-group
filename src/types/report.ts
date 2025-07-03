/**
 * 报表相关类型定义
 */

/**
 * 时间范围类型
 */
export type TimeRange = 'week' | 'month' | 'quarter' | 'year';

/**
 * 游戏收藏报表数据
 */
export interface GameFavoriteReport {
  /** 游戏收藏排行榜 */
  topFavoriteGames: Array<{
    gameId: string;
    gameName: string;
    favoriteCount: number;
    likeCount: number;
    hotScore: number;
  }>;
  /** 用户收藏数量分布 */
  userFavoriteDistribution: Array<{
    range: string; // "0", "1-5", "6-10", "11-20", "20+"
    userCount: number;
  }>;
  /** 收藏趋势数据 */
  favoriteTrend: Array<{
    date: string;
    count: number;
  }>;
  /** 总体统计 */
  summary: {
    totalGames: number;
    totalFavorites: number;
    averageFavoritesPerGame: number;
    mostFavoritedGame: string;
  };
}

/**
 * 每日投票报表数据
 */
export interface VoteReport {
  /** 投票参与人数统计 */
  participationStats: Array<{
    date: string;
    totalVotes: number;
    wantToPlayCount: number;
    participationRate: number;
  }>;
  /** 游戏得票排行榜 */
  topVotedGames: Array<{
    gameId: string;
    gameName: string;
    totalVotes: number;
    averageTendency: number;
    uniqueDays: number; // 获得投票的天数
  }>;
  /** 最高得票统计 */
  peakVotes: {
    week: Array<{
      gameId: string;
      gameName: string;
      voteCount: number;
      weekStart: string;
    }>;
    month: Array<{
      gameId: string;
      gameName: string;
      voteCount: number;
      month: string;
    }>;
    quarter: Array<{
      gameId: string;
      gameName: string;
      voteCount: number;
      quarter: string;
    }>;
  };
  /** 用户投票活跃度 */
  userActivity: Array<{
    userId: string;
    username: string;
    voteDays: number;
    totalVotes: number;
    averageTendency: number;
  }>;
  /** 投票趋势 */
  voteTrend: Array<{
    date: string;
    totalVotes: number;
    uniqueUsers: number;
    averageTendency: number;
  }>;
}

/**
 * 周末组队报表数据
 */
export interface TeamReport {
  /** 组队活动统计 */
  teamStats: {
    totalTeams: number;
    totalParticipants: number;
    averageTeamSize: number;
    completionRate: number;
  };
  /** 游戏热度分析 */
  gamePopularity: Array<{
    gameId: string;
    gameName: string;
    teamCount: number;
    totalParticipants: number;
    averageTeamSize: number;
  }>;
  /** 个人参与统计 */
  userParticipation: Array<{
    userId: string;
    username: string;
    teamsJoined: number;
    teamsCreated: number;
    participationRate: number;
  }>;
  /** 时间段分布 */
  timeDistribution: Array<{
    timeSlot: string; // "09:00-12:00", "12:00-15:00", etc.
    teamCount: number;
    participantCount: number;
  }>;
  /** 组队趋势 */
  teamTrend: Array<{
    weekStart: string;
    teamCount: number;
    participantCount: number;
    averageTeamSize: number;
  }>;
}

/**
 * 导出数据格式
 */
export interface ExportData {
  data: any[];
  filename: string;
  sheetName?: string;
}

/**
 * 报表查询参数
 */
export interface ReportQuery {
  startDate: string;
  endDate: string;
  timeRange?: TimeRange;
  gameIds?: string[];
  userIds?: string[];
} 