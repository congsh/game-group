/**
 * LeanCloud 配置和初始化
 */

import AV from 'leancloud-storage';
import { LEANCLOUD_CONFIG } from '../config/leancloud.config';

/**
 * 初始化 LeanCloud
 */
export const initLeanCloud = () => {
  try {
    AV.init({
      appId: LEANCLOUD_CONFIG.appId,
      appKey: LEANCLOUD_CONFIG.appKey,
      serverURL: LEANCLOUD_CONFIG.serverURL
    });
    
    console.log('LeanCloud 初始化成功', {
      appId: LEANCLOUD_CONFIG.appId.substring(0, 8) + '...',
      serverURL: LEANCLOUD_CONFIG.serverURL
    });
  } catch (error) {
    console.error('LeanCloud 初始化失败:', error);
    throw error;
  }
};

/**
 * 检查 LeanCloud 是否已正确配置
 */
export const checkLeanCloudConfig = (): boolean => {
  const isConfigured = !!(LEANCLOUD_CONFIG.appId && LEANCLOUD_CONFIG.appKey && LEANCLOUD_CONFIG.serverURL);
  
  if (!isConfigured) {
    console.warn('LeanCloud 配置不完整');
  }
  
  return isConfigured;
};

export default AV; 