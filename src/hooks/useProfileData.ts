/**
 * 个人中心数据Hook
 * 管理用户个人数据的获取和状态
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { 
  profileService, 
  UserStats, 
  VoteHistoryItem, 
  TeamHistoryItem, 
  FavoriteGameItem 
} from '../services/profile';

interface UseProfileDataReturn {
  userStats: UserStats | null;
  voteHistory: VoteHistoryItem[];
  teamHistory: TeamHistoryItem[];
  favoriteGames: FavoriteGameItem[];
  loading: boolean;
  error: string | null;
  refreshData: () => void;
}

export const useProfileData = (dateRange?: [any, any] | null): UseProfileDataReturn => {
  const { user } = useAuthStore();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [voteHistory, setVoteHistory] = useState<VoteHistoryItem[]>([]);
  const [teamHistory, setTeamHistory] = useState<TeamHistoryItem[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<FavoriteGameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user?.objectId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 转换日期范围
      const dateRangeConverted = dateRange && dateRange[0] && dateRange[1] 
        ? [dateRange[0].toDate(), dateRange[1].toDate()] as [Date, Date]
        : undefined;

      // 并行获取所有数据
      const [stats, votes, teams, favorites] = await Promise.all([
        profileService.getUserStats(user.objectId, dateRangeConverted),
        profileService.getVoteHistory(user.objectId, dateRangeConverted),
        profileService.getTeamHistory(user.objectId, dateRangeConverted),
        profileService.getFavoriteGames(user.objectId, dateRangeConverted)
      ]);

      setUserStats(stats);
      setVoteHistory(votes);
      setTeamHistory(teams);
      setFavoriteGames(favorites);
    } catch (err) {
      console.error('获取个人数据失败:', err);
      setError(err instanceof Error ? err.message : '数据获取失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和依赖更新
  useEffect(() => {
    fetchData();
  }, [user?.objectId, dateRange]);

  const refreshData = () => {
    fetchData();
  };

  return {
    userStats,
    voteHistory,
    teamHistory,
    favoriteGames,
    loading,
    error,
    refreshData
  };
}; 