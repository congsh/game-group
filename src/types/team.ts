/**
 * 组队相关类型定义
 */

// 成员时间信息
export interface MemberTimeInfo {
  userId: string;
  username: string;
  startTime: string;  // HH:mm 格式
  endTime: string;    // HH:mm 格式
  joinedAt: Date;     // 加入时间
}

export interface WeekendTeam {
  objectId: string;
  game: string;              // 游戏ID
  eventDate: string;         // 活动日期 (YYYY-MM-DD)
  startTime: string;         // 队长设定的开始时间 (HH:mm)
  endTime: string;           // 队长设定的结束时间 (HH:mm)
  leader: string;            // 队长用户ID
  members: string[];         // 成员用户ID列表
  memberTimeInfo: MemberTimeInfo[]; // 成员时间信息
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

// 加入团队时的表单数据
export interface JoinTeamForm {
  teamId: string;
  startTime: string;
  endTime: string;
}

export interface TeamFilters {
  gameId?: string;
  eventDate?: string;
  startDate?: string;     // 开始日期筛选 (YYYY-MM-DD)
  endDate?: string;       // 结束日期筛选 (YYYY-MM-DD)
  status?: 'open' | 'full' | 'closed';
  sortBy?: 'eventDate' | 'createdAt' | 'memberCount' | 'startTime';  // 扩展排序选项
  sortOrder?: 'asc' | 'desc';
  showExpired?: boolean; // 新增：是否显示已过期的组队
}

export interface TeamDetails extends WeekendTeam {
  gameName: string;
  leaderName: string;
  memberNames: string[];
  isCurrentUserMember: boolean;
  isCurrentUserLeader: boolean;
  // 时间重叠分析
  timeOverlap?: {
    commonStartTime: string;  // 所有成员重叠的开始时间
    commonEndTime: string;    // 所有成员重叠的结束时间
    hasOverlap: boolean;      // 是否有重叠时间
  };
} 