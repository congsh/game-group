/**
 * 通用页面头部组件
 * 包含返回主页按钮和页面标题
 */

import React from 'react';
import { Button, Space, Typography } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  extra?: React.ReactNode;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

/**
 * 页面头部组件
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  extra,
  showBackButton = false,
  showHomeButton = true
}) => {
  const navigate = useNavigate();

  /**
   * 返回主页
   */
  const handleGoHome = () => {
    navigate('/');
  };

  /**
   * 返回上一页
   */
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start',
      marginBottom: 24,
      padding: '16px 0'
    }}>
      <div style={{ flex: 1 }}>
        {/* 导航按钮 */}
        <div style={{ marginBottom: 8 }}>
          <Space>
            {showBackButton && (
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={handleGoBack}
                size="small"
              >
                返回
              </Button>
            )}
            {showHomeButton && (
              <Button 
                icon={<HomeOutlined />}
                onClick={handleGoHome}
                size="small"
                type="default"
              >
                回到主页
              </Button>
            )}
          </Space>
        </div>

        {/* 页面标题 */}
        <div style={{ textAlign: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
            {title}
          </Title>
          {subtitle && (
            <div style={{ marginTop: 8, color: '#666' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* 额外内容 */}
      {extra && (
        <div style={{ marginLeft: 16 }}>
          {extra}
        </div>
      )}
    </div>
  );
};

export default PageHeader; 