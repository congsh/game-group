/**
 * 守望先锋聊天代码状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  ChatCodeElement, 
  ChatCodeCombo, 
  ChatCodeBuilder, 
  ChatCodeFilter,
  ChatCodeHistory 
} from '../types/overwatch';
import { 
  buildChatCode, 
  buildPreview, 
  validateChatCode, 
  generateId,
  createDefaultCombo
} from '../utils/overwatch-codes';
import { useAuthStore } from './auth';

interface OverwatchStore {
  // 当前构建器状态
  builder: ChatCodeBuilder;
  
  // 收藏的组合
  favorites: ChatCodeCombo[];
  
  // 历史记录
  history: ChatCodeHistory[];
  
  // 当前过滤器
  filter: ChatCodeFilter;
  
  // 当前编辑的组合
  currentCombo: ChatCodeCombo | null;
  
  // 构建器操作
  addElement: (element: ChatCodeElement) => void;
  removeElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: Partial<ChatCodeElement>) => void;
  moveElement: (fromIndex: number, toIndex: number) => void;
  clearBuilder: () => void;
  
  // 文本输入处理
  addTextElement: (text: string) => void;
  
  // 组合管理
  saveCombo: (name: string, description?: string, tags?: string[]) => void;
  loadCombo: (combo: ChatCodeCombo) => void;
  deleteCombo: (comboId: string) => void;
  
  // 收藏管理
  toggleFavorite: (comboId: string) => void;
  addToFavorites: (combo: ChatCodeCombo) => void;
  removeFromFavorites: (comboId: string) => void;
  
  // 历史记录管理
  addToHistory: (combo: ChatCodeCombo) => void;
  clearHistory: () => void;
  
  // 过滤器
  setFilter: (filter: Partial<ChatCodeFilter>) => void;
  resetFilter: () => void;
  
  // 获取过滤后的收藏列表
  getFilteredFavorites: () => ChatCodeCombo[];
  
  // 获取最近使用的组合
  getRecentCombos: (limit?: number) => ChatCodeCombo[];
  
  // 导入/导出
  exportData: () => string;
  importData: (data: string) => boolean;
}

const DEFAULT_BUILDER: ChatCodeBuilder = {
  elements: [],
  preview: '',
  fullCode: '',
  isValid: true,
};

const DEFAULT_FILTER: ChatCodeFilter = {
  type: 'all',
  search: '',
  favoriteOnly: false,
  tags: [],
};

export const useOverwatchStore = create<OverwatchStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      builder: DEFAULT_BUILDER,
      favorites: [],
      history: [],
      filter: DEFAULT_FILTER,
      currentCombo: null,
      
      // 构建器操作
      addElement: (element) => {
        set((state) => {
          const newElements = [...state.builder.elements, element];
          const fullCode = buildChatCode(newElements);
          const preview = buildPreview(newElements);
          const validation = validateChatCode(fullCode);
          
          return {
            builder: {
              elements: newElements,
              fullCode,
              preview,
              isValid: validation.isValid,
              errorMessage: validation.errorMessage,
            },
          };
        });
      },
      
      removeElement: (elementId) => {
        set((state) => {
          const newElements = state.builder.elements.filter(el => el.id !== elementId);
          const fullCode = buildChatCode(newElements);
          const preview = buildPreview(newElements);
          const validation = validateChatCode(fullCode);
          
          return {
            builder: {
              elements: newElements,
              fullCode,
              preview,
              isValid: validation.isValid,
              errorMessage: validation.errorMessage,
            },
          };
        });
      },
      
      updateElement: (elementId, updates) => {
        set((state) => {
          const newElements = state.builder.elements.map(el => 
            el.id === elementId ? { ...el, ...updates } : el
          );
          const fullCode = buildChatCode(newElements);
          const preview = buildPreview(newElements);
          const validation = validateChatCode(fullCode);
          
          return {
            builder: {
              elements: newElements,
              fullCode,
              preview,
              isValid: validation.isValid,
              errorMessage: validation.errorMessage,
            },
          };
        });
      },
      
      moveElement: (fromIndex, toIndex) => {
        set((state) => {
          const newElements = [...state.builder.elements];
          const [movedElement] = newElements.splice(fromIndex, 1);
          newElements.splice(toIndex, 0, movedElement);
          
          const fullCode = buildChatCode(newElements);
          const preview = buildPreview(newElements);
          const validation = validateChatCode(fullCode);
          
          return {
            builder: {
              elements: newElements,
              fullCode,
              preview,
              isValid: validation.isValid,
              errorMessage: validation.errorMessage,
            },
          };
        });
      },
      
      clearBuilder: () => {
        set({ builder: DEFAULT_BUILDER });
      },
      
      addTextElement: (text) => {
        if (!text.trim()) return;
        
        const textElement: ChatCodeElement = {
          id: generateId(),
          type: 'text',
          code: text,
          display: text,
          preview: text,
        };
        
        get().addElement(textElement);
      },
      
      // 组合管理
      saveCombo: (name, description = '', tags = []) => {
        const state = get();
        const { builder } = state;
        
        if (builder.elements.length === 0) return;
        
        // 获取当前用户
        const username = useAuthStore.getState().user?.username || 'anonymous';
        
        const combo: ChatCodeCombo = {
          id: generateId(),
          name,
          elements: [...builder.elements],
          fullCode: builder.fullCode,
          preview: builder.preview,
          isFavorite: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: username,
          tags,
          description,
        };
        
        set((prevState) => ({
          favorites: [...prevState.favorites, combo],
        }));
        
        // 添加到历史记录
        get().addToHistory(combo);
      },
      
      loadCombo: (combo) => {
        const fullCode = buildChatCode(combo.elements);
        const preview = buildPreview(combo.elements);
        const validation = validateChatCode(fullCode);
        
        set({
          builder: {
            elements: [...combo.elements],
            fullCode,
            preview,
            isValid: validation.isValid,
            errorMessage: validation.errorMessage,
          },
          currentCombo: combo,
        });
        
        // 添加到历史记录
        get().addToHistory(combo);
      },
      
      deleteCombo: (comboId) => {
        set((state) => ({
          favorites: state.favorites.filter(combo => combo.id !== comboId),
          history: state.history.filter(h => h.combo.id !== comboId),
        }));
      },
      
      // 收藏管理
      toggleFavorite: (comboId) => {
        set((state) => ({
          favorites: state.favorites.map(combo =>
            combo.id === comboId
              ? { ...combo, isFavorite: !combo.isFavorite, updatedAt: new Date() }
              : combo
          ),
        }));
      },
      
      addToFavorites: (combo) => {
        const state = get();
        const exists = state.favorites.some(fav => fav.id === combo.id);
        
        if (!exists) {
          set((prevState) => ({
            favorites: [...prevState.favorites, { ...combo, isFavorite: true }],
          }));
        }
      },
      
      removeFromFavorites: (comboId) => {
        set((state) => ({
          favorites: state.favorites.filter(combo => combo.id !== comboId),
        }));
      },
      
      // 历史记录管理
      addToHistory: (combo) => {
        set((state) => {
          const existingIndex = state.history.findIndex(h => h.combo.id === combo.id);
          
          if (existingIndex >= 0) {
            // 更新现有记录
            const updatedHistory = [...state.history];
            updatedHistory[existingIndex] = {
              ...updatedHistory[existingIndex],
              usedAt: new Date(),
              usageCount: updatedHistory[existingIndex].usageCount + 1,
            };
            return { history: updatedHistory };
          } else {
            // 添加新记录
            const historyEntry: ChatCodeHistory = {
              id: generateId(),
              combo,
              usedAt: new Date(),
              usageCount: 1,
            };
            
            // 保持历史记录数量在合理范围内（最多50条）
            const newHistory = [historyEntry, ...state.history].slice(0, 50);
            return { history: newHistory };
          }
        });
      },
      
      clearHistory: () => {
        set({ history: [] });
      },
      
      // 过滤器
      setFilter: (filter) => {
        set((state) => ({
          filter: { ...state.filter, ...filter },
        }));
      },
      
      resetFilter: () => {
        set({ filter: DEFAULT_FILTER });
      },
      
      // 获取过滤后的收藏列表
      getFilteredFavorites: () => {
        const { favorites, filter } = get();
        
        return favorites.filter(combo => {
          // 类型过滤
          if (filter.type && filter.type !== 'all') {
            const hasType = combo.elements.some(el => el.type === filter.type);
            if (!hasType) return false;
          }
          
          // 搜索过滤
          if (filter.search) {
            const search = filter.search.toLowerCase();
            const matchesName = combo.name.toLowerCase().includes(search);
            const matchesDescription = combo.description?.toLowerCase().includes(search);
            const matchesTags = combo.tags?.some(tag => tag.toLowerCase().includes(search));
            
            if (!matchesName && !matchesDescription && !matchesTags) {
              return false;
            }
          }
          
          // 收藏过滤
          if (filter.favoriteOnly && !combo.isFavorite) {
            return false;
          }
          
          // 标签过滤
          if (filter.tags && filter.tags.length > 0) {
            const hasTag = filter.tags.some(filterTag => 
              combo.tags?.includes(filterTag)
            );
            if (!hasTag) return false;
          }
          
          return true;
        });
      },
      
      // 获取最近使用的组合
      getRecentCombos: (limit = 10) => {
        const { history } = get();
        return history
          .sort((a, b) => b.usedAt.getTime() - a.usedAt.getTime())
          .slice(0, limit)
          .map(h => h.combo);
      },
      
      // 导入/导出
      exportData: () => {
        const { favorites, history } = get();
        const data = {
          favorites,
          history,
          exportDate: new Date().toISOString(),
          version: '1.0.0',
        };
        return JSON.stringify(data, null, 2);
      },
      
      importData: (dataString) => {
        try {
          const data = JSON.parse(dataString);
          
          if (data.favorites && Array.isArray(data.favorites)) {
            set((state) => ({
              favorites: [...state.favorites, ...data.favorites],
            }));
          }
          
          if (data.history && Array.isArray(data.history)) {
            set((state) => ({
              history: [...data.history, ...state.history].slice(0, 100), // 限制历史记录数量
            }));
          }
          
          return true;
        } catch (error) {
          console.error('导入数据失败:', error);
          return false;
        }
      },
    }),
    {
      name: 'overwatch-chat-codes',
      partialize: (state) => ({
        favorites: state.favorites,
        history: state.history,
        filter: state.filter,
      }),
    }
  )
); 