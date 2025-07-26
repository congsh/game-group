/**
 * 通知面板组件
 */

import React, { useEffect } from 'react';
import { 
  Card, 
  List, 
  Button, 
  Avatar, 
  Typography, 
  Space, 
  Empty, 
  Badge,
  Tooltip,
  message
} from 'antd';
import { 
  BellOutlined, 
  CloseOutlined, 
  CheckOutlined,
  UserOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { useMessageBoardStore } from '../../store/messages';
import { MessageNotification } from '../../types/message';

const { Text, Title } = Typography;

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead
  } = useMessageBoardStore();

  const [messageApi, contextHolder] = message.useMessage();

  // 加载通知
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // 标记单个通知为已读
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      messageApi.error('标记已读失败');
    }
  };

  // 标记所有通知为已读
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      messageApi.success('所有通知已标记为已读');
    } catch (error) {
      messageApi.error('标记失败');
    }
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return new Date(date).toLocaleDateString();
  };

  // 渲染通知项
  const renderNotificationItem = (notification: MessageNotification) => {
    const isUnread = !notification.isRead;
    
    return (
      <List.Item
        key={notification.objectId}
        className={`notification-item ${isUnread ? 'unread' : ''}`}
        actions={[
          isUnread && (
            <Tooltip title="标记为已读" key="mark-read">
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleMarkAsRead(notification.objectId)}
              />
            </Tooltip>
          )
        ].filter(Boolean)}
      >
        <List.Item.Meta
          avatar={
            <Badge dot={isUnread}>
              <Avatar 
                icon={<MessageOutlined />} 
                size="small"
                style={{ backgroundColor: '#1890ff' }}
              />
            </Badge>
          }
          title={
            <Space>
              <Text strong={isUnread}>
                {notification.senderName} 在留言中提到了你
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {formatTime(notification.createdAt)}
              </Text>
            </Space>
          }
          description={
            <Text type="secondary" className="notification-content">
              {notification.messageContent}
            </Text>
          }
        />
      </List.Item>
    );
  };

  return (
    <Card 
      className="notification-panel"
      size="small"
      style={{ 
        position: 'absolute',
        top: 0,
        right: 0,
        width: 400,
        maxHeight: 500,
        overflow: 'auto',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
    >
      {contextHolder}
      
      {/* 通知面板头部 */}
      <div className="notification-header">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <BellOutlined />
            <Title level={5} style={{ margin: 0 }}>
              通知消息
            </Title>
            {unreadCount > 0 && (
              <Badge count={unreadCount} size="small" />
            )}
          </Space>
          <Space>
            {unreadCount > 0 && (
              <Button
                type="text"
                size="small"
                onClick={handleMarkAllAsRead}
              >
                全部已读
              </Button>
            )}
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </Space>
        </Space>
      </div>

      {/* 通知列表 */}
      <div className="notification-list">
        {notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无通知"
            style={{ padding: '20px 0' }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={renderNotificationItem}
            size="small"
            split={false}
            style={{ maxHeight: 400, overflow: 'auto' }}
          />
        )}
      </div>
    </Card>
  );
};

export default NotificationPanel; 