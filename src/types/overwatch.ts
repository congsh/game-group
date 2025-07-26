/**
 * 守望先锋聊天代码相关类型定义
 */

// 聊天代码元素类型
export interface ChatCodeElement {
  id: string;
  type: 'color' | 'emoji' | 'text' | 'format';
  code: string;
  display: string;
  description?: string;
  preview?: string;
}

// 聊天代码组合
export interface ChatCodeCombo {
  id: string;
  name: string;
  elements: ChatCodeElement[];
  fullCode: string;
  preview: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags?: string[];
  description?: string;
}

// 颜色代码预定义
export interface ColorCode {
  id: string;
  name: string;
  code: string;
  hex: string;
  preview: string;
  category: 'basic' | 'team' | 'special' | 'custom';
}

// 表情符号代码
export interface EmojiCode {
  id: string;
  name: string;
  code: string;
  unicode: string;
  preview: string;
  category: 'face' | 'hand' | 'symbol' | 'misc' | 'hero';
}

// 格式化代码
export interface FormatCode {
  id: string;
  name: string;
  code: string;
  description: string;
  example: string;
  type: 'style' | 'spacing' | 'special';
}

// 聊天代码构建器状态
export interface ChatCodeBuilder {
  elements: ChatCodeElement[];
  preview: string;
  fullCode: string;
  isValid: boolean;
  errorMessage?: string;
}

// 搜索过滤器
export interface ChatCodeFilter {
  type?: 'color' | 'emoji' | 'format' | 'all';
  category?: string;
  search?: string;
  favoriteOnly?: boolean;
  tags?: string[];
}

// 收藏夹管理
export interface FavoriteManager {
  favorites: ChatCodeCombo[];
  addFavorite: (combo: ChatCodeCombo) => void;
  removeFavorite: (comboId: string) => void;
  isFavorite: (comboId: string) => boolean;
  getFavorites: () => ChatCodeCombo[];
}

// 历史记录
export interface ChatCodeHistory {
  id: string;
  combo: ChatCodeCombo;
  usedAt: Date;
  usageCount: number;
}

 