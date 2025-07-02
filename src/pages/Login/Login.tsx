/**
 * 登录页面
 */

import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const { Title, Text } = Typography;

interface LoginFormValues {
  username: string;
}

export const Login: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  /**
   * 处理表单提交
   */
  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await login(values.username);
      message.success('登录成功！');
      navigate('/'); // 登录成功后跳转到主页
    } catch (error: any) {
      message.error(error.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <Title level={2}>游戏组队平台</Title>
          <Text type="secondary">输入昵称即可开始游戏组队之旅</Text>
        </div>
        
        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            label="昵称"
            rules={[
              { required: true, message: '请输入您的昵称' },
              { min: 2, message: '昵称至少2个字符' },
              { max: 20, message: '昵称最多20个字符' },
              { pattern: /^[a-zA-Z0-9\u4e00-\u9fa5_]+$/, message: '昵称只能包含中文、英文、数字和下划线' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入您的昵称"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              {loading ? '登录中...' : '进入游戏'}
            </Button>
          </Form.Item>
        </Form>

        <div className="login-tips">
          <Text type="secondary">
            💡 提示：使用相同昵称登录将恢复您的数据
          </Text>
        </div>
      </Card>
    </div>
  );
}; 