/**
 * 用户相关类型定义
 */

export interface User {
  objectId: string;
  username: string;           // 昵称（唯一）
  favoriteGames: string[];    // 收藏的游戏ID列表
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginForm {
  username: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
} 