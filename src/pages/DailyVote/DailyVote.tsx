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
  Rate,
  Input,
  App
} from 'antd';
import {
  TrophyOutlined,
  UserOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useVoteStore, useHasVotedToday, useTodayWantsToPlay, useTodaySelectedGames } from '../../store/votes';
import { useGameStore } from '../../store/games';
import { VoteForm, GamePreference } from '../../types/vote';
import { initDailyVoteTable } from '../../utils/initData';
import PageHeader from '../../components/common/PageHeader';
import VoteDetailsModal from '../../components/ui/VoteDetailsModal';
import { useAuthStore } from '../../store/auth';
import './DailyVote.css';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 每日投票页面组件
 */
const DailyVote: React.FC = () => {
  const [form] = Form.useForm<VoteForm>();
  const { message } = App.useApp(); // 使用动态message API
  
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
  const { allGames: games, allGamesLoading: gamesLoading, fetchAllGames } = useGameStore();
  
  // 本地状态
  const [wantsToPlay, setWantsToPlay] = useState(false);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [gamePreferences, setGamePreferences] = useState<GamePreference[]>([]);
  const [voteSortBy, setVoteSortBy] = useState<'voteCount' | 'averageTendency' | 'gameName'>('voteCount');
  const [gameSearchText, setGameSearchText] = useState(''); // 本地搜索文本
  
  // 投票详情模态框状态
  const [voteDetailsVisible, setVoteDetailsVisible] = useState(false);
  const [selectedGameForDetails, setSelectedGameForDetails] = useState<{
    gameId: string;
    gameName: string;
  } | null>(null);
  
  // 从状态管理获取的衍生状态
  const hasVoted = useHasVotedToday();
  const todayWantsToPlay = useTodayWantsToPlay();
  const todaySelectedGameIds = useTodaySelectedGames();

  // 获取当前用户信息
  const { user } = useAuthStore();

  /**
   * 初始化页面数据，并执行增强的缓存检查
   */
  useEffect(() => {
    // 增强的缓存检查和清理
    const performEnhancedCacheCheck = async () => {
      if (!user?.objectId) return;
      
      try {
        // 使用服务层的统一缓存验证功能
        const { validateCacheOnPageInit } = await import('../../services/votes');
        
        const shouldShowWarning = await validateCacheOnPageInit(user.objectId);
        
        if (shouldShowWarning) {
          // 显示提示消息
          message.warning({
            content: '检测到缓存数据不同步，已自动清除并重新加载',
            duration: 3
          });
        }
      } catch (error) {
        console.error('❌ 缓存检查过程中发生错误:', error);
      }
    };
    
    performEnhancedCacheCheck();
    loadTodayVote();
    loadTodayStats();
    fetchAllGames();
  }, [loadTodayVote, loadTodayStats, fetchAllGames, user]);

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
   * 投票提交前的预验证
   */
  const preSubmitValidation = async (): Promise<boolean> => {
    if (!user?.objectId) {
      console.error('❌ 用户未登录');
      message.error('请先登录');
      return false;
    }

    try {
      // 使用服务层的统一提交前验证功能
      const { validateBeforeSubmit } = await import('../../services/votes');
      return await validateBeforeSubmit(user.objectId);
    } catch (error) {
      console.error('❌ 提交前验证失败:', error);
      return true; // 即使验证失败，也允许提交，让后续逻辑处理
    }
  };

  /**
   * 处理投票提交
   */
  const handleSubmit = async (values: VoteForm) => {
    try {
      // 🔍 调试信息：显示即将提交的数据
      console.log('=== 投票提交调试信息 ===');
      console.log('表单数据 (values):', values);
      console.log('本地状态 - wantsToPlay:', wantsToPlay);
      console.log('本地状态 - selectedGames:', selectedGames);
      console.log('本地状态 - gamePreferences:', gamePreferences);
      
      // 🔍 提交前预验证
      const preValidationPassed = await preSubmitValidation();
      if (!preValidationPassed) {
        return;
      }
      
      // ✅ 使用当前本地状态构建提交数据，确保数据一致性
      const submitData: VoteForm = {
        wantsToPlay: wantsToPlay, // 使用本地状态
        selectedGames: selectedGames, // 使用本地状态
        gamePreferences: gamePreferences // 使用本地状态
      };
      
      console.log('实际提交的数据 (submitData):', submitData);
      
      // 🔍 数据验证：检查数据一致性
      if (wantsToPlay && selectedGames.length === 0) {
        console.warn('⚠️ 数据不一致：想玩游戏但没有选择游戏');
        message.error('请选择至少一个游戏');
        return;
      }
      
      if (wantsToPlay && selectedGames.length !== gamePreferences.length) {
        console.warn('⚠️ 数据不一致：选中游戏数量与倾向度数量不匹配');
        console.log('selectedGames.length:', selectedGames.length);
        console.log('gamePreferences.length:', gamePreferences.length);
        
        // 自动修复倾向度数据
        const fixedPreferences = selectedGames.map(gameId => {
          const existing = gamePreferences.find(pref => pref.gameId === gameId);
          return existing || { gameId, tendency: 3 };
        });
        
        console.log('修复后的倾向度数据:', fixedPreferences);
        setGamePreferences(fixedPreferences);
        
        submitData.gamePreferences = fixedPreferences;
      }
      
      console.log('最终提交数据:', submitData);
      console.log('=== 开始提交投票 ===');
      
      await submitVote(submitData);
      
      console.log('✅ 投票提交成功');
      message.success(hasVoted ? '投票已更新！' : '投票已提交！');
      
    } catch (error: any) {
      console.error('❌ 投票提交失败:', error);
      console.log('错误详情:', {
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // 如果是404错误，提示用户清除缓存
      if (error.code === 404) {
        console.log('检测到404错误，显示清除缓存选项');
        message.error({
          content: (
            <div>
              <div>投票失败：数据同步问题</div>
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                错误代码: {error.code}
              </div>
              <div style={{ marginTop: '8px' }}>
                <Button 
                  type="link" 
                  size="small" 
                  onClick={handleClearVoteCache}
                  style={{ padding: '4px 8px 4px 0', height: 'auto', color: '#1890ff' }}
                >
                  🔄 清除缓存重试
                </Button>
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => window.location.reload()}
                  style={{ padding: '4px 0', height: 'auto', color: '#52c41a' }}
                >
                  🔃 刷新页面
                </Button>
              </div>
            </div>
          ),
          duration: 12
        });
      } else {
        // 其他错误的通用处理
        message.error(`投票失败: ${error.message || '请重试'}`);
      }
    }
  };

  /**
   * 清除投票缓存
   */
  const handleClearVoteCache = async () => {
    const hide = message.loading('正在清除缓存并重新加载数据...', 0);
    
    try {
      console.log('开始清除投票缓存...');
      
      // 动态导入clearVotesCaches函数
      const { clearVotesCaches } = await import('../../services/dataCache');
      clearVotesCaches();
      console.log('投票缓存已清除');
      
      // 强制重新加载投票数据（绕过缓存）
      console.log('重新加载投票数据...');
      await Promise.all([
        loadTodayVote(),
        loadTodayStats()
      ]);
      
      hide();
      message.success({
        content: (
          <div>
            <div>✅ 缓存已清除，数据已重新加载</div>
            <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
              现在可以重新尝试投票了
            </div>
          </div>
        ),
        duration: 5
      });
      
      console.log('缓存清除和数据重新加载完成');
      
    } catch (error) {
      hide();
      console.error('清除缓存失败:', error);
      message.error({
        content: (
          <div>
            <div>❌ 清除缓存失败</div>
            <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
              请刷新页面重试
            </div>
          </div>
        ),
        duration: 5
      });
    }
  };

  /**
   * 重置表单到初始状态
   */
  const handleResetForm = () => {
    console.log('🔄 重置表单到初始状态');
    
    // 重置本地状态
    setWantsToPlay(false);
    setSelectedGames([]);
    setGamePreferences([]);
    setGameSearchText('');
    
    // 重置表单
    form.resetFields();
    
    // 确保表单字段同步
    form.setFieldsValue({
      wantsToPlay: false,
      selectedGames: [],
      gamePreferences: []
    });
    
    console.log('✅ 表单重置完成');
    message.success('✅ 表单已重置到初始状态');
  };

  /**
   * 处理想要玩游戏状态变化
   */
  const handleWantsToPlayChange = (checked: boolean) => {
    console.log('🎮 想要玩游戏状态变化:', checked);
    
    setWantsToPlay(checked);
    
    // 同步更新表单字段
    form.setFieldValue('wantsToPlay', checked);
    
    if (!checked) {
      console.log('🚫 不想玩游戏，清除游戏选择和倾向度');
      setSelectedGames([]);
      setGamePreferences([]);
      setGameSearchText(''); // 清除搜索文本
      
      // 同步更新表单字段
      form.setFieldValue('selectedGames', []);
      form.setFieldValue('gamePreferences', []);
    }
  };

  /**
   * 处理游戏选择变化
   */
  const handleGameSelectionChange = (gameIds: string[]) => {
    console.log('🎯 游戏选择变化:', gameIds);
    
    setSelectedGames(gameIds);
    
    // 同步更新表单字段
    form.setFieldValue('selectedGames', gameIds);
    
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
    
    console.log('📊 更新后的倾向度数据:', newPreferences);
    setGamePreferences(newPreferences);
    
    // 同步更新表单字段
    form.setFieldValue('gamePreferences', newPreferences);
  };

  /**
   * 处理游戏倾向度变化
   */
  const handleTendencyChange = (gameId: string, tendency: number) => {
    console.log(`⭐ 游戏 ${gameId} 倾向度变化:`, tendency);
    
    const newPreferences = gamePreferences.map((pref: GamePreference) =>
      pref.gameId === gameId ? { ...pref, tendency } : pref
    );
    
    console.log('📊 更新后的倾向度数据:', newPreferences);
    setGamePreferences(newPreferences);
    
    // 同步更新表单字段
    form.setFieldValue('gamePreferences', newPreferences);
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
   * 本地游戏过滤函数
   */
  const getFilteredGames = () => {
    if (!gameSearchText.trim()) {
      return games;
    }
    
    const searchText = gameSearchText.toLowerCase();
    return games.filter(game => {
      const nameMatch = game.name.toLowerCase().includes(searchText);
      const platformMatch = game.platform?.toLowerCase().includes(searchText);
      const typeMatch = game.type?.toLowerCase().includes(searchText);
      const playersMatch = `${game.minPlayers}-${game.maxPlayers}`.includes(searchText);
      
      return nameMatch || platformMatch || typeMatch || playersMatch;
    });
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

  /**
   * 处理游戏点击，显示投票详情
   */
  const handleGameClick = (gameId: string, gameName: string) => {
    setSelectedGameForDetails({ gameId, gameName });
    setVoteDetailsVisible(true);
  };

  /**
   * 关闭投票详情模态框
   */
  const handleCloseVoteDetails = () => {
    setVoteDetailsVisible(false);
    setSelectedGameForDetails(null);
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

      {/* 调试工具栏 */}
      <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }} className="debug-toolbar">
        <Row justify="space-between" align="middle">
                    <Col>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              🔧 调试工具：重置表单、清除缓存、刷新数据
            </Text>
          </Col>
          <Col>
            <Space size="small">
              <Button 
                size="small" 
                onClick={handleResetForm}
                type="default"
                style={{ fontSize: '12px' }}
                title="重置表单到初始状态"
              >
                🔄 重置表单
              </Button>
              <Button 
                size="small" 
                icon={<ReloadOutlined />}
                onClick={handleClearVoteCache}
                type="default"
                style={{ fontSize: '12px' }}
                title="清除投票缓存并重新加载数据"
              >
                🗑️ 清除缓存
              </Button>
              <Button 
                size="small" 
                onClick={() => {
                  loadTodayVote();
                  loadTodayStats();
                  message.success('数据已刷新');
                }}
                style={{ fontSize: '12px' }}
                title="重新从服务器加载投票数据"
              >
                🔃 刷新数据
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

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
                    <div>
                      {/* 游戏搜索输入框 */}
                      <Input
                        placeholder="🔍 搜索游戏名称、平台、类型或人数..."
                        value={gameSearchText}
                        onChange={(e) => setGameSearchText(e.target.value)}
                        allowClear
                        style={{ marginBottom: '8px' }}
                        size="large"
                      />
                      
                      {/* 游戏选择器 */}
                      <Select
                        mode="multiple"
                        placeholder={
                          games.length === 0 
                            ? "暂无游戏可选，请先在游戏库中添加游戏"
                            : `从 ${games.length} 个游戏中选择${gameSearchText ? `（筛选出 ${getFilteredGames().length} 个）` : ''}`
                        }
                        value={selectedGames}
                        onChange={handleGameSelectionChange}
                        style={{ width: '100%' }}
                        size="large"
                        maxTagCount="responsive"
                        showSearch={false} // 禁用内置搜索，使用我们的本地搜索
                        open={getFilteredGames().length > 0 ? undefined : false} // 没有匹配结果时不显示下拉
                        disabled={games.length === 0} // 没有游戏时禁用
                      >
                        {getFilteredGames().map(game => (
                          <Option key={game.objectId} value={game.objectId}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>
                                {game.name} ({game.minPlayers}-{game.maxPlayers}人)
                              </span>
                              <div>
                                {game.platform && (
                                  <Tag color="blue" style={{ margin: '0 2px', fontSize: '12px' }}>
                                    {game.platform}
                                  </Tag>
                                )}
                                {game.type && (
                                  <Tag color="green" style={{ margin: '0 2px', fontSize: '12px' }}>
                                    {game.type}
                                  </Tag>
                                )}
                              </div>
                            </div>
                          </Option>
                        ))}
                      </Select>
                      
                      {/* 搜索结果提示 */}
                      {gameSearchText && getFilteredGames().length === 0 && (
                        <div style={{ 
                          textAlign: 'center', 
                          color: '#999', 
                          fontSize: '14px', 
                          marginTop: '8px',
                          padding: '16px',
                          border: '1px dashed #d9d9d9',
                          borderRadius: '6px'
                        }}>
                          😅 没有找到匹配的游戏，试试其他关键词？
                        </div>
                      )}
                    </div>
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
                      <Title level={4} style={{ margin: 0 }}>
                        今日热门游戏 ({todayStats.topGames.length}个)
                      </Title>
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
                    <div style={{ 
                      maxHeight: '400px', 
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      border: '1px solid #f0f0f0',
                      borderRadius: '6px'
                    }}>
                      <List
                        size="small"
                        dataSource={getSortedTopGames()}
                        renderItem={(game, index) => (
                          <List.Item>
                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                              <Space>
                                <Tag 
                                  color={index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'default'}
                                >
                                  #{index + 1}
                                </Tag>
                                <Text 
                                  strong 
                                  style={{ cursor: 'pointer', color: '#1890ff' }}
                                  onClick={() => handleGameClick(game.gameId, game.gameName)}
                                >
                                  {game.gameName}
                                </Text>
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

                {/* 投票用户列表 */}
                {todayStats && todayStats.totalVotes > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Title level={5} style={{ marginBottom: 8 }}>
                      📝 今日投票用户 ({todayStats.totalVotes}人)
                    </Title>
                    <div style={{ 
                      maxHeight: 120, 
                      overflowY: 'auto',
                      background: '#fafafa',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #d9d9d9'
                    }}>
                      {todayStats.voterList?.map((voter, index) => (
                        <Tag 
                          key={index}
                          color={voter.wantsToPlay ? 'green' : 'default'}
                          style={{ margin: '2px' }}
                        >
                          {voter.userName} 
                          {voter.wantsToPlay ? ' ✓' : ' ✗'}
                        </Tag>
                      )) || (
                        <Text type="secondary">暂无投票用户信息</Text>
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      ✓ 表示想玩，✗ 表示不想玩
                    </Text>
                  </div>
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

      {/* 投票详情模态框 */}
      {selectedGameForDetails && (
        <VoteDetailsModal
          visible={voteDetailsVisible}
          gameId={selectedGameForDetails.gameId}
          gameName={selectedGameForDetails.gameName}
          date={new Date().toISOString().split('T')[0]}
          onClose={handleCloseVoteDetails}
        />
      )}
    </div>
  );
};

export default DailyVote;