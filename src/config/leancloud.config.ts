/**
 * LeanCloud 配置文件
 * 注意：在生产环境中，这些配置应该通过环境变量设置
 */

export const LEANCLOUD_CONFIG = {
  // 你的LeanCloud应用配置
  appId: process.env.REACT_APP_LEANCLOUD_APP_ID || '',
  appKey: process.env.REACT_APP_LEANCLOUD_APP_KEY || '', 
  serverURL: process.env.REACT_APP_LEANCLOUD_SERVER_URL || '',
  // Master Key用于服务端操作（注意：不要在前端暴露Master Key）
  // masterKey: process.env.REACT_APP_LEANCLOUD_MASTER_KEY || ''
};

/**
 * 应用配置
 */
export const APP_CONFIG = {
  name: '游戏分组助手',
  version: '1.0.0'
}; 