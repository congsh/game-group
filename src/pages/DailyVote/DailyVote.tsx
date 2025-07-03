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
  message,
  Rate
} from 'antd';
import {
  TrophyOutlined,
  UserOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useVoteStore, useHasVotedToday, useTodayWantsToPlay, useTodaySelectedGames } from '../../store/votes';
import { useGameStore } from '../../store/games';
import { VoteForm, GamePreference } from '../../types/vote';
import { initDailyVoteTable } from '../../utils/initData';
import PageHeader from '../../components/common/PageHeader';
import './DailyVote.css';

const { Title, Text } = Typography;
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
  const [gamePreferences, setGamePreferences] = useState<GamePreference[]>([]);
  const [voteSortBy, setVoteSortBy] = useState<'voteCount' | 'averageTendency' | 'gameName'>('voteCount');
  
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
      setGamePreferences(todayVote.gamePreferences || []);
      form.setFieldsValue({
        wantsToPlay: todayVote.wantsToPlay,
        selectedGames: todayVote.selectedGames,
        gamePreferences: todayVote.gamePreferences || []
      });
    }
  }, [todayVote, form]);

  /**
   * 处理投票提交
   */
  const handleSubmit = async (values: VoteForm) => {
    try {
      // 确保包含倾向度数据
      const submitData: VoteForm = {
        ...values,
        gamePreferences: gamePreferences
      };
      await submitVote(submitData);
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
      setGamePreferences([]);
      form.setFieldValue('selectedGames', []);
    }
  };

  /**
   * 处理游戏选择变化
   */
  const handleGameSelectionChange = (gameIds: string[]) => {
    setSelectedGames(gameIds);
    
    // 更新倾向度数据，移除未选中的游戏，添加新选中的游戏
    const newPreferences = gamePreferences.filter((pref: GamePreference) => 
      gameIds.includes(pref.gameId)
    );
    
    // 为新选中的游戏添加默认倾向度
    gameIds.forEach(gameId => {
      if (!newPreferences.find((pref: GamePreference) => pref.gameId === gameId)) {
        newPreferences.push({
          gameId: gameId,
          tendency: 3 // 默认倾向度为3分
        });
      }
    });
    
    setGamePreferences(newPreferences);
  };

  /**
   * 处理游戏倾向度变化
   */
  const handleTendencyChange = (gameId: string, tendency: number) => {
    const newPreferences = gamePreferences.map((pref: GamePreference) =>
      pref.gameId === gameId ? { ...pref, tendency } : pref
    );
    setGamePreferences(newPreferences);
  };

  /**
   * 获取游戏的倾向度分数
   */
  const getGameTendency = (gameId: string): number => {
    const preference = gamePreferences.find((pref: GamePreference) => pref.gameId === gameId);
    return preference?.tendency || 3;
  };

  /**
   * 获取今日选中游戏的名称和倾向度
   */
  const getSelectedGameNamesWithTendency = (): Array<{name: string, tendency?: number}> => {
    return todaySelectedGameIds
      .map(gameId => {
        const game = games.find((game: any) => game.objectId === gameId);
        const preference = todayVote?.gamePreferences?.find((pref: GamePreference) => pref.gameId === gameId);
        return game ? {
          name: game.name,
          tendency: preference?.tendency
        } : null;
      })
      .filter(Boolean) as Array<{name: string, tendency?: number}>;
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
   * 处理投票结果排序
   */
  const getSortedTopGames = () => {
    if (!todayStats?.topGames) return [];
    
    const games = [...todayStats.topGames];
    
    switch (voteSortBy) {
      case 'voteCount':
        return games.sort((a, b) => b.voteCount - a.voteCount);
      case 'averageTendency':
        return games.sort((a, b) => {
          const tendencyA = a.averageTendency || 0;
          const tendencyB = b.averageTendency || 0;
          return tendencyB - tendencyA;
        });
      case 'gameName':
        return games.sort((a, b) => a.gameName.localeCompare(b.gameName));
      default:
        return games;
    }
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
        subtitle="每天投票选择你想玩的游戏，并为它们评分（1-5分），让我们一起决定今晚玩什么！"
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
                          {getSelectedGameNamesWithTendency().map(item => (
                            <Tag key={item.name} color="blue">
                              {item.name}
                              {item.tendency && (
                                <span style={{ marginLeft: 4 }}>
                                  <StarOutlined /> {item.tendency}分
                                </span>
                              )}
                            </Tag>
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
                selectedGames: [],
                gamePreferences: []
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
                <>
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

                  {/* 游戏倾向度评分 */}
                  {selectedGames.length > 0 && (
                    <Form.Item
                      label={
                        <Space>
                          <StarOutlined />
                          为选中的游戏评分 (1-5分)
                        </Space>
                      }
                    >
                      <div style={{ background: '#fafafa', padding: '16px', borderRadius: '6px' }}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
                          请为每个游戏评分，1分=不太想玩，5分=非常想玩
                        </Text>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {selectedGames.map(gameId => {
                            const game = games.find(g => g.objectId === gameId);
                            if (!game) return null;
                            
                            return (
                              <div key={gameId} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '8px 0'
                              }}>
                                <Text strong>{game.name}</Text>
                                <Rate
                                  value={getGameTendency(gameId)}
                                  onChange={(value) => handleTendencyChange(gameId, value)}
                                  style={{ fontSize: '16px' }}
                                />
                              </div>
                            );
                          })}
                        </Space>
                      </div>
                    </Form.Item>
                  )}
                </>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Title level={4} style={{ margin: 0 }}>今日热门游戏</Title>
                      <Select
                        size="small"
                        value={voteSortBy}
                        onChange={setVoteSortBy}
                        style={{ width: 120 }}
                      >
                        <Option value="voteCount">👍 票数</Option>
                        <Option value="averageTendency">⭐ 倾向度</Option>
                        <Option value="gameName">🔤 名称</Option>
                      </Select>
                    </div>
                    <List
                      size="small"
                      dataSource={getSortedTopGames().slice(0, 5)}
                      renderItem={(game, index) => (
                        <List.Item>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Space>
                              <Tag 
                                color={index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'default'}
                              >
                                #{index + 1}
                              </Tag>
                              <Text strong>{game.gameName}</Text>
                              <Text type="secondary">{game.voteCount} 票</Text>
                            </Space>
                            {game.averageTendency && (
                              <Space>
                                <StarOutlined style={{ color: '#faad14' }} />
                                <Text type="secondary">{game.averageTendency.toFixed(1)}分</Text>
                              </Space>
                            )}
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