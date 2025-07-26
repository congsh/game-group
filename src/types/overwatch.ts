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

// 个人代码注释和收藏
export interface PersonalCodeNote {
  id: string;
  codeId: string;              // 关联的代码元素ID
  codeType: 'color' | 'emoji' | 'format' | 'custom';
  customCode?: string;         // 自定义代码（如果是custom类型）
  note: string;                // 个人注释
  tags: string[];              // 标签
  isFavorite: boolean;         // 是否收藏
  createdAt: Date;
  updatedAt: Date;
}

// 个人自定义代码
export interface CustomCode {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: 'color' | 'emoji' | 'format' | 'combo';
  preview: string;
  note?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 代码预览和图标显示
export interface CodePreview {
  code: string;
  preview: string;
  imageUrl?: string;           // 图标URL（如果有的话）
  isIconCode: boolean;         // 是否是图标代码
}

/**
 * 守望先锋纹理图标信息
 */
export interface TextureInfo {
  /** 纹理ID */
  id: string;
  /** 原始纹理ID */
  id_raw: number;
  /** 添加版本ID */
  version_added_id: number;
  /** 移除版本ID */
  version_removed_id: number;
  /** 更新版本ID */
  version_updated_id: number;
  /** 添加版本名称 */
  version_added: string;
  /** 移除版本名称 */
  version_removed?: string;
  /** 更新版本名称 */
  version_updated?: string;
  /** 是否已移除 */
  is_removed: boolean;
  /** 是否为新增 */
  is_new: boolean;
  /** 是否已更新 */
  is_updated: boolean;
  /** 图片URL */
  url: string;
}

/**
 * 版本信息
 */
export interface VersionInfo {
  /** 版本ID */
  id: number;
  /** 版本名称 */
  name: string;
}

/**
 * 纹理数据响应
 */
export interface TextureApiResponse {
  /** 纹理ID数组 */
  textures: number[];
  /** 版本名称数组 */
  versions: string[];
  /** 纹理添加版本ID数组 */
  tex_ver_added: number[];
  /** 纹理移除版本ID数组 */
  tex_ver_removed: number[];
  /** 纹理更新版本ID数组 */
  tex_ver_updated: number[];
}

/**
 * 图标搜索筛选选项
 */
export interface IconFilterOptions {
  /** 搜索关键词 */
  search?: string;
  /** 版本筛选 */
  version?: number;
  /** 是否显示已移除的图标 */
  showRemoved?: boolean;
  /** 是否只显示新图标 */
  showNewOnly?: boolean;
  /** 是否只显示更新的图标 */
  showUpdatedOnly?: boolean;
}

 