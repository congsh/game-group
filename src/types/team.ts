/**
 * 组队相关类型定义
 */

export interface WeekendTeam {
  objectId: string;
  game: string;              // 游戏ID
  eventDate: string;         // 活动日期 (YYYY-MM-DD)
  startTime: string;         // 开始时间 (HH:mm)
  endTime: string;           // 结束时间 (HH:mm)
  leader: string;            // 队长用户ID
  members: string[];         // 成员用户ID列表
  maxMembers: number;        // 最大成员数（从游戏表获取）
  status: 'open' | 'full' | 'closed'; // 组队状态
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamForm {
  gameId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
}

export interface TeamFilters {
  gameId?: string;
  eventDate?: string;
  status?: 'open' | 'full' | 'closed';
  sortBy?: 'eventDate' | 'createdAt' | 'memberCount' | 'startTime';  // 扩展排序选项
  sortOrder?: 'asc' | 'desc';
}

export interface TeamDetails extends WeekendTeam {
  gameName: string;
  leaderName: string;
  memberNames: string[];
  isCurrentUserMember: boolean;
  isCurrentUserLeader: boolean;
} 