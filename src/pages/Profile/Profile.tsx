/**
 * 个人中心页面
 * 展示用户的基本信息、投票历史、组队历史、收藏游戏、勋章墙等个人数据
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Tabs,
  Avatar,
  Typography,
  List,
  Rate,
  DatePicker,
  Select,
  message,
  Spin,
  Empty,
  Tooltip,
  Badge
} from 'antd';
import {
  UserOutlined,
  TrophyOutlined,
  HeartOutlined,
  TeamOutlined,
  CalendarOutlined,
  DownloadOutlined,
  StarOutlined,
  ClockCircleOutlined,
  FireOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';
import { useProfileData } from '../../hooks/useProfileData';
import { profileService } from '../../services/profile';
import BadgeWall from '../../components/ui/BadgeWall';
// import { ExportButton } from '../../components/common/ExportButton';
import './Profile.css';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// 用户等级计算
const calculateUserLevel = (totalVotes: number, totalTeams: number, totalFavorites: number): { level: number; title: string; progress: number } => {
  const totalActivity = totalVotes + totalTeams * 2 + totalFavorites;
  let level = 1;
  let title = '新手玩家';
  
  if (totalActivity >= 100) {
    level = 5;
    title = '游戏大师';
  } else if (totalActivity >= 50) {
    level = 4;
    title = '资深玩家';
  } else if (totalActivity >= 20) {
    level = 3;
    title = '活跃玩家';
  } else if (totalActivity >= 10) {
    level = 2;
    title = '进阶玩家';
  }
  
  // 计算当前等级进度
  const levelThresholds = [0, 10, 20, 50, 100];
  const currentThreshold = levelThresholds[level - 1];
  const nextThreshold = levelThresholds[level] || 100;
  const progress = level === 5 ? 100 : ((totalActivity - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  
  return { level, title, progress };
};

const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('stats'); // 默认显示个人统计
  const [dateRange, setDateRange] = useState<[any, any] | null>([dayjs().subtract(6, 'day'), dayjs()]);
  const [loading, setLoading] = useState(false);
  const [badgeWallKey, setBadgeWallKey] = useState(0); // 用于强制刷新勋章墙
  
  const {
    userStats,
    voteHistory,
    teamHistory,
    favoriteGames,
    loading: dataLoading,
    refreshData
  } = useProfileData(dateRange);

  // 导出个人数据
  const handleExportData = async () => {
    try {
      setLoading(true);
      const exportData = await profileService.exportUserData(user?.objectId || '');
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${user?.username}_profile_data.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success('个人数据导出成功');
    } catch (error) {
      message.error('导出失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 用户等级信息
  const userLevel = calculateUserLevel(
    userStats?.totalVotes || 0,
    userStats?.totalTeams || 0,
    userStats?.totalFavorites || 0
  );

  // 获取当前标签页的标题
  const getTabTitle = (key: string) => {
    const titles: Record<string, string> = {
      stats: '个人统计',
      votes: '投票历史',
      teams: '组队历史',
      favorites: '收藏游戏',
      badges: '勋章墙'
    };
    return titles[key] || '';
  };

  // 处理标签页切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // 切换到勋章墙时，强制刷新
    if (key === 'badges') {
      setBadgeWallKey(prev => prev + 1);
    }
  };

  // 投票历史表格列配置
  const voteColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN')
    },
    {
      title: '游戏名称',
      dataIndex: 'gameName',
      key: 'gameName',
      render: (name: string) => <Text strong>{name}</Text>
    },
    {
      title: '评分',
      dataIndex: 'tendency',
      key: 'tendency',
      render: (tendency: number) => <Rate disabled value={tendency} />
    },
    {
      title: '投票时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => new Date(time).toLocaleString('zh-CN')
    }
  ];

  // 组队历史表格列配置
  const teamColumns = [
    {
      title: '游戏',
      dataIndex: 'game',
      key: 'game'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'leader' ? 'gold' : 'blue'}>
          {role === 'leader' ? '队长' : '成员'}
        </Tag>
      )
    },
    {
      title: '活动时间',
      dataIndex: 'time',
      key: 'time',
      render: (time: string) => time || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          'active': { color: 'green', text: '进行中' },
          'completed': { color: 'blue', text: '已完成' },
          'cancelled': { color: 'red', text: '已取消' }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    }
  ];

  if (dataLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* 个人信息卡片 */}
      <Card className="profile-header-card">
        <Row gutter={24} align="middle">
          <Col xs={24} sm={6} md={4}>
            <div className="user-avatar-section">
              <Avatar
                size={80}
                icon={<UserOutlined />}
                className="user-avatar"
              />
              <Badge
                count={userLevel.level}
                style={{ backgroundColor: '#52c41a', fontSize: '12px' }}
                className="user-level-badge"
              />
            </div>
          </Col>
          <Col xs={24} sm={18} md={14}>
            <div className="user-info-section">
              <Title level={3} className="username">{user?.username}</Title>
              <Space direction="vertical" size={4}>
                <Text type="secondary">
                  <TrophyOutlined style={{ marginRight: 4 }} />
                  {userLevel.title}
                </Text>
                <Text type="secondary">
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  注册时间: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '未知'}
                </Text>
                <Text style={{ color: '#1890ff' }}>
                  当前查看: {getTabTitle(activeTab)}
                </Text>
              </Space>
              {/* 等级进度条 */}
              <div className="user-level-progress">
                <Text type="secondary">等级进度</Text>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${userLevel.progress}%` }}
                  />
                </div>
                <Text type="secondary">{userLevel.progress.toFixed(1)}%</Text>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={24} md={6}>
            <div className="action-buttons">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExportData}
                  loading={loading}
                  block
                >
                  导出数据
                </Button>
                <Button onClick={refreshData} block>
                  刷新数据
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 统计数据卡片 */}
      <Row gutter={16} className="stats-row">
        <Col span={24} style={{ textAlign: 'right', marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            统计数据会定期自动更新
          </Text>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="投票次数"
              value={userStats?.totalVotes || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="组队次数"
              value={userStats?.totalTeams || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="收藏游戏"
              value={userStats?.totalFavorites || 0}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="活跃天数"
              value={userStats?.activeDays || 0}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 详细信息标签页 */}
      <Card className="details-card">
        <div className="tab-header">
          <Space>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              onChange={setDateRange}
              allowClear
              value={dateRange}
            />
          </Space>
        </div>

        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          {/* 个人统计放在第一个 */}
          <TabPane tab={
            <span>
              <StarOutlined />
              个人统计
            </span>
          } key="stats">
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Card title="投票偏好分析" size="small">
                  <div className="stat-item">
                    <Text type="secondary">最喜欢的游戏类型：</Text>
                    <br />
                    <Text strong>{userStats?.favoriteCategory || '暂无数据'}</Text>
                  </div>
                  <div className="stat-item">
                    <Text type="secondary">平均评分：</Text>
                    <br />
                    <Rate disabled value={userStats?.averageRating || 0} allowHalf />
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card title="组队统计" size="small">
                  <div className="stat-item">
                    <Text type="secondary">担任队长次数：</Text>
                    <br />
                    <Text strong>{userStats?.leaderCount || 0} 次</Text>
                  </div>
                  <div className="stat-item">
                    <Text type="secondary">参与成员次数：</Text>
                    <br />
                    <Text strong>{userStats?.memberCount || 0} 次</Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={24} md={8}>
                <Card title="活跃度分析" size="small">
                  <div className="stat-item">
                    <Text type="secondary">最活跃时间段：</Text>
                    <br />
                    <Text strong>{userStats?.mostActiveTime || '暂无数据'}</Text>
                  </div>
                  <div className="stat-item">
                    <Text type="secondary">连续活跃天数：</Text>
                    <br />
                    <Text strong>{userStats?.consecutiveDays || 0} 天</Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={
            <span>
              <CalendarOutlined />
              投票历史
            </span>
          } key="votes">
            <Table
              columns={voteColumns}
              dataSource={voteHistory}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              locale={{ emptyText: <Empty description="暂无投票记录" /> }}
            />
          </TabPane>

          <TabPane tab={
            <span>
              <TeamOutlined />
              组队历史
            </span>
          } key="teams">
            <Table
              columns={teamColumns}
              dataSource={teamHistory}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              locale={{ emptyText: <Empty description="暂无组队记录" /> }}
            />
          </TabPane>

          <TabPane tab={
            <span>
              <HeartOutlined />
              收藏游戏
            </span>
          } key="favorites">
            <List
              grid={{
                gutter: 16,
                xs: 1,
                sm: 2,
                md: 3,
                lg: 4,
                xl: 4,
                xxl: 6,
              }}
              dataSource={favoriteGames}
              locale={{ emptyText: <Empty description="暂无收藏游戏" /> }}
              renderItem={(game: any) => (
                <List.Item>
                  <Card
                    size="small"
                    hoverable
                    actions={[
                      // <Tooltip title="查看详情">
                      //   <GamepadOutlined key="view" />
                      // </Tooltip>,
                      <Tooltip title="取消收藏">
                        <HeartOutlined key="unfavorite" style={{ color: '#eb2f96' }} />
                      </Tooltip>
                    ]}
                  >
                    <Card.Meta
                      title={game.name}
                      description={
                        <Space direction="vertical" size={4}>
                          <Text type="secondary">{game.category}</Text>
                          <Text type="secondary">
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            收藏于 {new Date(game.favoritedAt).toLocaleDateString('zh-CN')}
                          </Text>
                        </Space>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          </TabPane>

          {/* 新增勋章墙标签页 */}
          <TabPane tab={
            <span>
              <TrophyOutlined />
              勋章墙
            </span>
          } key="badges">
            {user && (
              <BadgeWall
                key={badgeWallKey}
                userId={user.objectId}
                username={user.username}
                isOwner={true}
              />
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Profile; 