/**
 * 守望先锋图标服务
 * 从官方API获取和处理图标数据
 */

import type { TextureInfo, VersionInfo, TextureApiResponse, IconFilterOptions } from '../types/overwatch';

// API端点
const TEXTURE_API_URL = 'https://assets.overwatchitemtracker.com/data/texture_info.json';
const TEXTURE_BASE_URL = 'https://assets.overwatchitemtracker.com/textures';

// 缓存配置
const CACHE_KEY = 'overwatch_texture_cache';
const CACHE_VERSION = '1.2'; // 缓存版本，修改此版本号会清除旧缓存
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

interface CachedData {
  textures: TextureInfo[];
  versions: VersionInfo[];
  timestamp: number;
  version: string; // 缓存版本
}

/**
 * 获取纹理ID（16进制格式化）
 * 根据官方API格式，纹理ID需要12位16进制格式（用于图片URL）
 */
export const getTextureId = (textureId: number): string => {
  // 转换为16进制并转大写，填充到12位
  return textureId.toString(16).toUpperCase().padStart(12, '0');
};

/**
 * 生成图片URL
 */
export const getImageUrl = (textureId: string): string => {
  return `${TEXTURE_BASE_URL}/${textureId}.png`;
};

/**
 * 生成聊天代码
 * 聊天代码格式需要14位ID（基于用户提供的实际游戏代码格式）
 */
export const generateChatCode = (textureId: string): string => {
  // 聊天代码需要14位格式，如：<TXC000000000402CE>
  let chatCodeId = textureId;
  if (textureId.length < 14) {
    chatCodeId = textureId.padStart(14, '0'); // 补零到14位
  } else if (textureId.length > 14) {
    chatCodeId = textureId.substring(textureId.length - 14); // 取后14位
  }
  
  return `<TXC${chatCodeId}>`;
};

/**
 * 从缓存获取数据
 */
const getCachedData = (): CachedData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data: CachedData = JSON.parse(cached);
    
    // 检查缓存是否过期或版本不匹配
    if (Date.now() - data.timestamp > CACHE_EXPIRY || data.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('读取缓存失败:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

/**
 * 保存数据到缓存
 */
const setCachedData = (data: Omit<CachedData, 'timestamp'>): void => {
  try {
    const cacheData: CachedData = {
      ...data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('保存缓存失败:', error);
  }
};

/**
 * 获取所有纹理图标数据
 */
export const fetchTextureData = async (): Promise<{ textures: TextureInfo[], versions: VersionInfo[] }> => {
  // 首先尝试从缓存获取
  const cached = getCachedData();
  if (cached) {
    console.log('从缓存加载纹理数据');
    return { textures: cached.textures, versions: cached.versions };
  }

  console.log('从API获取纹理数据...');
  
  try {
    const response = await fetch(TEXTURE_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const textureInfo: TextureApiResponse = await response.json();
    
    // 处理纹理数据
    const textures: TextureInfo[] = textureInfo.textures.map((texId, i) => {
      const textureId = getTextureId(texId);
      const versionAddedId = textureInfo.tex_ver_added[i];
      const versionRemovedId = textureInfo.tex_ver_removed[i];
      const versionUpdatedId = textureInfo.tex_ver_updated[i];

      return {
        id: textureId,
        id_raw: texId,
        version_added_id: versionAddedId,
        version_removed_id: versionRemovedId,
        version_updated_id: versionUpdatedId,
        version_added: textureInfo.versions[versionAddedId - 1],
        version_removed: versionRemovedId !== 0 ? textureInfo.versions[versionRemovedId - 1] : undefined,
        version_updated: versionUpdatedId !== 0 ? textureInfo.versions[versionUpdatedId - 1] : undefined,
        is_removed: versionRemovedId !== 0,
        is_new: versionAddedId === textureInfo.versions.length,
        is_updated: versionUpdatedId === textureInfo.versions.length,
        url: getImageUrl(textureId)
      };
    });

    // 处理版本数据
    const versions: VersionInfo[] = [
      { id: 0, name: 'All' },
      ...textureInfo.versions.map((name, i) => ({ id: i + 1, name }))
    ];

    console.log(`加载了 ${textures.length} 个纹理图标，${versions.length} 个版本`);
    console.log('示例图标URL:', textures.slice(0, 5).map(t => ({ 
      id: t.id, 
      id_raw: t.id_raw,
      id_hex: t.id_raw.toString(16).toUpperCase(),
      url: t.url 
    })));
    
    // 验证特定的图标ID转换是否正确
    const testId = 384685; // 5DAD in hex
    const convertedId = getTextureId(testId);
    console.log(`测试转换: ${testId} (十进制) → ${testId.toString(16).toUpperCase()} (16进制) → ${convertedId} (12位格式)`);
    console.log(`测试URL: https://assets.overwatchitemtracker.com/textures/${convertedId}.png`);
    
    // 保存到缓存
    setCachedData({ textures, versions, version: CACHE_VERSION });
    
    return { textures, versions };
  } catch (error) {
    console.error('获取纹理数据失败:', error);
    throw new Error('无法获取图标数据，请检查网络连接');
  }
};

/**
 * 筛选纹理数据
 */
export const filterTextures = (
  textures: TextureInfo[], 
  options: IconFilterOptions
): TextureInfo[] => {
  let filtered = [...textures];
  
  // 版本筛选
  if (options.version && options.version > 0) {
    filtered = filtered.filter(texture => 
      texture.version_added_id === options.version ||
      texture.version_updated_id === options.version
    );
  }
  
  // 是否显示已移除的图标
  if (!options.showRemoved) {
    filtered = filtered.filter(texture => !texture.is_removed);
  }
  
  // 只显示新图标
  if (options.showNewOnly) {
    filtered = filtered.filter(texture => texture.is_new);
  }
  
  // 只显示更新的图标
  if (options.showUpdatedOnly) {
    filtered = filtered.filter(texture => texture.is_updated);
  }
  
  // 搜索筛选（这里可以扩展为更复杂的搜索逻辑）
  if (options.search) {
    const searchTerm = options.search.toLowerCase();
    filtered = filtered.filter(texture => 
      texture.id.toLowerCase().includes(searchTerm) ||
      texture.version_added.toLowerCase().includes(searchTerm) ||
      (texture.version_updated && texture.version_updated.toLowerCase().includes(searchTerm))
    );
  }
  
  return filtered;
};

/**
 * 检查图片是否存在（预加载）
 */
export const preloadImage = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

/**
 * 批量预加载图片
 */
export const preloadImages = async (urls: string[], maxConcurrent = 10): Promise<void> => {
  const chunks = [];
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    chunks.push(urls.slice(i, i + maxConcurrent));
  }
  
  for (const chunk of chunks) {
    await Promise.all(chunk.map(url => preloadImage(url)));
  }
};

/**
 * 清除缓存
 */
export const clearTextureCache = (): void => {
  localStorage.removeItem(CACHE_KEY);
  console.log('纹理缓存已清除');
};

/**
 * 获取缓存信息
 */
export const getCacheInfo = (): { size: number, lastUpdated: Date | null } => {
  const cached = getCachedData();
  if (!cached) {
    return { size: 0, lastUpdated: null };
  }
  
  return {
    size: cached.textures.length,
    lastUpdated: new Date(cached.timestamp)
  };
}; 