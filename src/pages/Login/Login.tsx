/**
 * 登录页面
 */

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Checkbox, App, Spin } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../utils/auth-storage';
import './Login.css';

const { Title, Text } = Typography;

interface LoginFormValues {
  username: string;
  rememberMe?: boolean;
}

export const Login: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { login, user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { message } = App.useApp();

  // 如果用户已登录，自动跳转到主页
  useEffect(() => {
    if (user && !isLoading) {
      console.log('👤 用户已登录，从登录页跳转到主页:', user.username);
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  /**
   * 处理表单提交
   */
  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const user = await login(values.username);
      
      // 保存登录信息到本地存储
      if (user) {
        authStorage.saveAuth(user, values.rememberMe || false);
      }
      
      message.success('登录成功！');
      navigate('/'); // 登录成功后跳转到主页
    } catch (error: any) {
      message.error(error.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 如果正在检查登录状态，显示加载
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>正在检查登录状态...</div>
      </div>
    );
  }

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
          initialValues={{ rememberMe: true }}
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

          <Form.Item name="rememberMe" valuePropName="checked">
            <Checkbox>记住我（7天内免登录）</Checkbox>
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