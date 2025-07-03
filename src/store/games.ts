/**
 * 游戏状态管理
 */

import { create } from 'zustand';
import { Game, GameForm, GameFilters, BatchImportResult } from '../types/game';
import * as gameService from '../services/games';
import { useAuthStore } from './auth';

interface GameState {
  // 游戏列表（用于游戏库页面，受筛选影响）
  games: Game[];
  total: number;
  loading: boolean;
  error: string | null;
  
  // 完整游戏列表（不受筛选影响，用于投票和组队页面）
  allGames: Game[];
  allGamesLoading: boolean;
  
  // 分页
  currentPage: number;
  pageSize: number;
  
  // 筛选
  filters: GameFilters;
  
  // 选中的游戏
  selectedGame: Game | null;
  
  // 收藏的游戏
  favoriteGames: Game[];
  favoriteLoading: boolean;
  
  // 平台和类型选项
  platforms: string[];
  types: string[];
  
  // 操作方法
  fetchGames: () => Promise<void>;
  fetchAllGames: () => Promise<void>;
  fetchGameById: (id: string) => Promise<void>;
  createGame: (gameData: GameForm) => Promise<void>;
  updateGame: (id: string, gameData: GameForm) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  likeGame: (id: string) => Promise<void>;
  unlikeGame: (id: string) => Promise<void>;
  batchImportGames: (games: GameForm[]) => Promise<BatchImportResult>;
  
  // 收藏管理
  fetchFavoriteGames: () => Promise<void>;
  toggleFavorite: (gameId: string) => Promise<void>;
  
  // 筛选和分页
  setFilters: (filters: GameFilters) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  clearFilters: () => void;
  
  // 工具方法
  fetchPlatforms: () => Promise<void>;
  fetchTypes: () => Promise<void>;
  clearError: () => void;
  setSelectedGame: (game: Game | null) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // 初始状态
  games: [],
  total: 0,
  loading: false,
  error: null,
  
  allGames: [],
  allGamesLoading: false,
  
  currentPage: 1,
  pageSize: 20,
  
  filters: {},
  
  selectedGame: null,
  
  favoriteGames: [],
  favoriteLoading: false,
  
  platforms: [],
  types: [],
  
  /**
   * 获取游戏列表
   */
  fetchGames: async () => {
    const { filters, currentPage, pageSize } = get();
    set({ loading: true, error: null });
    
    try {
      const { games, total } = await gameService.getGames(filters, currentPage, pageSize);
      set({ games, total, loading: false });
    } catch (error: any) {
      // 不显示404错误，因为这只是数据表不存在
      if (!error.message.includes('Class or object doesn\'t exists')) {
        set({ error: error.message, loading: false });
      } else {
        set({ loading: false });
      }
    }
  },
  
  /**
   * 获取所有游戏
   */
  fetchAllGames: async () => {
    set({ allGamesLoading: true, error: null });
    
    try {
      const allGames = await gameService.getAllGames();
      set({ allGames, allGamesLoading: false });
    } catch (error: any) {
      // 不显示404错误，因为这只是数据表不存在
      if (!error.message.includes('Class or object doesn\'t exists')) {
        set({ error: error.message, allGamesLoading: false });
      } else {
        set({ allGamesLoading: false });
      }
    }
  },
  
