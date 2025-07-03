/**
 * 投票相关类型定义
 */

/**
 * 游戏倾向度数据结构
 */
export interface GamePreference {
  gameId: string;      // 游戏ID
  tendency: number;    // 倾向度分数 (1-5)
}

export interface DailyVote {
  objectId: string;
  date: string;              // 投票日期 (YYYY-MM-DD)
  user: string;              // 投票用户ID
  wantsToPlay: boolean;      // 是否想玩
  selectedGames: string[];   // 选择的游戏ID列表
  gamePreferences?: GamePreference[];  // 游戏倾向度评分（可选，保持向后兼容）
  createdAt: Date;
  updatedAt: Date;
}

export interface VoteForm {
  wantsToPlay: boolean;
  selectedGames: string[];
  gamePreferences?: GamePreference[];  // 游戏倾向度评分（可选）
}

export interface VoteStats {
  date: string;
  totalVotes: number;
  wantToPlayCount: number;
  gameVoteCounts: Record<string, number>; // 游戏ID -> 票数
  topGames: Array<{
    gameId: string;
    gameName: string;
    voteCount: number;
    averageTendency?: number;  // 平均倾向度分数（可选）
  }>;
  gameTendencies?: Record<string, {    // 游戏倾向度统计（可选）
    averageTendency: number;           // 平均倾向度
    tendencyCount: number;             // 评分人数
  }>;
} 