/**
 * 应用主布局组件
 * 包含侧边栏导航、头部和内容区域
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Typography,
  Space,
  Badge,
  Tooltip,
  Breadcrumb,
  theme as antdTheme
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';
import './AppLayout.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

// 导航菜单配置
const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '首页',
    title: '首页'
  },
  {
    key: '/games',
    icon: <VideoCameraOutlined />,
    label: '游戏库',
    title: '游戏库管理'
  },
  {
    key: '/vote',
    icon: <CalendarOutlined />,
    label: '每日投票',
    title: '每日游戏投票'
  },
  {
    key: '/teams',
    icon: <TeamOutlined />,
    label: '周末组队',
    title: '周末游戏组队'
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: '数据报表',
    title: '数据统计报表'
  },
];

// 面包屑路径映射
const breadcrumbMap: Record<string, string[]> = {
  '/': ['首页'],
  '/games': ['首页', '游戏库'],
  '/vote': ['首页', '每日投票'],
  '/teams': ['首页', '周末组队'],
  '/reports': ['首页', '数据报表'],
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = antdTheme.useToken();

  // 获取当前选中的菜单项
  const selectedKeys = [location.pathname];
  
  // 获取当前页面标题
  const currentMenuItem = menuItems.find(item => item.key === location.pathname);
  const pageTitle = currentMenuItem?.title || '游戏组队平台';
  
  // 获取面包屑路径
  const breadcrumbItems = (breadcrumbMap[location.pathname] || ['首页']).map((item, index, array) => ({
    title: item,
    href: index === array.length - 1 ? undefined : (index === 0 ? '/' : location.pathname)
  }));

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout className="app-layout">
      {/* 侧边栏 */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="app-sider"
        theme="light"
        width={240}
        collapsedWidth={64}
      >
        {/* Logo 区域 */}
        <div className="app-logo">
          <div className="logo-icon">🎮</div>
          {!collapsed && (
            <div className="logo-text">
              <Title level={4} className="logo-title">游戏组队</Title>
              <Text type="secondary" className="logo-subtitle">GameGroup</Text>
            </div>
          )}
        </div>

        {/* 导航菜单 */}
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={handleMenuClick}
          className="app-menu"
        />

        {/* 侧边栏底部用户信息 */}
        {!collapsed && (
          <div className="sider-user-info">
            <Space>
              <Avatar 
                size="small" 
                icon={<UserOutlined />}
                style={{ backgroundColor: token.colorPrimary }}
              />
              <div className="user-info-text">
                <Text strong className="username">{user?.username}</Text>
                <Text type="secondary" className="user-status">在线</Text>
              </div>
            </Space>
          </div>
        )}
      </Sider>

      {/* 主内容区域 */}
      <Layout className="app-main">
        {/* 头部 */}
        <Header className="app-header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="collapse-btn"
            />
            
            <div className="page-info">
              <Title level={4} className="page-title">{pageTitle}</Title>
              <Breadcrumb items={breadcrumbItems} className="page-breadcrumb" />
            </div>
          </div>

          <div className="header-right">
            <Space size="middle">
              {/* 搜索按钮 */}
              <Tooltip title="搜索">
                <Button 
                  type="text" 
                  icon={<SearchOutlined />} 
                  className="header-btn"
                />
              </Tooltip>

              {/* 通知按钮 */}
              <Tooltip title="通知">
                <Badge count={0} size="small">
                  <Button 
                    type="text" 
                    icon={<BellOutlined />} 
                    className="header-btn"
                  />
                </Badge>
              </Tooltip>

              {/* 用户头像下拉菜单 */}
              <Dropdown 
                menu={{ items: userMenuItems }} 
                placement="bottomRight"
                arrow
              >
                <Space className="user-dropdown">
                  <Avatar 
                    icon={<UserOutlined />}
                    style={{ backgroundColor: token.colorPrimary }}
                  />
                  <div className="user-info">
                    <Text strong>{user?.username}</Text>
                    <Text type="secondary" className="user-role">管理员</Text>
                  </div>
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>

        {/* 内容区域 */}
        <Content className="app-content">
          <div className="content-wrapper">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout; 