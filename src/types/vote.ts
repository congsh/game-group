/**
 * 投票相关类型定义
 */

export interface DailyVote {
  objectId: string;
  date: string;              // 投票日期 (YYYY-MM-DD)
  user: string;              // 投票用户ID
  wantsToPlay: boolean;      // 是否想玩
  selectedGames: string[];   // 选择的游戏ID列表
  createdAt: Date;
  updatedAt: Date;
}

export interface VoteForm {
  wantsToPlay: boolean;
  selectedGames: string[];
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
  }>;
} 