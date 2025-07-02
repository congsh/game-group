/**
 * 每日投票页面
 * 用户可以在此页面进行每日游戏投票和查看投票统计
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Button,
  Switch,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  List,
  Tag,
  Alert,
  Spin,
  message
} from 'antd';
import {
  TrophyOutlined,
  UserOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useVoteStore, useHasVotedToday, useTodayWantsToPlay, useTodaySelectedGames } from '../../store/votes';
import { useGameStore } from '../../store/games';
import { VoteForm } from '../../types/vote';
import { initDailyVoteTable } from '../../utils/initData';
import PageHeader from '../../components/common/PageHeader';
import './DailyVote.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * 每日投票页面组件
 */
const DailyVote: React.FC = () => {
  const [form] = Form.useForm<VoteForm>();
  
  // 投票状态
  const {
    todayVote,
    todayStats,
    loading,
    submitting,
    statsLoading,
    error,
    loadTodayVote,
    submitVote,
    loadTodayStats,
    clearError
  } = useVoteStore();
  
  // 游戏状态
  const { games, loading: gamesLoading, fetchGames } = useGameStore();
  
  // 本地状态
  const [wantsToPlay, setWantsToPlay] = useState(false);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  
  // 从状态管理获取的衍生状态
  const hasVoted = useHasVotedToday();
  const todayWantsToPlay = useTodayWantsToPlay();
  const todaySelectedGameIds = useTodaySelectedGames();

  /**
   * 初始化页面数据
   */
  useEffect(() => {
    loadTodayVote();
    loadTodayStats();
    fetchGames();
  }, [loadTodayVote, loadTodayStats, fetchGames]);

  /**
   * 同步投票状态到表单
   */
  useEffect(() => {
    if (todayVote) {
      setWantsToPlay(todayVote.wantsToPlay);
      setSelectedGames(todayVote.selectedGames);
      form.setFieldsValue({
        wantsToPlay: todayVote.wantsToPlay,
        selectedGames: todayVote.selectedGames
      });
    }
  }, [todayVote, form]);

  /**
   * 处理投票提交
   */
  const handleSubmit = async (values: VoteForm) => {
    try {
      await submitVote(values);
      message.success(hasVoted ? '投票已更新！' : '投票已提交！');
    } catch (error) {
      message.error('投票失败，请重试');
    }
  };

  /**
   * 处理想要玩游戏状态变化
   */
  const handleWantsToPlayChange = (checked: boolean) => {
    setWantsToPlay(checked);
    if (!checked) {
      setSelectedGames([]);
      form.setFieldValue('selectedGames', []);
    }
  };

  /**
   * 处理游戏选择变化
   */
  const handleGameSelectionChange = (gameIds: string[]) => {
    setSelectedGames(gameIds);
  };

  /**
   * 获取今日选中游戏的名称
   */
  const getSelectedGameNames = (): string[] => {
    return todaySelectedGameIds
      .map(gameId => games.find(game => game.objectId === gameId)?.name)
      .filter(Boolean) as string[];
  };

  /**
   * 格式化时间
   */
  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  /**
   * 手动修复数据表
   */
  const handleManualFix = async () => {
    try {
      message.loading('正在修复数据表...', 0);
      await initDailyVoteTable();
      message.destroy();
      message.success('数据表修复成功！');
      // 重新加载数据
      loadTodayVote();
      loadTodayStats();
    } catch (error) {
      message.destroy();
      message.error('数据表修复失败，请重试');
      console.error('修复失败:', error);
    }
  };

  if (loading || gamesLoading) {
    return (
      <div className="daily-vote-loading">
        <Spin size="large" />
        <div>加载中...</div>
      </div>
    );
  }

  return (
    <div className="daily-vote-container">
      <PageHeader
        title="每日投票"
        subtitle="每天投票选择你想玩的游戏，让我们一起决定今晚玩什么！"
        icon={<PlayCircleOutlined />}
      />

      {error && (
        <Alert
          message="错误"
          description={
            <div>
              <div>{error}</div>
              {error.includes('doesn\'t exists') && (
                <div style={{ marginTop: 8 }}>
                  <Button 
                    size="small" 
                    type="primary" 
                    onClick={handleManualFix}
                  >
                    点击修复数据表
                  </Button>
                </div>
              )}
            </div>
          }
          type="error"
          showIcon
          closable
          onClose={clearError}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[24, 24]}>
        {/* 投票表单 */}
        <Col xs={24} lg={14}>
          <Card 
            title={
              <Space>
                {hasVoted ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <ClockCircleOutlined />}
                {hasVoted ? '今日已投票' : '今日投票'}
              </Space>
            }
            extra={
              hasVoted && (
                <Text type="secondary">
                  {formatTime(todayVote!.updatedAt)}
                </Text>
              )
            }
          >
            {hasVoted && (
              <Alert
                message="今日投票状态"
                description={
                  <div>
                    <div>想要玩游戏：{todayWantsToPlay ? '是' : '否'}</div>
                    {todayWantsToPlay && todaySelectedGameIds.length > 0 && (
                      <div>
                        选择的游戏：
                        <div style={{ marginTop: 8 }}>
                          {getSelectedGameNames().map(gameName => (
                            <Tag key={gameName} color="blue">{gameName}</Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                wantsToPlay: false,
                selectedGames: []
              }}
            >
              <Form.Item
                name="wantsToPlay"
                label="今天想要玩游戏吗？"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="想玩"
                  unCheckedChildren="不想"
                  onChange={handleWantsToPlayChange}
                />
              </Form.Item>

              {wantsToPlay && (
                <Form.Item
                  name="selectedGames"
                  label="选择想玩的游戏（可多选）"
                  rules={[
                    { required: wantsToPlay, message: '请至少选择一个游戏' }
                  ]}
                >
                  <Select
                    mode="multiple"
                    placeholder="请选择游戏"
                    showSearch
                    onChange={handleGameSelectionChange}
                  >
                    {games.map(game => (
                      <Option key={game.objectId} value={game.objectId}>
                        {game.name} ({game.minPlayers}-{game.maxPlayers}人)
                        {game.platform && <Text type="secondary"> - {game.platform}</Text>}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                  block
                >
                  {hasVoted ? '更新投票' : '提交投票'}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 投票统计 */}
        <Col xs={24} lg={10}>
          <Card 
            title={
              <Space>
                <TrophyOutlined />
                今日投票统计
              </Space>
            }
            loading={statsLoading}
          >
            {todayStats ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {/* 总体统计 */}
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="总投票数"
                      value={todayStats.totalVotes}
                      prefix={<UserOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="想玩的人数"
                      value={todayStats.wantToPlayCount}
                      suffix={`/ ${todayStats.totalVotes}`}
                      prefix={<PlayCircleOutlined />}
                    />
                  </Col>
                </Row>

                {/* 热门游戏排行 */}
                {todayStats.topGames.length > 0 && (
                  <div>
                    <Title level={4}>今日热门游戏</Title>
                    <List
                      size="small"
                      dataSource={todayStats.topGames.slice(0, 5)}
                      renderItem={(game, index) => (
                        <List.Item>
                          <Space>
                            <Tag 
                              color={index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'default'}
                            >
                              #{index + 1}
                            </Tag>
                            <Text strong>{game.gameName}</Text>
                            <Text type="secondary">{game.voteCount} 票</Text>
                          </Space>
                        </List.Item>
                      )}
                    />
                  </div>
                )}

                {todayStats.totalVotes === 0 && (
                  <Alert
                    message="还没有人投票"
                    description="成为第一个投票的人吧！"
                    type="info"
                    showIcon
                  />
                )}
              </Space>
            ) : (
              <Alert
                message="暂无统计数据"
                type="info"
                showIcon
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DailyVote; 