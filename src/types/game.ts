/**
 * 游戏相关类型定义
 */

export interface Game {
  objectId: string;
  name: string;               // 游戏名称
  minPlayers: number;         // 最少人数
  maxPlayers: number;         // 最多人数
  platform?: string;         // 游戏平台
  description?: string;       // 游戏描述
  type?: string;             // 游戏类型
  likeCount: number;         // 点赞数
  favoriteCount?: number;    // 收藏数（新增）
  hotScore?: number;         // 综合热度分数（新增）
  createdBy: string;         // 创建者用户ID
  createdAt: Date;
  updatedAt: Date;
}

export interface GameForm {
  name: string;
  minPlayers: number;
  maxPlayers: number;
  platform?: string;
  description?: string;
  type?: string;
}

export interface GameFilters {
  search?: string;
  platform?: string;
  type?: string;
  sortBy?: 'name' | 'likeCount' | 'favoriteCount' | 'hotScore' | 'createdAt';  // 扩展排序字段
  sortOrder?: 'asc' | 'desc';
}

export interface BatchImportResult {
  success: number;
  failed: number;
  errors: string[];
} 