/**
 * 主应用组件
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { initLeanCloud, checkLeanCloudConfig } from './services/leancloud';
import { useAuthStore } from './store/auth';
import { Login } from './pages/Login/Login';
import { Games } from './pages/Games/Games';
import DailyVote from './pages/DailyVote/DailyVote';
import WeekendTeams from './pages/WeekendTeams/WeekendTeams';
import { checkAndInitData } from './utils/initData';
import './App.css';

// 临时主页组件
const Home: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>欢迎来到游戏组队平台</h1>
      {user && (
        <div>
          <p>欢迎，{user.username}！</p>
          <div style={{ margin: '20px 0' }}>
            <button 
              style={{ margin: '0 10px', padding: '10px 20px' }}
              onClick={() => navigate('/games')}
            >
              进入游戏库
            </button>
            <button 
              style={{ margin: '0 10px', padding: '10px 20px' }}
              onClick={() => navigate('/vote')}
            >
              每日投票
            </button>
            <button 
              style={{ margin: '0 10px', padding: '10px 20px' }}
              onClick={() => navigate('/teams')}
            >
              周末组队
            </button>
            <button 
              style={{ margin: '0 10px', padding: '10px 20px' }}
              onClick={logout}
            >
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { checkAuth, user } = useAuthStore();

  useEffect(() => {
    // 检查 LeanCloud 配置
    if (!checkLeanCloudConfig()) {
      message.error('LeanCloud 配置缺失，请检查配置文件');
      console.error('请检查 src/config/leancloud.config.ts 中的配置参数');
      return;
    }

    // 初始化 LeanCloud
    try {
      initLeanCloud();
      // 检查登录状态
      checkAuth();
    } catch (error) {
      console.error('LeanCloud 初始化失败:', error);
      message.error('应用初始化失败');
    }
  }, [checkAuth]);

  // 当用户登录后，静默初始化数据表
  useEffect(() => {
    if (user) {
      checkAndInitData().catch(() => {
        // 静默处理错误，不显示给用户
      });
    }
  }, [user]);

  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/games" 
              element={
                <ProtectedRoute>
                  <Games />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vote" 
              element={
                <ProtectedRoute>
                  <DailyVote />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teams" 
              element={
                <ProtectedRoute>
                  <WeekendTeams />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App; 