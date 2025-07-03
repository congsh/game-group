import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initLeanCloud, checkLeanCloudConfig } from './services/leancloud';
import { warmupCaches } from './services/dataCache';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// 初始化 LeanCloud
if (checkLeanCloudConfig()) {
  initLeanCloud();
  
  // 预热数据缓存
  console.log('正在预热数据缓存...');
  warmupCaches()
    .then(() => {
      console.log('数据缓存预热完成');
      
      // 预热完整游戏列表（为投票和组队页面准备）
      import('./services/games').then(({ getAllGames }) => {
        getAllGames()
          .then(games => console.log(`完整游戏列表已加载，共 ${games.length} 个游戏`))
          .catch(err => console.log('完整游戏列表加载失败:', err));
      });
    })
    .catch(err => console.error('数据缓存预热失败:', err));
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
