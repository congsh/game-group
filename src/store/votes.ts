/**
 * 每日投票状态管理
 * 使用 Zustand 管理投票相关状态
 */

import { create } from 'zustand';
import { DailyVote, VoteForm, VoteStats } from '../types/vote';
import { getTodayVote, submitTodayVote, getTodayVoteStats, getRecentVoteStats } from '../services/votes';
import { useAuthStore } from './auth';

interface VoteState {
  // 投票数据
  todayVote: DailyVote | null;
  todayStats: VoteStats | null;
  recentStats: VoteStats[];
  
  // 加载状态
  loading: boolean;
  submitting: boolean;
  statsLoading: boolean;
  
  // 错误状态
  error: string | null;
  
  // 操作方法
  loadTodayVote: () => Promise<void>;
  submitVote: (voteForm: VoteForm) => Promise<void>;
  loadTodayStats: () => Promise<void>;
  loadRecentStats: (days?: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

/**
 * 每日投票状态管理Store
 */
export const useVoteStore = create<VoteState>((set, get) => ({
  // 初始状态
  todayVote: null,
  todayStats: null,
  recentStats: [],
  loading: false,
  submitting: false,
  statsLoading: false,
  error: null,

  /**
   * 加载今日投票记录
   */
  loadTodayVote: async () => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ error: '用户未登录' });
      return;
    }

    set({ loading: true, error: null });

    try {
      const todayVote = await getTodayVote(user.objectId);
      set({ todayVote, loading: false });
    } catch (error) {
      console.error('加载今日投票失败:', error);
      set({ 
        error: error instanceof Error ? error.message : '加载今日投票失败',
        loading: false 
      });
    }
  },

  /**
   * 提交投票
   */
  submitVote: async (voteForm: VoteForm) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ error: '用户未登录' });
      return;
    }

    set({ submitting: true, error: null });

    try {
      await submitTodayVote(user.objectId, voteForm);
      
      // 投票提交成功后，重新加载投票数据以确保获取最新状态
      await get().loadTodayVote();
      
      set({ submitting: false });
      
      // 投票后刷新统计数据
      get().loadTodayStats();
    } catch (error) {
      console.error('提交投票失败:', error);
      set({ 
        error: error instanceof Error ? error.message : '提交投票失败',
        submitting: false 
      });
      throw error; // 重新抛出错误以便组件处理
    }
  },

  /**
   * 加载今日投票统计
   */
  loadTodayStats: async () => {
    set({ statsLoading: true, error: null });

    try {
      const todayStats = await getTodayVoteStats();
      set({ todayStats, statsLoading: false });
    } catch (error) {
      console.error('加载投票统计失败:', error);
      set({ 
        error: error instanceof Error ? error.message : '加载投票统计失败',
        statsLoading: false 
      });
    }
  },

  /**
   * 加载最近几天的投票统计（用于趋势分析）
   */
  loadRecentStats: async (days: number = 7) => {
    set({ statsLoading: true, error: null });

    try {
      const recentStats = await getRecentVoteStats(days);
      set({ recentStats, statsLoading: false });
    } catch (error) {
      console.error('加载最近投票统计失败:', error);
      set({ 
        error: error instanceof Error ? error.message : '加载最近投票统计失败',
        statsLoading: false 
      });
    }
  },

  /**
   * 清除错误信息
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * 重置状态
   */
  reset: () => {
    set({
      todayVote: null,
      todayStats: null,
      recentStats: [],
      loading: false,
      submitting: false,
      statsLoading: false,
      error: null,
    });
  },
}));

/**
 * 检查用户今日是否已投票
 */
export const useHasVotedToday = (): boolean => {
  const todayVote = useVoteStore(state => state.todayVote);
  return todayVote !== null;
};

/**
 * 获取今日投票的游戏选择
 */
export const useTodaySelectedGames = (): string[] => {
  const todayVote = useVoteStore(state => state.todayVote);
  return todayVote?.selectedGames || [];
};

/**
 * 获取今日是否想要玩游戏
 */
export const useTodayWantsToPlay = (): boolean => {
  const todayVote = useVoteStore(state => state.todayVote);
  return todayVote?.wantsToPlay || false;
}; 