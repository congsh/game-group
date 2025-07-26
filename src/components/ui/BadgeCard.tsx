/**
 * 勋章卡片组件
 * 显示单个勋章的信息，包括标题、描述、颜色等，支持点赞功能
 */

import React from 'react';
import { Card, Avatar, Typography, Space, Button, Popconfirm, Switch, Tooltip } from 'antd';
import { 
  LikeOutlined, 
  LikeFilled, 
  TrophyOutlined, 
  DeleteOutlined, 
  StarOutlined,
  StarFilled 
} from '@ant-design/icons';
import { Badge } from '../../types/badge';
import { badgeService } from '../../services/badges';
import { useAuthStore } from '../../store/auth';
import { useMessage } from '../../hooks/useMessage';

const { Text, Paragraph } = Typography;

interface BadgeCardProps {
  badge: Badge;
  showActions?: boolean;
  isOwner?: boolean; // 是否是勋章墙的主人
  onUpdate?: (updatedBadge: Badge) => void;
  onDelete?: () => void;
}

const BadgeCard: React.FC<BadgeCardProps> = ({ 
  badge, 
  showActions = true,
  isOwner = false,
  onUpdate,
  onDelete
}) => {
  const { user } = useAuthStore();
  const message = useMessage();
  const isLiked = user ? badge.likedBy.includes(user.objectId) : false;
  const isCreator = user?.objectId === badge.giverUserId;

  /**
   * 处理点赞/取消点赞
   */
  const handleLike = async () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }

    try {
      const action = isLiked ? 'unlike' : 'like';
      const updatedBadge = await badgeService.toggleBadgeLike(
        { badgeId: badge.objectId, action },
        user.objectId
      );
      
      message.success(action === 'like' ? '点赞成功' : '取消点赞');
      onUpdate?.(updatedBadge);
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  /**
   * 处理删除勋章
   */
  const handleDelete = async () => {
    if (!user || !isCreator) {
      message.warning('只有创建者可以删除勋章');
      return;
    }

    try {
      await badgeService.deleteBadge(badge.objectId);
      message.success('勋章删除成功');
      onDelete?.();
    } catch (error) {
      message.error('删除失败，请重试');
    }
  };

  /**
   * 处理展示台切换
   */
  const handleToggleDisplay = async (checked: boolean) => {
    if (!user || !isOwner) {
      message.warning('只有勋章墙主人可以设置展示');
      return;
    }

    try {
      const updatedBadge = await badgeService.toggleBadgeDisplay(badge.objectId, checked);
      message.success(checked ? '已添加到展示台' : '已从展示台移除');
      onUpdate?.(updatedBadge);
    } catch (error) {
      message.error('设置失败，请重试');
    }
  };

  // 获取勋章图标
  const getBadgeIcon = (icon?: string) => {
    switch (icon) {
      case 'trophy':
        return <TrophyOutlined />;
      case 'star':
        return '⭐';
      case 'heart':
        return '❤️';
      case 'fire':
        return '🔥';
      case 'crown':
        return '👑';
      case 'gem':
        return '💎';
      default:
        return <TrophyOutlined />;
    }
  };

  // 构建操作按钮
  const actions = [];
  
  if (showActions) {
    // 点赞按钮
    actions.push(
      <Button
        key="like"
        type="text"
        icon={isLiked ? <LikeFilled style={{ color: '#1890ff' }} /> : <LikeOutlined />}
        onClick={handleLike}
        style={{ 
          color: isLiked ? '#1890ff' : undefined,
          border: 'none',
          boxShadow: 'none'
        }}
      >
        {badge.likes}
      </Button>
    );

    // 展示台切换按钮（仅勋章墙主人可见）
    if (isOwner) {
      actions.push(
        <Tooltip key="display" title={badge.isDisplayed ? '从展示台移除' : '添加到展示台'}>
          <Button
            type="text"
            icon={badge.isDisplayed ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            onClick={() => handleToggleDisplay(!badge.isDisplayed)}
            style={{ 
              color: badge.isDisplayed ? '#faad14' : undefined,
              border: 'none',
              boxShadow: 'none'
            }}
          />
        </Tooltip>
      );
    }

    // 删除按钮（仅创建者可见）
    if (isCreator) {
      actions.push(
        <Popconfirm
          key="delete"
          title="确定要删除这个勋章吗？"
          description="删除后无法恢复"
          onConfirm={handleDelete}
          okText="确定"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            icon={<DeleteOutlined />}
            danger
            style={{ 
              border: 'none',
              boxShadow: 'none'
            }}
          />
        </Popconfirm>
      );
    }
  }

  return (
    <Card
      size="small"
      hoverable
      style={{ marginBottom: 16 }}
      actions={actions.length > 0 ? actions : undefined}
    >
      <Card.Meta
        avatar={
          <Avatar
            style={{ 
              backgroundColor: badge.color || '#1890ff',
              color: '#fff'
            }}
            icon={getBadgeIcon(badge.icon)}
          />
        }
        title={
          <Space>
            <Text strong style={{ fontSize: '14px' }}>
              {badge.title}
            </Text>
            {badge.isDisplayed && (
              <StarFilled style={{ color: '#faad14', fontSize: '12px' }} />
            )}
          </Space>
        }
        description={
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Paragraph 
              ellipsis={{ rows: 2, tooltip: badge.description }}
              style={{ margin: 0, fontSize: '12px', color: '#666' }}
            >
              {badge.description}
            </Paragraph>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              来自: {badge.giverUsername}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {new Date(badge.createdAt).toLocaleDateString('zh-CN')}
            </Text>
          </Space>
        }
      />
    </Card>
  );
};

export default BadgeCard; 