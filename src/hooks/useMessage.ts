/**
 * useMessage Hook
 * 用于获取Ant Design的动态message API，避免静态调用警告
 */

import { App } from 'antd';

export const useMessage = () => {
  const { message } = App.useApp();
  return message;
}; 