  /**
   * 根据ID获取游戏详情
   */
  fetchGameById: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const game = await gameService.getGameById(id);
      set({ selectedGame: game, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  /**
   * 创建新游戏
   */
  createGame: async (gameData: GameForm) => {
    set({ loading: true, error: null });
    
    try {
      const newGame = await gameService.createGame(gameData);
      const { games, allGames } = get();
      set({ 
        games: [newGame, ...games],
        allGames: [newGame, ...allGames],
        total: get().total + 1,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  /**
   * 更新游戏
   */
  updateGame: async (id: string, gameData: GameForm) => {
    set({ loading: true, error: null });
    
    try {
      const updatedGame = await gameService.updateGame(id, gameData);
      const { games, allGames } = get();
      const updatedGames = games.map(game => 
        game.objectId === id ? updatedGame : game
      );
      const updatedAllGames = allGames.map(game => 
        game.objectId === id ? updatedGame : game
      );
      
      set({ 
        games: updatedGames,
        allGames: updatedAllGames,
        selectedGame: updatedGame,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  /**
   * 删除游戏
   */
  deleteGame: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      await gameService.deleteGame(id);
      const { games, allGames } = get();
      const filteredGames = games.filter(game => game.objectId !== id);
      const filteredAllGames = allGames.filter(game => game.objectId !== id);
      
      set({ 
        games: filteredGames,
        allGames: filteredAllGames,
        total: get().total - 1,
        selectedGame: get().selectedGame?.objectId === id ? null : get().selectedGame,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  /**
   * 点赞游戏
   */
  likeGame: async (id: string) => {
    try {
      await gameService.likeGame(id);
      const { games, allGames } = get();
      const updatedGames = games.map(game => 
        game.objectId === id 
          ? { ...game, likeCount: game.likeCount + 1 } 
          : game
      );
      const updatedAllGames = allGames.map(game => 
        game.objectId === id 
          ? { ...game, likeCount: game.likeCount + 1 } 
          : game
      );
      
      set({ games: updatedGames, allGames: updatedAllGames });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
  
  /**
   * 取消点赞游戏
   */
  unlikeGame: async (id: string) => {
    try {
      await gameService.unlikeGame(id);
      const { games, allGames } = get();
      const updatedGames = games.map(game => 
        game.objectId === id 
          ? { ...game, likeCount: Math.max(0, game.likeCount - 1) } 
          : game
      );
      const updatedAllGames = allGames.map(game => 
        game.objectId === id 
          ? { ...game, likeCount: Math.max(0, game.likeCount - 1) } 
          : game
      );
      
      set({ games: updatedGames, allGames: updatedAllGames });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
  
  /**
   * 批量导入游戏
   */
  batchImportGames: async (games: GameForm[]): Promise<BatchImportResult> => {
    set({ loading: true, error: null });
    
    try {
      const result = await gameService.batchImportGames(games);
      
      // 如果有成功导入的游戏，刷新列表
      if (result.success > 0) {
        await get().fetchGames();
        await get().fetchAllGames();
      }
      
      set({ loading: false });
      return result;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  /**
   * 获取收藏的游戏
   */
  fetchFavoriteGames: async () => {
    set({ favoriteLoading: true, error: null });
    
    try {
      const favoriteGames = await gameService.getFavoriteGames();
      set({ favoriteGames, favoriteLoading: false });
    } catch (error: any) {
      // 不显示404错误，因为这只是数据表不存在
      if (!error.message.includes('Class or object doesn\'t exists')) {
        set({ error: error.message, favoriteLoading: false });
      } else {
        set({ favoriteLoading: false });
      }
    }
  },
  
  /**
   * 切换收藏状态
   */
  toggleFavorite: async (gameId: string) => {
    try {
      const { favoriteGames, allGames } = get();
      const isFavorite = favoriteGames.some(game => game.objectId === gameId);
      
      if (isFavorite) {
        // 取消收藏
        const updatedFavorites = favoriteGames.filter(game => game.objectId !== gameId);
        set({ favoriteGames: updatedFavorites });
        
        // 更新用户收藏列表
        const favoriteGameIds = updatedFavorites.map(game => game.objectId);
        await useAuthStore.getState().updateFavoriteGames(favoriteGameIds);
      } else {
        // 添加收藏 - 优先从allGames中查找，然后从games中查找
        const game = allGames.find(g => g.objectId === gameId) || 
                     get().games.find(g => g.objectId === gameId) || 
                     get().selectedGame;
        if (game) {
          const updatedFavorites = [...favoriteGames, game];
          set({ favoriteGames: updatedFavorites });
          
          // 更新用户收藏列表
          const favoriteGameIds = updatedFavorites.map(game => game.objectId);
          await useAuthStore.getState().updateFavoriteGames(favoriteGameIds);
        }
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
  
  /**
   * 设置筛选条件
   */
  setFilters: (filters: GameFilters) => {
    set({ filters, currentPage: 1 });
    get().fetchGames();
  },
  
  /**
   * 设置当前页
   */
  setPage: (page: number) => {
    set({ currentPage: page });
    get().fetchGames();
  },
  
  /**
   * 设置页面大小
   */
  setPageSize: (size: number) => {
    set({ pageSize: size, currentPage: 1 });
    get().fetchGames();
  },
  
  /**
   * 清除筛选条件
   */
  clearFilters: () => {
    set({ filters: {}, currentPage: 1 });
    get().fetchGames();
  },
  
  /**
   * 获取平台列表
   */
  fetchPlatforms: async () => {
    try {
      const platforms = await gameService.getGamePlatforms();
      set({ platforms });
    } catch (error: any) {
      // 不显示404错误，因为这只是数据表不存在
      if (!error.message.includes('Class or object doesn\'t exists')) {
        set({ error: error.message });
      }
    }
  },
  
  /**
   * 获取游戏类型列表
   */
  fetchTypes: async () => {
    try {
      const types = await gameService.getGameTypes();
      set({ types });
    } catch (error: any) {
      // 不显示404错误，因为这只是数据表不存在
      if (!error.message.includes('Class or object doesn\'t exists')) {
        set({ error: error.message });
      }
    }
  },
  
  /**
   * 清除错误信息
   */
  clearError: () => set({ error: null }),
  
  /**
   * 设置选中的游戏
   */
  setSelectedGame: (game: Game | null) => set({ selectedGame: game })
})); 