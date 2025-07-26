/**
 * 主应用组件
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { initLeanCloud, checkLeanCloudConfig } from './services/leancloud';
import { useAuthStore } from './store/auth';
import { authStorage } from './utils/auth-storage';
import { useMessage } from './hooks/useMessage';
import { appInitManager } from './utils/app-init';
import { antdTheme } from './config/theme';
import AppLayout from './components/layout/AppLayout';
import { Login } from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import { Games } from './pages/Games/Games';
import DailyVote from './pages/DailyVote/DailyVote';
import WeekendTeams from './pages/WeekendTeams/WeekendTeams';
import Reports from './pages/Reports/Reports';
import Profile from './pages/Profile/Profile';
import FileShare from './pages/FileShare/FileShare';
import MessageBoard from './pages/MessageBoard/MessageBoard';
import BadgeWalls from './pages/BadgeWalls/BadgeWalls';
import OverwatchChatCodes from './pages/OverwatchChatCodes/OverwatchChatCodes';
import { checkAndInitData } from './utils/initData';
import './utils/debug-auth'; // 导入调试工具（开发环境下会自动启用）
import './App.css';

// 使用新的AppLayout包装内容的组件
const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AppLayout>{children}</AppLayout>;
};

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuthStore();
  
  // 如果正在加载中，显示加载状态
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>正在验证登录状态...</div>
      </div>
    );
  }
  
  // 如果没有用户且不在加载中，跳转到登录页
  if (!user) {
    console.log('🔒 用户未登录，跳转到登录页');
    return <Navigate to="/login" replace />;
  }
  
  console.log('✅ 用户已登录，显示受保护内容:', user.username);
  return <>{children}</>;
};

// 应用主体组件（在App context内部）
const AppContent: React.FC = () => {
  const { checkAuth, user, login, isLoading } = useAuthStore();
  const message = useMessage();

  // 认证检查初始化
  useEffect(() => {
    appInitManager.safeInit('authCheck', async () => {
      // 检查 LeanCloud 配置
      if (!checkLeanCloudConfig()) {
        message.error('LeanCloud 配置缺失，请检查配置文件');
        console.error('请检查 src/config/leancloud.config.ts 中的配置参数');
        return;
      }

      // 确保 LeanCloud 已初始化
      if (!appInitManager.isInitialized('leanCloudInit')) {
        initLeanCloud();
        console.log('✅ LeanCloud 补充初始化成功');
      }
      
      // 尝试从本地存储恢复登录状态
      const savedUser = authStorage.getAuth();
      console.log('🔍 检查本地存储的用户信息:', savedUser);
      
      if (savedUser && savedUser.username) {
        console.log('📋 找到保存的用户信息，尝试自动登录:', savedUser.username);
        
        try {
          const loggedInUser = await login(savedUser.username);
          console.log('✅ 自动登录成功:', loggedInUser);
          console.log('🏠 登录状态更新，页面应该会自动跳转');
          message.success('欢迎回来，' + savedUser.username + '！');
          
          // 刷新登录时间戳
          authStorage.refreshTimestamp();
          console.log('🔄 登录时间戳已刷新');
          
        } catch (error) {
          console.error('❌ 自动登录失败:', error);
          // 登录失败，清除本地存储
          authStorage.clearAuth();
          message.info('登录信息已过期，请重新登录');
        }
      } else {
        console.log('📝 没有保存的登录信息，检查当前登录状态');
        // 没有保存的登录信息，检查当前登录状态
        checkAuth();
      }
    }, '认证状态检查');
  }, [checkAuth, login, message]);

  // 当用户登录后，初始化数据表
  useEffect(() => {
    if (user) {
      appInitManager.safeInit('dataInit', async () => {
        console.log('👤 用户已登录，开始初始化数据表:', user.username);
        await checkAndInitData();
      }, '数据表初始化');
    }
  }, [user]);

  // 启动缓存清理调度器
  useEffect(() => {
    appInitManager.safeInit('schedulerStart', async () => {
      const { startCacheCleanupScheduler } = await import('./services/dataCache');
      startCacheCleanupScheduler();
    }, '缓存清理调度器启动');
  }, []);

  // 调试登录状态
  useEffect(() => {
    console.log('🔍 当前登录状态:', {
      user: user ? user.username : null,
      isLoading,
      hasUser: !!user
    });
  }, [user, isLoading]);

  return (
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
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <LayoutWrapper>
                  <Profile />
                </LayoutWrapper>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/files" 
            element={
              <ProtectedRoute>
                <LayoutWrapper>
                  <FileShare />
                </LayoutWrapper>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/messages" 
            element={
              <ProtectedRoute>
                <LayoutWrapper>
                  <MessageBoard />
                </LayoutWrapper>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/badges" 
            element={
              <ProtectedRoute>
                <LayoutWrapper>
                  <BadgeWalls />
                </LayoutWrapper>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat-codes" 
            element={
              <ProtectedRoute>
                <LayoutWrapper>
                  <OverwatchChatCodes />
                </LayoutWrapper>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <AntdApp>
        <AppContent />
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;