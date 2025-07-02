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
  message
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
  const { games, fetchGames } = useGameStore();
  const { createTeam, submitting } = useTeamStore();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  /**
   * 初始化数据
   */
  useEffect(() => {
    if (visible && games.length === 0) {
      fetchGames();
    }
  }, [visible, games.length, fetchGames]);

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
          <Select
            placeholder="请选择要组队的游戏"
            showSearch
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {games.map(game => (
              <Option key={game.objectId} value={game.objectId}>
                {game.name} ({game.minPlayers}-{game.maxPlayers}人)
              </Option>
            ))}
          </Select>
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