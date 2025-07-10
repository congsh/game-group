/**
 * 勋章相关类型定义
 */

export interface Badge {
  objectId: string;
  title: string;               // 勋章标题
  description: string;         // 勋章描述
  icon?: string;              // 勋章图标（可选）
  color: string;              // 勋章颜色
  giverUserId: string;        // 给予者用户ID
  giverUsername: string;      // 给予者用户名
  receiverUserId: string;     // 接受者用户ID
  receiverUsername: string;   // 接受者用户名
  likes: number;              // 点赞数
  likedBy: string[];          // 点赞用户ID列表
  isDisplayed: boolean;       // 是否在勋章墙展示（前三个）
  createdAt: Date;
  updatedAt: Date;
}

export interface BadgeWallSettings {
  objectId?: string;
  userId: string;             // 用户ID
  isEnabled: boolean;         // 是否开启勋章墙
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateBadgeRequest {
  title: string;
  description: string;
  icon?: string;
  color: string;
  receiverUserId: string;
}

export interface BadgeWallData {
  settings: BadgeWallSettings;
  displayedBadges: Badge[];   // 展示的前三个勋章
  allBadges: Badge[];         // 所有勋章
  totalCount: number;         // 总勋章数
}

export interface BadgeLikeRequest {
  badgeId: string;
  action: 'like' | 'unlike';
} 