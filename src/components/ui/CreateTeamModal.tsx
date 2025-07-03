/**
 * 创建组队表单模态框组件
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Button,
  Space,
  message,
  Input,
  Tag
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  RocketOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { TeamForm } from '../../types/team';
import { useGameStore } from '../../store/games';
import { useTeamStore } from '../../store/teams';

const { Option } = Select;

interface CreateTeamModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

/**
 * 创建组队表单模态框
 */
const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const { allGames: games, allGamesLoading: gamesLoading, fetchAllGames } = useGameStore(); // 使用独立的完整游戏列表
  const { createTeam, submitting } = useTeamStore();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [gameSearchText, setGameSearchText] = useState(''); // 本地搜索文本

  /**
   * 初始化数据
   */
  useEffect(() => {
    if (visible) {
      // 每次打开模态框都刷新游戏列表，确保数据最新
      console.log('创建组队模态框打开，刷新游戏列表...');
      fetchAllGames().catch(error => {
        console.error('刷新游戏列表失败:', error);
        message.warning('获取游戏列表失败，请稍后重试');
      });
    }
  }, [visible, fetchAllGames]);

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
   * 处理搜索框输入变化
   */
  const handleSearchChange = (value: string) => {
    setGameSearchText(value);
    
    // 如果用户正在搜索，清除之前的游戏选择
    // 这样可以避免搜索关键词和选择的游戏ID产生冲突
    if (value.trim()) {
      const currentGameId = form.getFieldValue('gameId');
      if (currentGameId) {
        // 检查当前选择的游戏是否在搜索结果中
        const filteredGames = games.filter(game => {
          const searchText = value.toLowerCase();
          const nameMatch = game.name.toLowerCase().includes(searchText);
          const platformMatch = game.platform?.toLowerCase().includes(searchText);
          const typeMatch = game.type?.toLowerCase().includes(searchText);
          const playersMatch = `${game.minPlayers}-${game.maxPlayers}`.includes(searchText);
          
          return nameMatch || platformMatch || typeMatch || playersMatch;
        });
        
        const currentGameStillVisible = filteredGames.some(game => game.objectId === currentGameId);
        if (!currentGameStillVisible) {
          // 如果当前选择的游戏在搜索结果中不可见，清除选择
          form.setFieldValue('gameId', undefined);
          console.log('搜索过滤导致当前选择的游戏不可见，已清除选择');
        }
      }
    }
  };

  /**
   * 处理游戏选择变化
   */
  const handleGameSelect = (gameId: string) => {
    console.log('用户选择游戏:', gameId);
    
    // 验证选择的游戏ID是否有效
    const selectedGame = games.find(game => game.objectId === gameId);
    if (!selectedGame) {
      console.error('选择的游戏ID无效:', gameId);
      message.error('选择的游戏无效，请重新选择');
      return;
    }
    
    console.log('游戏选择有效:', {
      id: selectedGame.objectId,
      name: selectedGame.name
    });
    
    // 设置表单字段值
    form.setFieldValue('gameId', gameId);
  };

  /**
   * 表单提交处理
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      console.log('准备创建组队，表单数据:', values);
      console.log('当前搜索文本:', gameSearchText);
      console.log('当前游戏列表长度:', games.length);
      console.log('过滤后游戏列表长度:', getFilteredGames().length);
      
      // 检查gameId是否是有效的ObjectId格式
      if (!values.gameId || typeof values.gameId !== 'string' || values.gameId.length !== 24) {
        console.error('无效的游戏ID格式:', values.gameId);
        message.error({
          content: (
            <div>
              <div>⚠️ 游戏选择无效</div>
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                请重新选择游戏，不要直接输入搜索关键词
              </div>
            </div>
          ),
          duration: 6
        });
        
        // 重置表单的gameId字段
        form.setFieldValue('gameId', undefined);
        return;
      }
      
      // 验证选择的游戏是否存在于当前游戏列表中
      const selectedGame = games.find(game => game.objectId === values.gameId);
      if (!selectedGame) {
        console.error('选择的游戏不存在于当前游戏列表中:', values.gameId);
        console.log('当前可用游戏列表:', games.map(g => ({ id: g.objectId, name: g.name })));
        
        message.error({
          content: (
            <div>
              <div>🎮 游戏不存在</div>
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                选择的游戏不在当前列表中，正在刷新游戏列表...
              </div>
            </div>
          ),
          duration: 6
        });
        
        // 刷新游戏列表
        await fetchAllGames();
        message.info('游戏列表已刷新，请重新选择游戏');
        return;
      }
      
      console.log('验证通过，选择的游戏:', {
        id: selectedGame.objectId,
        name: selectedGame.name,
        maxPlayers: selectedGame.maxPlayers
      });
      
      const teamForm: TeamForm = {
        gameId: values.gameId,
        eventDate: values.eventDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
      };

      console.log('提交组队数据:', teamForm);
      await createTeam(teamForm);
      
      message.success('组队创建成功！');
      
      // 完全重置所有状态
      form.resetFields();
      setSelectedDate(null);
      setGameSearchText('');
      form.setFieldValue('gameId', undefined);
      
      console.log('组队创建成功，所有状态已重置');
      
      onSuccess?.();
      onCancel();
    } catch (error: any) {
      console.error('创建组队失败:', error);
      
      // 根据错误类型提供不同的用户提示
      if (error.message) {
        if (error.message.includes('游戏不存在')) {
          message.error({
            content: (
              <div>
                <div>🎮 游戏不存在</div>
                <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                  选择的游戏可能已被删除，请重新选择
                </div>
              </div>
            ),
            duration: 8
          });
          
          // 自动刷新游戏列表
          try {
            await fetchAllGames();
            message.info('游戏列表已刷新，请重新选择游戏');
          } catch (refreshError) {
            console.error('刷新游戏列表失败:', refreshError);
          }
          
        } else if (error.message.includes('用户未登录')) {
          message.error({
            content: (
              <div>
                <div>🔒 用户未登录</div>
                <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                  请刷新页面重新登录
                </div>
              </div>
            ),
            duration: 6
          });
          
        } else if (error.message.includes('权限')) {
          message.error({
            content: (
              <div>
                <div>🚫 权限不足</div>
                <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                  {error.message}
                </div>
              </div>
            ),
            duration: 8
          });
          
        } else if (error.message.includes('数据表初始化失败')) {
          message.error({
            content: (
              <div>
                <div>⚠️ 系统初始化错误</div>
                <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                  请联系管理员或稍后重试
                </div>
              </div>
            ),
            duration: 10
          });
          
        } else {
          // 其他明确的错误信息
          message.error({
            content: (
              <div>
                <div>❌ 创建组队失败</div>
                <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                  {error.message}
                </div>
              </div>
            ),
            duration: 8
          });
        }
      } else {
        // 通用错误处理
        message.error({
          content: (
            <div>
              <div>❌ 创建组队失败</div>
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                请检查网络连接并重试
              </div>
            </div>
          ),
          duration: 6
        });
      }
    }
  };

  /**
   * 模态框关闭处理
   */
  const handleCancel = () => {
    // 重置表单
    form.resetFields();
    
    // 清除所有本地状态
    setSelectedDate(null);
    setGameSearchText('');
    
    // 确保表单字段被正确重置
    form.setFieldValue('gameId', undefined);
    
    console.log('模态框关闭，所有状态已重置');
    onCancel();
  };

  /**
   * 判断日期是否为周末
   */
  const isWeekend = (date: Dayjs) => {
    const day = date.day();
    return day === 0 || day === 6; // 0是周日，6是周六
  };

  /**
   * 禁用过去的日期，允许任何未来日期
   */
  const disabledDate = (current: Dayjs) => {
    if (!current) return false;
    
    // 只禁用过去的日期
    if (current && current < dayjs().startOf('day')) {
      return true;
    }
    
    // 只允许选择未来8周内的日期
    const eightWeeksLater = dayjs().add(8, 'week');
    if (current && current > eightWeeksLater) {
      return true;
    }
    
    // 允许选择任何日期（不再限制为只有周末）
    return false;
  };

  /**
   * 验证结束时间必须晚于开始时间
   */
  const validateEndTime = (_: any, value: Dayjs) => {
    const startTime = form.getFieldValue('startTime');
    if (!startTime || !value) {
      return Promise.resolve();
    }
    
    if (value.isBefore(startTime)) {
      return Promise.reject(new Error('结束时间必须晚于开始时间'));
    }
    
    return Promise.resolve();
  };

  return (
    <Modal
      title={
        <Space>
          <RocketOutlined />
          创建游戏组队
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
        >
          创建组队
        </Button>,
      ]}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          startTime: dayjs('14:00', 'HH:mm'),
          endTime: dayjs('18:00', 'HH:mm'),
        }}
      >
        <Form.Item
          name="gameId"
          label={
            <Space>
              <RocketOutlined />
              选择游戏
            </Space>
          }
          rules={[{ required: true, message: '请选择游戏' }]}
        >
          <div>
            {/* 游戏搜索输入框 */}
            <Input
              placeholder="🔍 搜索游戏名称、平台、类型或人数..."
              value={gameSearchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              allowClear
              style={{ marginBottom: '8px' }}
              size="large"
            />
            
            {/* 游戏选择器 */}
            <Select
              placeholder={
                gamesLoading 
                  ? "正在加载游戏列表..."
                  : games.length === 0 
                    ? "暂无游戏可选，请先在游戏库中添加游戏"
                    : `从 ${games.length} 个游戏中选择要组队的游戏${gameSearchText ? `（筛选出 ${getFilteredGames().length} 个）` : ''}`
              }
              showSearch={false} // 禁用内置搜索，使用我们的本地搜索
              style={{ width: '100%' }}
              size="large"
              loading={gamesLoading}
              open={!gamesLoading && getFilteredGames().length > 0 ? undefined : false} // 加载中或没有匹配结果时不显示下拉
              disabled={gamesLoading || games.length === 0} // 加载中或没有游戏时禁用
              onSelect={handleGameSelect}
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

        <Form.Item
          name="eventDate"
          label={
            <Space>
              <CalendarOutlined />
              活动日期
            </Space>
          }
          rules={[{ required: true, message: '请选择活动日期' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            placeholder="请选择游戏日期"
            disabledDate={disabledDate}
            format="YYYY-MM-DD"
            onChange={setSelectedDate}
          />
        </Form.Item>

        <Form.Item
          name="startTime"
          label={
            <Space>
              <ClockCircleOutlined />
              开始时间
            </Space>
          }
          rules={[{ required: true, message: '请选择开始时间' }]}
        >
          <TimePicker
            style={{ width: '100%' }}
            format="HH:mm"
            placeholder="请选择开始时间"
          />
        </Form.Item>

        <Form.Item
          name="endTime"
          label={
            <Space>
              <ClockCircleOutlined />
              结束时间
            </Space>
          }
          rules={[
            { required: true, message: '请选择结束时间' },
            { validator: validateEndTime }
          ]}
        >
          <TimePicker
            style={{ width: '100%' }}
            format="HH:mm"
            placeholder="请选择结束时间"
          />
        </Form.Item>

        {selectedDate && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            <p style={{ margin: 0, color: '#52c41a' }}>
              📅 游戏活动将在 {selectedDate.format('YYYY年MM月DD日')} ({selectedDate.format('dddd')}) 举行
            </p>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default CreateTeamModal; 