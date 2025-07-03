/**
 * Dashboard 首页组件
 * 现代化的数据概览和快速操作界面
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Space,
  Typography,
  Avatar,
  List,
  Tag,
  Empty,
  Spin,
  Badge,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  TeamOutlined,
  BarChartOutlined,
  HeartOutlined,
  LikeOutlined,
  UserOutlined,
  TrophyOutlined,
  FireOutlined,
  ClockCircleOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';
import { getGames } from '../../services/games';
import { getTodayVoteStats, getTodayVote } from '../../services/votes';
import { getWeekendTeams } from '../../services/teams';
import AV from '../../services/leancloud';
import { Game } from '../../types/game';
import { VoteStats } from '../../types/vote';
import { TeamDetails } from '../../types/team';
import './Dashboard.css';

const { Title, Text, Paragraph } = Typography;

// Dashboard数据接口
interface DashboardData {
  stats: {
    totalGames: number;
    todayVotes: number;
    activeTeams: number;
  };
  recentGames: Game[];
  todayVoteStatus: {
    hasVoted: boolean;
    selectedGames: string[];
    totalVotes: number;
  };
  weekendTeams: TeamDetails[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  // 获取Dashboard数据
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 并行获取所有数据
        const [
          gamesResult,
          voteStats,
          teamsResult,
          userVote
        ] = await Promise.all([
          getGames({ sortBy: 'hotScore', sortOrder: 'desc' }, 1, 4).catch(() => ({ games: [], total: 0 })),
          getTodayVoteStats().catch(() => ({ 
            date: new Date().toISOString().split('T')[0],
            totalVotes: 0,
            wantToPlayCount: 0,
            gameVoteCounts: {},
            topGames: [],
            gameTendencies: {}
          })),
          getWeekendTeams({ status: 'open', sortBy: 'createdAt', sortOrder: 'desc' }, 1, 3).catch(() => ({ teams: [], total: 0 })),
          user ? getTodayVote(user.objectId).catch(() => null) : Promise.resolve(null)
        ]);

        const dashboardData: DashboardData = {
          stats: {
            totalGames: gamesResult.total,
            todayVotes: voteStats.totalVotes,
            activeTeams: teamsResult.total
          },
          recentGames: gamesResult.games,
          todayVoteStatus: {
            hasVoted: !!userVote,
            selectedGames: userVote?.selectedGames || [],
            totalVotes: voteStats.totalVotes
          },
          weekendTeams: teamsResult.teams
        };
        
        setData(dashboardData);
      } catch (error) {
        console.error('获取Dashboard数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);



  // 快速操作配置
  const quickActions = [
    {
      title: '添加游戏',
      description: '向游戏库添加新游戏',
      icon: <PlusOutlined />,
      color: '#1890ff',
      path: '/games',
      action: () => navigate('/games')
    },
    {
      title: '参与投票',
      description: '为今日想玩的游戏投票',
      icon: <CalendarOutlined />,
      color: '#52c41a',
      path: '/vote',
      action: () => navigate('/vote')
    },
    {
      title: '创建组队',
      description: '发起周末游戏组队',
      icon: <TeamOutlined />,
      color: '#fa8c16',
      path: '/teams',
      action: () => navigate('/teams')
    },
    {
      title: '查看报表',
      description: '查看详细数据统计',
      icon: <BarChartOutlined />,
      color: '#722ed1',
      path: '/reports',
      action: () => navigate('/reports')
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
        <Text style={{ marginTop: 16, display: 'block' }}>加载中...</Text>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-error">
        <Empty description="数据加载失败" />
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* 欢迎区域 */}
      <div className="dashboard-welcome">
        <div className="welcome-content">
          <div className="welcome-info">
            <Title level={2} className="welcome-title">
              欢迎回来，{user?.username}！
            </Title>
            <Paragraph className="welcome-subtitle">
              今天是美好的一天，来看看有什么好玩的游戏吧 🎮
            </Paragraph>
          </div>
          <div className="welcome-avatar">
            <Avatar size={80} icon={<UserOutlined />} />
          </div>
        </div>
      </div>

      {/* 统计卡片区域 */}
      <Row gutter={[24, 24]} className="dashboard-stats">
        <Col xs={24} sm={8}>
          <Card className="stat-card stat-card-1">
            <Statistic
              title="游戏总数"
              value={data.stats.totalGames}
              prefix={<VideoCameraOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card className="stat-card stat-card-2">
            <Statistic
              title="今日投票"
              value={data.stats.todayVotes}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card className="stat-card stat-card-3">
            <Statistic
              title="活跃组队"
              value={data.stats.activeTeams}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主内容区域 */}
      <Row gutter={[24, 24]} className="dashboard-content">
        {/* 左侧内容 */}
        <Col xs={24} lg={16}>
          {/* 快速操作 */}
          <Card 
            title={
              <Space>
                <FireOutlined style={{ color: '#fa8c16' }} />
                快速操作
              </Space>
            }
            className="quick-actions-card"
          >
            <Row gutter={[16, 16]}>
              {quickActions.map((action, index) => (
                <Col xs={12} sm={6} key={index}>
                  <div className="quick-action-item" onClick={action.action}>
                    <div className="action-icon" style={{ backgroundColor: action.color }}>
                      {action.icon}
                    </div>
                    <div className="action-content">
                      <Text strong className="action-title">{action.title}</Text>
                      <Text type="secondary" className="action-desc">{action.description}</Text>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          {/* 热门游戏 */}
          <Card 
            title={
              <Space>
                <TrophyOutlined style={{ color: '#faad14' }} />
                热门游戏
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/games')}>
                查看全部 <RightOutlined />
              </Button>
            }
            className="popular-games-card"
          >
            {data.recentGames.length > 0 ? (
              <List
                dataSource={data.recentGames}
                renderItem={(game) => (
                  <List.Item className="game-item">
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          shape="square" 
                          size={48}
                          style={{ backgroundColor: '#1890ff' }}
                          icon={<VideoCameraOutlined />}
                        />
                      }
                      title={
                        <Space>
                          <Text strong>{game.name}</Text>
                          <Tag color="blue">{game.type}</Tag>
                        </Space>
                      }
                      description={
                        <Space>
                          <Text type="secondary">{game.platform}</Text>
                          <Space>
                            <LikeOutlined />
                            <Text>{game.likeCount}</Text>
                          </Space>
                          {game.favoriteCount !== undefined && (
                            <Space>
                              <HeartOutlined />
                              <Text>{game.favoriteCount}</Text>
                            </Space>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无游戏数据" />
            )}
          </Card>
        </Col>

        {/* 右侧内容 */}
        <Col xs={24} lg={8}>
          {/* 投票状态 */}
          <Card 
            title={
              <Space>
                <CalendarOutlined style={{ color: '#52c41a' }} />
                今日投票
              </Space>
            }
            className="vote-status-card"
          >
            {data.todayVoteStatus.hasVoted ? (
              <div className="vote-completed">
                <div className="vote-status-icon">
                  <HeartOutlined style={{ color: '#52c41a', fontSize: 32 }} />
                </div>
                <Text>今日已投票</Text>
                <Text type="secondary">已选择 {data.todayVoteStatus.selectedGames.length} 个游戏</Text>
              </div>
            ) : (
              <div className="vote-pending">
                <div className="vote-status-icon">
                  <CalendarOutlined style={{ color: '#faad14', fontSize: 32 }} />
                </div>
                <Text>今日还未投票</Text>
                <Button 
                  type="primary" 
                  onClick={() => navigate('/vote')}
                  style={{ marginTop: 12, width: '100%' }}
                >
                  立即投票
                </Button>
              </div>
            )}
            <div className="vote-stats">
              <Text type="secondary">今日总投票：{data.todayVoteStatus.totalVotes} 人</Text>
            </div>
          </Card>

          {/* 周末组队 */}
          <Card 
            title={
              <Space>
                <TeamOutlined style={{ color: '#fa8c16' }} />
                周末组队
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/teams')}>
                查看全部 <RightOutlined />
              </Button>
            }
            className="teams-card"
          >
            {data.weekendTeams.length > 0 ? (
              <List
                dataSource={data.weekendTeams}
                renderItem={(team) => (
                  <List.Item className="team-item">
                    <div className="team-info">
                      <div className="team-header">
                        <Text strong>{team.gameName}</Text>
                        <Tag color={team.status === 'open' ? 'green' : team.status === 'full' ? 'orange' : 'default'}>
                          {team.status === 'open' ? '招募中' : team.status === 'full' ? '已满员' : '已关闭'}
                        </Tag>
                      </div>
                      <div className="team-details">
                        <Space>
                          <Tooltip title="开始时间">
                            <Space size={4}>
                              <ClockCircleOutlined />
                              <Text type="secondary">{team.startTime}</Text>
                            </Space>
                          </Tooltip>
                          <Text type="secondary">
                            {team.members.length}/{team.maxMembers}人
                          </Text>
                        </Space>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无组队信息" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 