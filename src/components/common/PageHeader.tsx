/**
 * 页面头部组件
 * 提供统一的页面标题和描述样式
 */

import React from 'react';
import { Typography, Space } from 'antd';
import './PageHeader.css';

const { Title, Text } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
}

/**
 * 页面头部组件
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  extra,
  className = ''
}) => {
  return (
    <div className={`page-header ${className}`}>
      <div className="page-header-content">
        <div className="page-header-main">
          <Space size="middle" className="page-header-title-section">
            {icon && (
              <div className="page-header-icon">
                {icon}
              </div>
            )}
            <div className="page-header-text">
              <Title level={2} className="page-header-title">
                {title}
              </Title>
              {subtitle && (
                <Text type="secondary" className="page-header-subtitle">
                  {subtitle}
                </Text>
              )}
            </div>
          </Space>
        </div>
        {extra && (
          <div className="page-header-extra">
            {extra}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader; 