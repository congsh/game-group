/**
 * 留言板页面
 */

import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Button, 
  List, 
  Avatar, 
  Typography, 
  Space, 
  Divider,
  Empty,
  Spin,
  message,
  Popconfirm,
  Tooltip,
  Badge
} from 'antd';
import { 
  MessageOutlined, 
  DeleteOutlined, 
  ReloadOutlined, 
  UserOutlined,
  ClockCircleOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useMessageBoardStore } from '../../store/messages';
import { useAuthStore } from '../../store/auth';
import { Message } from '../../types/message';
import MessageEditor from '../../components/ui/MessageEditor';
import NotificationPanel from '../../components/ui/NotificationPanel';
import './MessageBoard.css';

// 时间格式化函数
const formatTimeAgo = (date: Date) => {
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

const { Title, Text, Paragraph } = Typography;

const MessageBoard: React.FC = () => {
  const { user } = useAuthStore();
  const {
    messages,
    isLoading,
    hasMore,
    error,
    unreadCount,
    loadMessages,
    removeMessage,
    refreshMessages,
    updateUnreadCount
  } = useMessageBoardStore();
  
  const [messageApi, contextHolder] = message.useMessage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 初始化数据
  useEffect(() => {
    loadMessages(1);
    updateUnreadCount();
  }, [loadMessages, updateUnreadCount]);

  // 监听错误状态
  useEffect(() => {
    if (error) {
      messageApi.error(error);
    }
  }, [error, messageApi]);

  // 加载更多留言
  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    await loadMessages(nextPage);
    setCurrentPage(nextPage);
  };

  // 删除留言
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await removeMessage(messageId);
      messageApi.success('留言删除成功');
    } catch (error) {
      messageApi.error('删除留言失败');
    }
  };

  // 刷新留言列表
  const handleRefresh = async () => {
    setCurrentPage(1);
    await refreshMessages();
    await updateUnreadCount();
    messageApi.success('刷新成功');
  };

  // 渲染留言内容，处理@用户高亮
  const renderMessageContent = (content: string) => {
    return content.replace(/@([^\s@]+)/g, '<span class="message-mention">@$1</span>');
  };

  // 渲染留言项
  const renderMessageItem = (item: Message) => {
    const isAuthor = user?.objectId === item.authorId;
    const timeAgo = formatTimeAgo(new Date(item.createdAt));

    return (
      <List.Item
        key={item.objectId}
        actions={[
          <Space key="actions">
            <Tooltip title={timeAgo}>
              <ClockCircleOutlined />
            </Tooltip>
            {isAuthor && (
              <Popconfirm
                title="确定要删除这条留言吗？"
                onConfirm={() => handleDeleteMessage(item.objectId)}
                okText="确定"
                cancelText="取消"
              >
                <Button 
                  type="text" 
                  size="small" 
                  icon={<DeleteOutlined />} 
                  danger
                />
              </Popconfirm>
            )}
          </Space>
        ]}
        className="message-item"
      >
        <List.Item.Meta
          avatar={
            <Avatar 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#1890ff' }}
            />
          }
          title={
            <Space>
              <Text strong>{item.authorName}</Text>
              <Text type="secondary" className="message-time">
                {timeAgo}
              </Text>
            </Space>
          }
          description={
            <div 
              className="message-content"
              dangerouslySetInnerHTML={{ 
                __html: renderMessageContent(item.content) 
              }}
            />
          }
        />
      </List.Item>
    );
  };

  return (
    <div className="message-board">
      {contextHolder}
      
      {/* 页面标题 */}
      <div className="page-header">
        <Space align="center">
          <Title level={2}>
            <MessageOutlined /> 留言板
          </Title>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={isLoading}
          >
            刷新
          </Button>
          <Badge count={unreadCount} size="small">
            <Button
              type="text"
              icon={<BellOutlined />}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              通知
            </Button>
          </Badge>
        </Space>
      </div>

      {/* 通知面板 */}
      {showNotifications && (
        <div className="notification-panel">
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        </div>
      )}

      {/* 留言编辑器 */}
      <Card className="message-editor-card">
        <MessageEditor />
      </Card>

      <Divider />

      {/* 留言列表 */}
      <Card className="message-list-card">
        <div className="message-list-header">
          <Title level={4}>全部留言</Title>
          <Text type="secondary">
            共 {messages.length} 条留言
          </Text>
        </div>

        {messages.length === 0 && !isLoading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无留言，快来发表第一条留言吧！"
          />
        ) : (
          <List
            className="message-list"
            dataSource={messages}
            renderItem={renderMessageItem}
            loading={isLoading}
            locale={{
              emptyText: <Empty description="暂无留言" />
            }}
          />
        )}

        {/* 加载更多按钮 */}
        {hasMore && messages.length > 0 && (
          <div className="load-more-section">
            <Button
              type="default"
              size="large"
              loading={isLoading}
              onClick={handleLoadMore}
              block
            >
              加载更多
            </Button>
          </div>
        )}

        {/* 已加载完全部留言提示 */}
        {!hasMore && messages.length > 0 && (
          <div className="no-more-section">
            <Text type="secondary">已加载完全部留言</Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MessageBoard; 