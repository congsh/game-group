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
  const { allGames: games, fetchAllGames } = useGameStore(); // 使用独立的完整游戏列表
  const { createTeam, submitting } = useTeamStore();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [gameSearchText, setGameSearchText] = useState(''); // 本地搜索文本

  /**
   * 初始化数据
   */
  useEffect(() => {
    if (visible && games.length === 0) {
      fetchAllGames();
    }
  }, [visible, games.length, fetchAllGames]);

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
   * 表单提交处理
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const teamForm: TeamForm = {
        gameId: values.gameId,
        eventDate: values.eventDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
      };

      await createTeam(teamForm);
      
      message.success('组队创建成功！');
      form.resetFields();
      setSelectedDate(null);
      onSuccess?.();
      onCancel();
    } catch (error) {
      console.error('创建组队失败:', error);
      message.error('创建组队失败，请重试');
    }
  };

  /**
   * 模态框关闭处理
   */
  const handleCancel = () => {
    form.resetFields();
    setSelectedDate(null);
    setGameSearchText(''); // 清除搜索文本
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
   * 禁用非周末日期
   */
  const disabledDate = (current: Dayjs) => {
    if (!current) return false;
    
    // 禁用过去的日期
    if (current && current < dayjs().startOf('day')) {
      return true;
    }
    
    // 只允许选择未来8周内的周末
    const eightWeeksLater = dayjs().add(8, 'week');
    if (current && current > eightWeeksLater) {
      return true;
    }
    
    // 只允许选择周末
    return !isWeekend(current);
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
          创建周末组队
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
              onChange={(e) => setGameSearchText(e.target.value)}
              allowClear
              style={{ marginBottom: '8px' }}
              size="large"
            />
            
            {/* 游戏选择器 */}
            <Select
              placeholder={
                games.length === 0 
                  ? "暂无游戏可选，请先在游戏库中添加游戏"
                  : `从 ${games.length} 个游戏中选择要组队的游戏${gameSearchText ? `（筛选出 ${getFilteredGames().length} 个）` : ''}`
              }
              showSearch={false} // 禁用内置搜索，使用我们的本地搜索
              style={{ width: '100%' }}
              size="large"
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
            placeholder="请选择周末日期"
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
              📅 活动将在 {selectedDate.format('YYYY年MM月DD日')} ({selectedDate.format('dddd')}) 举行
            </p>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default CreateTeamModal; 