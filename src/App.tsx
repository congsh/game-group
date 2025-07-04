/**
 * 主应用组件
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { initLeanCloud, checkLeanCloudConfig } from './services/leancloud';
import { useAuthStore } from './store/auth';
import { antdTheme } from './config/theme';
import AppLayout from './components/layout/AppLayout';
import { Login } from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import { Games } from './pages/Games/Games';
import DailyVote from './pages/DailyVote/DailyVote';
import WeekendTeams from './pages/WeekendTeams/WeekendTeams';
import Reports from './pages/Reports/Reports';
import { checkAndInitData } from './utils/initData';
import './App.css';

// 使用新的AppLayout包装内容的组件
const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AppLayout>{children}</AppLayout>;
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

  // 启动缓存清理调度器（应用启动时执行一次）
  useEffect(() => {
    const initCacheScheduler = async () => {
      try {
        const { startCacheCleanupScheduler } = await import('./services/dataCache');
        startCacheCleanupScheduler();
      } catch (error) {
        console.error('缓存调度器启动失败:', error);
      }
    };
    
    initCacheScheduler();
  }, []); // 空依赖数组，确保只执行一次

  return (
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <Dashboard />
                  </LayoutWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/games" 
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <Games />
                  </LayoutWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vote" 
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <DailyVote />
                  </LayoutWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teams" 
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <WeekendTeams />
                  </LayoutWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <Reports />
                  </LayoutWrapper>
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