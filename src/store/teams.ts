/**
 * 周末组队状态管理
 * 使用 Zustand 管理组队相关状态
 */

import { create } from 'zustand';
import { TeamForm, TeamFilters, TeamDetails } from '../types/team';
import {
  createWeekendTeam,
  getWeekendTeams,
  getWeekendTeamById,
  joinWeekendTeam,
  leaveWeekendTeam,
  dissolveWeekendTeam,
  getRecommendedTeams
} from '../services/teams';
import { useAuthStore } from './auth';

interface TeamState {
  // 组队数据
  teams: TeamDetails[];
  recommendedTeams: TeamDetails[];
  selectedTeam: TeamDetails | null;
  total: number;
  
  // 分页和筛选
  currentPage: number;
  pageSize: number;
  filters: TeamFilters;
  
  // 加载状态
  loading: boolean;
  submitting: boolean;
  joining: boolean;
  
  // 错误状态
  error: string | null;
  
  // 操作方法
  fetchTeams: () => Promise<void>;
  fetchTeamById: (teamId: string) => Promise<void>;
  createTeam: (teamForm: TeamForm) => Promise<void>;
  joinTeam: (teamId: string) => Promise<void>;
  leaveTeam: (teamId: string) => Promise<void>;
  dissolveTeam: (teamId: string) => Promise<void>;
  fetchRecommendedTeams: () => Promise<void>;
  
  // 筛选和分页
  setFilters: (filters: TeamFilters) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  clearFilters: () => void;
  
  // 工具方法
  clearError: () => void;
  setSelectedTeam: (team: TeamDetails | null) => void;
  reset: () => void;
}

/**
 * 周末组队状态管理Store
 */
