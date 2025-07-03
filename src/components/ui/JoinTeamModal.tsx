/**
 * 加入组队时设置时间的模态框组件
 */

import React, { useState } from 'react';
import {
  Modal,
  Form,
  TimePicker,
  Button,
  Space,
  message,
  Alert,
  Typography
} from 'antd';
import {
  ClockCircleOutlined,
  TeamOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { JoinTeamForm } from '../../types/team';
import { TeamDetails } from '../../types/team';

const { Text } = Typography;

interface JoinTeamModalProps {
  visible: boolean;
  team: TeamDetails | null;
  onCancel: () => void;
  onJoin: (joinForm: JoinTeamForm) => Promise<void>;
  loading?: boolean;
}

/**
 * 加入组队时设置时间的模态框
 */
const JoinTeamModal: React.FC<JoinTeamModalProps> = ({
  visible,
  team,
  onCancel,
  onJoin,
  loading = false
}) => {
  const [form] = Form.useForm();

  if (!team) return null;

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

  /**
   * 表单提交处理
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const joinForm: JoinTeamForm = {
        teamId: team.objectId,
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
      };

      await onJoin(joinForm);
      
      // 重置表单
      form.resetFields();
      message.success('已成功加入队伍！');
    } catch (error: any) {
      console.error('加入组队失败:', error);
      if (error.message) {
        message.error(error.message);
      } else {
        message.error('加入队伍失败，请重试');
      }
    }
  };

  /**
   * 模态框关闭处理
   */
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  /**
   * 获取队长的时间范围显示文本
   */
  const getLeaderTimeText = () => {
    return `${team.startTime} - ${team.endTime}`;
  };

  return (
    <Modal
      title={
        <Space>
          <TeamOutlined />
          加入队伍 - {team.gameName}
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
          loading={loading}
          onClick={handleSubmit}
        >
          加入队伍
        </Button>,
      ]}
      width={500}
      destroyOnClose
    >
      {/* 队伍信息提示 */}
      <Alert
        message="队伍信息"
        description={
          <div>
            <p><strong>游戏：</strong>{team.gameName}</p>
            <p><strong>日期：</strong>{team.eventDate}</p>
            <p><strong>队长：</strong>{team.leaderName}</p>
            <p><strong>队长设定时间：</strong>{getLeaderTimeText()}</p>
            <p><strong>当前人数：</strong>{team.members.length}/{team.maxMembers}</p>
          </div>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      {/* 个性化时间设置 */}
      <Alert
        message="设置您的游戏时间"
        description="您可以设置自己方便的游戏时间，不必与队长时间完全一致。队伍会自动计算大家的时间重叠区间。"
        type="success"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          startTime: dayjs(team.startTime, 'HH:mm'),
          endTime: dayjs(team.endTime, 'HH:mm'),
        }}
      >
        <Form.Item
          name="startTime"
          label={
            <Space>
              <ClockCircleOutlined />
              您的开始时间
            </Space>
          }
          rules={[{ required: true, message: '请选择开始时间' }]}
        >
          <TimePicker
            style={{ width: '100%' }}
            format="HH:mm"
            placeholder="请选择您方便的开始时间"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="endTime"
          label={
            <Space>
              <ClockCircleOutlined />
              您的结束时间
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
            placeholder="请选择您方便的结束时间"
            size="large"
          />
        </Form.Item>

        <div style={{ 
          padding: '12px', 
          backgroundColor: '#fff7e6', 
          border: '1px solid #ffd591',
          borderRadius: '6px',
          marginTop: '16px'
        }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 <strong>温馨提示：</strong>您设置的时间不必与队长完全一致，系统会帮您找到与其他队员的最佳时间重叠区间。
          </Text>
        </div>
      </Form>
    </Modal>
  );
};

export default JoinTeamModal; 