/**
 * 应用主布局组件
 * 包含侧边栏导航、头部和内容区域
 */

import React, { useState, useEffect } from 'react';
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
  EyeInvisibleOutlined,
  EyeOutlined,
  FileOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';
import { useMessageBoardStore } from '../../store/messages';
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
    label: '游戏组队',
    title: '游戏组队'
  },
  {
    key: '/files',
    icon: <FileOutlined />,
    label: '文件分享',
    title: '文件分享论坛'
  },
  {
    key: '/messages',
    icon: <MessageOutlined />,
    label: '留言板',
    title: '留言板'
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
  '/teams': ['首页', '游戏组队'],
  '/files': ['首页', '文件分享'],
  '/messages': ['首页', '留言板'],
  '/reports': ['首页', '数据报表'],
  '/profile': ['首页', '个人中心'],
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [floatButtonVisible, setFloatButtonVisible] = useState(true); // 悬浮按钮是否可见
  const [isMobile, setIsMobile] = useState(false); // 是否为移动端
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // 移动端菜单是否打开
  const { user, logout } = useAuthStore();
  const { unreadCount, updateUnreadCount } = useMessageBoardStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = antdTheme.useToken();

  // 检测屏幕尺寸
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // 移动端路由变化时关闭菜单
  useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [location.pathname, isMobile]);

  // 定期更新未读通知数量
  useEffect(() => {
    if (user) {
      updateUnreadCount();
      // 每30秒更新一次未读通知数量
      const interval = setInterval(() => {
        updateUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user, updateUnreadCount]);

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
      label: '个人中心',
      onClick: () => navigate('/profile'),
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

  // 处理折叠按钮点击
  const handleCollapseClick = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // 处理遮罩层点击
  const handleMaskClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <Layout className="app-layout">
      {/* 移动端遮罩层 */}
      {isMobile && (
        <div 
          className={`mobile-sider-mask ${mobileMenuOpen ? 'visible' : ''}`}
          onClick={handleMaskClick}
        />
      )}

      {/* 侧边栏 */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={!isMobile && collapsed}
        className={`app-sider ${isMobile && mobileMenuOpen ? 'mobile-open' : ''}`}
        theme="light"
        width={240}
        collapsedWidth={isMobile ? 240 : 64}
      >
        {/* Logo 区域 */}
        <div className="app-logo">
          <div className="logo-icon">🎮</div>
          {(!collapsed || isMobile) && (
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
        {(!collapsed || isMobile) && (
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
              icon={
                isMobile 
                  ? (mobileMenuOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />)
                  : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)
              }
              onClick={handleCollapseClick}
              className="collapse-btn"
            />
            
            <div className="page-info">
              <Title level={4} className="page-title">{pageTitle}</Title>
              {!isMobile && (
                <Breadcrumb items={breadcrumbItems} className="page-breadcrumb" />
              )}
            </div>
          </div>

          <div className="header-right">
            <Space size={isMobile ? "small" : "middle"}>
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
                <Badge count={unreadCount} size="small">
                  <Button 
                    type="text" 
                    icon={<BellOutlined />} 
                    className="header-btn"
                    onClick={() => navigate('/messages')}
                  />
                </Badge>
              </Tooltip>

              {/* 控制悬浮按钮显示/隐藏 - 桌面端显示 */}
              {!isMobile && (
                <Tooltip title={floatButtonVisible ? "隐藏悬浮按钮" : "显示悬浮按钮"}>
                  <Button 
                    type="text" 
                    icon={floatButtonVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    onClick={() => setFloatButtonVisible(!floatButtonVisible)}
                    className="header-btn"
                  />
                </Tooltip>
              )}

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
                  {!isMobile && (
                    <div className="user-info">
                      <Text strong>{user?.username}</Text>
                      <Text type="secondary" className="user-role">管理员</Text>
                    </div>
                  )}
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

      {/* 悬浮导航栏控制按钮 - 仅桌面端显示 */}
      {!isMobile && floatButtonVisible && (
        <div className="float-nav-button">
          <Tooltip 
            title={collapsed ? "展开导航栏" : "收起导航栏"} 
            placement="left"
          >
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="float-nav-btn"
            />
          </Tooltip>
        </div>
      )}
    </Layout>
  );
};

export default AppLayout; 