export const useTeamStore = create<TeamState>((set, get) => ({
  // 初始状态
  teams: [],
  recommendedTeams: [],
  selectedTeam: null,
  total: 0,
  
  currentPage: 1,
  pageSize: 12,
  filters: {},
  
  loading: false,
  submitting: false,
  joining: false,
  error: null,

  /**
   * 获取组队列表
   */
  fetchTeams: async () => {
    const { filters, currentPage, pageSize } = get();
    set({ loading: true, error: null });

    try {
      const { teams, total } = await getWeekendTeams(filters, currentPage, pageSize);
      
      // 添加当前用户相关信息
      const { user } = useAuthStore.getState();
      const enhancedTeams = teams.map(team => ({
        ...team,
        isCurrentUserMember: user ? team.members.includes(user.objectId) : false,
        isCurrentUserLeader: user ? team.leader === user.objectId : false,
      }));
      
      set({ teams: enhancedTeams, total, loading: false });
    } catch (error) {
      console.error('获取组队列表失败:', error);
      set({ 
        error: error instanceof Error ? error.message : '获取组队列表失败',
        loading: false 
      });
    }
  },

  /**
   * 根据ID获取组队详情
   */
  fetchTeamById: async (teamId: string) => {
    set({ loading: true, error: null });

    try {
      const team = await getWeekendTeamById(teamId);
      
      // 添加当前用户相关信息
      const { user } = useAuthStore.getState();
      const enhancedTeam = {
        ...team,
        isCurrentUserMember: user ? team.members.includes(user.objectId) : false,
        isCurrentUserLeader: user ? team.leader === user.objectId : false,
      };
      
      set({ selectedTeam: enhancedTeam, loading: false });
    } catch (error) {
      console.error('获取组队详情失败:', error);
      set({ 
        error: error instanceof Error ? error.message : '获取组队详情失败',
        loading: false 
      });
    }
  },

  /**
   * 创建新组队
   */
  createTeam: async (teamForm: TeamForm) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ error: '用户未登录' });
      return;
    }

    set({ submitting: true, error: null });

    try {
      const newTeam = await createWeekendTeam(teamForm, user.objectId);
      
      // 将新创建的队伍添加到列表顶部
      const { teams } = get();
      const enhancedNewTeam: TeamDetails = {
        ...newTeam,
        gameName: '新游戏', // 这里需要从游戏列表中获取，暂时使用占位符
        leaderName: user.username,
        memberNames: [user.username],
        isCurrentUserMember: true,
        isCurrentUserLeader: true,
      };
      
      set({ 
        teams: [enhancedNewTeam, ...teams],
        total: get().total + 1,
        submitting: false 
      });
      
      // 刷新列表以获取完整数据
      get().fetchTeams();
    } catch (error) {
      console.error('创建组队失败:', error);
      set({ 
        error: error instanceof Error ? error.message : '创建组队失败',
        submitting: false 
      });
      throw error;
    }
  },

  /**
   * 加入组队
   */
  joinTeam: async (teamId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ error: '用户未登录' });
      return;
    }

    set({ joining: true, error: null });

    try {
      await joinWeekendTeam(teamId, user.objectId);
      
      // 更新本地状态
      const { teams, selectedTeam } = get();
      
      const updatedTeams = teams.map(team => {
        if (team.objectId === teamId) {
          return {
            ...team,
            members: [...team.members, user.objectId],
            memberNames: [...team.memberNames, user.username],
            isCurrentUserMember: true,
            status: team.members.length + 1 >= team.maxMembers ? 'full' : team.status
          } as TeamDetails;
        }
        return team;
      });

      const updatedSelectedTeam = selectedTeam?.objectId === teamId ? {
        ...selectedTeam,
        members: [...selectedTeam.members, user.objectId],
        memberNames: [...selectedTeam.memberNames, user.username],
        isCurrentUserMember: true,
        status: selectedTeam.members.length + 1 >= selectedTeam.maxMembers ? 'full' : selectedTeam.status
      } as TeamDetails : selectedTeam;

      set({ 
        teams: updatedTeams,
        selectedTeam: updatedSelectedTeam,
        joining: false 
      });
    } catch (error) {
      console.error('加入组队失败:', error);
      set({ 
        error: error instanceof Error ? error.message : '加入组队失败',
        joining: false 
      });
      throw error;
    }
  },

  /**
   * 离开组队
   * 如果是队长离开，队伍将被删除
   */
  leaveTeam: async (teamId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ error: '用户未登录' });
      return;
    }

    set({ joining: true, error: null });

    try {
      const result = await leaveWeekendTeam(teamId, user.objectId);
      
      // 更新本地状态
      const { teams, selectedTeam } = get();
      
      // 如果返回null，说明队长离开了，队伍被删除
      if (result === null) {
        // 从列表中移除队伍
        const filteredTeams = teams.filter(team => team.objectId !== teamId);
        set({ 
          teams: filteredTeams,
          total: get().total - 1,
          selectedTeam: selectedTeam?.objectId === teamId ? null : selectedTeam,
          joining: false 
        });
        return;
      }
      
      // 普通成员离开的处理逻辑
      const updatedTeams = teams.map(team => {
        if (team.objectId === teamId) {
          const newMembers = team.members.filter(id => id !== user.objectId);
          const newMemberNames = team.memberNames.filter((_, index) => 
            team.members[index] !== user.objectId
          );
          
          return {
            ...team,
            members: newMembers,
            memberNames: newMemberNames,
            isCurrentUserMember: false,
            status: team.status === 'full' && newMembers.length < team.maxMembers ? 'open' : team.status
          } as TeamDetails;
        }
        return team;
      });

      const updatedSelectedTeam = selectedTeam?.objectId === teamId ? {
        ...selectedTeam,
        members: selectedTeam.members.filter(id => id !== user.objectId),
        memberNames: selectedTeam.memberNames.filter((_, index) => 
          selectedTeam.members[index] !== user.objectId
        ),
        isCurrentUserMember: false,
        status: selectedTeam.status === 'full' && 
                selectedTeam.members.filter(id => id !== user.objectId).length < selectedTeam.maxMembers 
                ? 'open' : selectedTeam.status
      } as TeamDetails : selectedTeam;

      set({ 
        teams: updatedTeams,
        selectedTeam: updatedSelectedTeam,
        joining: false 
      });
    } catch (error) {
      console.error('离开组队失败:', error);
      set({ 
        error: error instanceof Error ? error.message : '离开组队失败',
        joining: false 
      });
      throw error;
    }
  },

  /**
   * 解散组队（仅队长可操作）
   */
  dissolveTeam: async (teamId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ error: '用户未登录' });
      return;
    }

    set({ submitting: true, error: null });

    try {
      await dissolveWeekendTeam(teamId, user.objectId);
      
      // 从列表中移除
      const { teams } = get();
      const filteredTeams = teams.filter(team => team.objectId !== teamId);
      
      set({ 
        teams: filteredTeams,
        total: get().total - 1,
        selectedTeam: get().selectedTeam?.objectId === teamId ? null : get().selectedTeam,
        submitting: false 
      });
    } catch (error) {
      console.error('解散组队失败:', error);
      set({ 
        error: error instanceof Error ? error.message : '解散组队失败',
        submitting: false 
      });
      throw error;
    }
  },

  /**
   * 获取推荐组队
   */
  fetchRecommendedTeams: async () => {
    const { user } = useAuthStore.getState();
    if (!user) {
      return;
    }

    try {
      const recommendedTeams = await getRecommendedTeams(user.objectId);
      
      // 添加当前用户相关信息
      const enhancedRecommendedTeams = recommendedTeams.map(team => ({
        ...team,
        isCurrentUserMember: team.members.includes(user.objectId),
        isCurrentUserLeader: team.leader === user.objectId,
      }));
      
      set({ recommendedTeams: enhancedRecommendedTeams });
    } catch (error) {
      console.error('获取推荐组队失败:', error);
      // 推荐失败不显示错误，只是没有推荐而已
    }
  },

  /**
   * 设置筛选条件
   */
  setFilters: (filters: TeamFilters) => {
    set({ filters, currentPage: 1 });
    get().fetchTeams();
  },

  /**
   * 设置当前页
   */
  setPage: (page: number) => {
    set({ currentPage: page });
    get().fetchTeams();
  },

  /**
   * 设置页面大小
   */
  setPageSize: (size: number) => {
    set({ pageSize: size, currentPage: 1 });
    get().fetchTeams();
  },

  /**
   * 清除筛选条件
   */
  clearFilters: () => {
    set({ filters: {}, currentPage: 1 });
    get().fetchTeams();
  },

  /**
   * 清除错误信息
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * 设置选中的组队
   */
  setSelectedTeam: (team: TeamDetails | null) => {
    set({ selectedTeam: team });
  },

  /**
   * 重置状态
   */
  reset: () => {
    set({
      teams: [],
      recommendedTeams: [],
      selectedTeam: null,
      total: 0,
      currentPage: 1,
      filters: {},
      loading: false,
      submitting: false,
      joining: false,
      error: null,
    });
  },
}));

/**
 * 检查当前用户是否已加入指定组队
 */
export const useIsUserInTeam = (teamId: string): boolean => {
  const teams = useTeamStore(state => state.teams);
  const team = teams.find(t => t.objectId === teamId);
  return team?.isCurrentUserMember || false;
};

/**
 * 检查当前用户是否是指定组队的队长
 */
export const useIsUserTeamLeader = (teamId: string): boolean => {
  const teams = useTeamStore(state => state.teams);
  const team = teams.find(t => t.objectId === teamId);
  return team?.isCurrentUserLeader || false;
};

/**
 * 获取当前用户创建的组队列表
 */
export const useUserCreatedTeams = (): TeamDetails[] => {
  const teams = useTeamStore(state => state.teams);
  return teams.filter(team => team.isCurrentUserLeader);
};

/**
 * 获取当前用户加入的组队列表
 */
export const useUserJoinedTeams = (): TeamDetails[] => {
  const teams = useTeamStore(state => state.teams);
  return teams.filter(team => team.isCurrentUserMember);
}; 