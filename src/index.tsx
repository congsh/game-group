import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initLeanCloud, checkLeanCloudConfig } from './services/leancloud';
import { appInitManager } from './utils/app-init';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// 使用初始化管理器进行全局初始化
const initializeGlobal = async () => {
  if (!checkLeanCloudConfig()) {
    console.error('❌ LeanCloud 配置缺失');
    return;
  }

  // LeanCloud 初始化
  await appInitManager.safeInit('leanCloudInit', () => {
    initLeanCloud();
  }, 'LeanCloud初始化');

  // 数据缓存预热
  await appInitManager.safeInit('cacheWarmup', async () => {
    const { warmupCaches } = await import('./services/dataCache');
    await warmupCaches();
    
    // 预热完整游戏列表
    const { getAllGames } = await import('./services/games');
    const games = await getAllGames();
    console.log(`🎮 完整游戏列表已加载，共 ${games.length} 个游戏`);
  }, '数据缓存预热');
};

// 执行全局初始化
initializeGlobal().catch(error => {
  console.error('❌ 全局初始化失败:', error);
});

// 注意：暂时移除React.StrictMode以避免开发环境下的重复操作
// 在生产环境中可以重新启用
root.render(
  <App />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
