/**
 * 创建勋章模态框组件
 * 用于为其他用户创建和颁发勋章
 */

import React, { useState } from 'react';
import { Modal, Form, Input, Select, ColorPicker, Button, message, Space } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { CreateBadgeRequest } from '../../types/badge';
import { badgeService } from '../../services/badges';
import { useAuthStore } from '../../store/auth';

const { TextArea } = Input;
const { Option } = Select;

interface CreateBadgeModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  receiverUserId: string;
  receiverUsername: string;
}

const CreateBadgeModal: React.FC<CreateBadgeModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  receiverUserId,
  receiverUsername
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  // 预设勋章模板
  const badgeTemplates = [
    { title: '游戏高手', description: '在游戏中表现出色', icon: 'trophy', color: '#faad14' },
    { title: '团队精神', description: '具有优秀的团队合作精神', icon: 'heart', color: '#52c41a' },
    { title: '创新思维', description: '思维活跃，富有创造力', icon: 'star', color: '#1890ff' },
    { title: '领导能力', description: '展现出卓越的领导才能', icon: 'crown', color: '#722ed1' },
    { title: '坚持不懈', description: '面对困难永不放弃', icon: 'fire', color: '#f5222d' },
    { title: '友善助人', description: '乐于助人，友善待人', icon: 'heart', color: '#eb2f96' },
  ];

  // 图标选项
  const iconOptions = [
    { value: 'trophy', label: '🏆 奖杯', emoji: '🏆' },
    { value: 'star', label: '⭐ 星星', emoji: '⭐' },
    { value: 'heart', label: '❤️ 爱心', emoji: '❤️' },
    { value: 'fire', label: '🔥 火焰', emoji: '🔥' },
    { value: 'crown', label: '👑 皇冠', emoji: '👑' },
    { value: 'gem', label: '💎 宝石', emoji: '💎' },
  ];

  /**
   * 处理提交
   */
  const handleSubmit = async (values: any) => {
    if (!user) {
      message.error('请先登录');
      return;
    }

    setLoading(true);
    try {
      const request: CreateBadgeRequest = {
        title: values.title,
        description: values.description,
        icon: values.icon,
        color: typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || '#1890ff',
        receiverUserId
      };

      await badgeService.createBadge(request, user.objectId);
      message.success(`成功为 ${receiverUsername} 创建勋章！`);
      form.resetFields();
      onSuccess();
    } catch (error) {
      message.error('创建勋章失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 应用模板
   */
  const applyTemplate = (template: any) => {
    form.setFieldsValue({
      title: template.title,
      description: template.description,
      icon: template.icon,
      color: template.color
    });
  };

  /**
   * 处理取消
   */
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <TrophyOutlined />
          为 {receiverUsername} 创建勋章
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          icon: 'trophy',
          color: '#1890ff'
        }}
      >
        {/* 快速模板选择 */}
        <Form.Item label="快速选择模板">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {badgeTemplates.map((template, index) => (
              <Button
                key={index}
                size="small"
                type="dashed"
                onClick={() => applyTemplate(template)}
                style={{ 
                  height: 'auto', 
                  padding: '4px 8px',
                  fontSize: '12px'
                }}
              >
                {template.title}
              </Button>
            ))}
          </div>
        </Form.Item>

        {/* 勋章标题 */}
        <Form.Item
          label="勋章标题"
          name="title"
          rules={[
            { required: true, message: '请输入勋章标题' },
            { max: 20, message: '标题不能超过20个字符' }
          ]}
        >
          <Input placeholder="为这个勋章起个名字" />
        </Form.Item>

        {/* 勋章描述 */}
        <Form.Item
          label="勋章描述"
          name="description"
          rules={[
            { required: true, message: '请输入勋章描述' },
            { max: 100, message: '描述不能超过100个字符' }
          ]}
        >
          <TextArea
            rows={3}
            placeholder="描述一下这个勋章代表什么..."
            showCount
            maxLength={100}
          />
        </Form.Item>

        <Form.Item label="勋章外观">
          <Space size="large">
            {/* 图标选择 */}
            <Form.Item
              label="图标"
              name="icon"
              style={{ marginBottom: 0 }}
            >
              <Select style={{ width: 120 }}>
                {iconOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* 颜色选择 */}
            <Form.Item
              label="颜色"
              name="color"
              style={{ marginBottom: 0 }}
            >
              <ColorPicker
                presets={[
                  {
                    label: '推荐颜色',
                    colors: [
                      '#1890ff', '#52c41a', '#faad14', 
                      '#f5222d', '#722ed1', '#eb2f96',
                      '#13c2c2', '#fa8c16'
                    ]
                  }
                ]}
              />
            </Form.Item>
          </Space>
        </Form.Item>

        {/* 提交按钮 */}
        <Form.Item style={{ marginTop: 24 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              创建勋章
            </Button>
            <Button onClick={handleCancel}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateBadgeModal; 