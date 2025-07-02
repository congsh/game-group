/**
 * 用户认证状态管理
 */

import { create } from 'zustand';
import { AuthState } from '../types/user';
import * as authService from '../services/auth';

interface AuthStore extends AuthState {
  // 操作方法
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
  clearError: () => void;
  updateFavoriteGames: (gameIds: string[]) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  
  /**
   * 登录
   */
  login: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.loginWithNickname(username);
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  /**
   * 退出登录
   */
  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.logout();
      set({ user: null, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  /**
   * 检查登录状态
   */
  checkAuth: () => {
    const user = authService.getCurrentUser();
    set({ user });
  },
  
  /**
   * 清除错误信息
   */
  clearError: () => set({ error: null }),
  
  /**
   * 更新收藏游戏列表
   */
  updateFavoriteGames: async (gameIds: string[]) => {
    try {
      await authService.updateFavoriteGames(gameIds);
      const { user } = get();
      if (user) {
        set({ 
          user: { 
            ...user, 
            favoriteGames: gameIds 
          } 
        });
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  }
})); 