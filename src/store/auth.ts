/**
 * 用户认证状态管理
 */

import { create } from 'zustand';
import { AuthState, User } from '../types/user';
import * as authService from '../services/auth';
import { authStorage } from '../utils/auth-storage';

interface AuthStore extends AuthState {
  // 操作方法
  login: (username: string) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => void;
  clearError: () => void;
  updateFavoriteGames: (gameIds: string[]) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  
  /**
   * 登录
   */
  login: async (username: string) => {
    console.log('🔐 开始登录流程:', username);
    set({ isLoading: true, error: null });
    try {
      const user = await authService.loginWithNickname(username);
      console.log('✅ 登录成功，更新状态:', user);
      set({ user, isLoading: false });
      return user;
    } catch (error: any) {
      console.error('❌ 登录失败:', error);
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
      authStorage.clearAuth();
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
    console.log('🔍 检查当前登录状态...');
    set({ isLoading: true, error: null });
    
    try {
      const user = authService.getCurrentUser();
      console.log('📋 当前用户状态:', user);
      set({ user, isLoading: false });
    } catch (error: any) {
      console.error('❌ 检查登录状态失败:', error);
      set({ user: null, isLoading: false, error: error.message });
    }
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

// 在开发环境下暴露store到全局，方便调试
if (process.env.NODE_ENV === 'development') {
  (window as any).authStore = useAuthStore;
  console.log('💡 Auth Store 已暴露到 window.authStore');
} 