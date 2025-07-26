/**
 * 勋章墙主组件
 * 显示用户的勋章墙，包括展示勋章和所有勋章
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Switch, 
  Typography, 
  Space, 
  Button, 
  Modal, 
  Empty, 
  Spin, 
  Tooltip,
  Divider
} from 'antd';
import { 
  TrophyOutlined, 
  PlusOutlined, 
  SettingOutlined, 
  EyeOutlined,
  EyeInvisibleOutlined,
  StarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Badge, BadgeWallData } from '../../types/badge';
import { badgeService } from '../../services/badges';
import { useAuthStore } from '../../store/auth';
import { useMessage } from '../../hooks/useMessage';
import BadgeCard from './BadgeCard';
import CreateBadgeModal from './CreateBadgeModal';

const { Title, Text, Paragraph } = Typography;

interface BadgeWallProps {
  userId: string;
  username: string;
  isOwner?: boolean; // 是否是墙的主人
}

const BadgeWall: React.FC<BadgeWallProps> = ({ 
  userId, 
  username, 
  isOwner = false 
}) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [badgeWallData, setBadgeWallData] = useState<BadgeWallData | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const message = useMessage();

  /**
   * 加载勋章墙数据
   */
  const loadBadgeWallData = async () => {
    try {
      setLoading(true);
      console.log('加载勋章墙数据...', new Date().toLocaleTimeString());
      const data = await badgeService.getUserBadgeWall(userId);
      setBadgeWallData(data);
    } catch (error) {
      message.error('加载勋章墙数据失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 切换勋章墙开关
   */
  const handleToggleEnabled = async (enabled: boolean) => {
    if (!user || !isOwner) return;

    try {
      await badgeService.updateBadgeWallSettings(userId, enabled);
      
      message.success(enabled ? '勋章墙已开启' : '勋章墙已关闭');
      loadBadgeWallData();
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  /**
   * 处理勋章更新
   */
  const handleBadgeUpdate = (updatedBadge: Badge) => {
    if (!badgeWallData) return;

    const updateBadgeInList = (badges: Badge[]) =>
      badges.map(badge => 
        badge.objectId === updatedBadge.objectId ? updatedBadge : badge
      );

    setBadgeWallData({
      ...badgeWallData,
      displayedBadges: updateBadgeInList(badgeWallData.displayedBadges),
      allBadges: updateBadgeInList(badgeWallData.allBadges)
    });
  };

  /**
   * 处理勋章删除
   */
  const handleBadgeDelete = () => {
    // 重新加载数据
    loadBadgeWallData();
  };

  /**
   * 创建勋章成功后的回调
   */
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    loadBadgeWallData();
  };

  useEffect(() => {
    loadBadgeWallData();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!badgeWallData) {
    return (
      <Card>
        <Empty description="加载失败" />
      </Card>
    );
  }

  const { settings, displayedBadges, allBadges, totalCount } = badgeWallData;

  // 如果勋章墙未开启
  if (!settings.isEnabled) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Space direction="vertical" size={16}>
            <EyeInvisibleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <div>
              <Title level={4} type="secondary">
                {isOwner ? '您的勋章墙未开启' : `${username} 的勋章墙未开启`}
              </Title>
              <Paragraph type="secondary">
                {isOwner 
                  ? '开启勋章墙，让朋友们为您添加勋章吧！' 
                  : '该用户暂未开启勋章墙功能'
                }
              </Paragraph>
            </div>
            {isOwner && (
              <Button 
                type="primary" 
                icon={<SettingOutlined />}
                onClick={() => handleToggleEnabled(true)}
              >
                开启勋章墙
              </Button>
            )}
          </Space>
        </div>
      </Card>
    );
  }

  return (
    <div>
      {/* 勋章墙设置和标题 */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space>
            <TrophyOutlined style={{ fontSize: 20, color: '#faad14' }} />
            <Title level={4} style={{ margin: 0 }}>
              {isOwner ? '我的勋章墙' : `${username} 的勋章墙`}
            </Title>
            <Text type="secondary">({totalCount} 个勋章)</Text>
          </Space>
          
          <Space>
            {/* 刷新按钮 */}
            <Tooltip title="刷新数据">
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={loadBadgeWallData}
                style={{ marginRight: 8 }}
              />
            </Tooltip>
            
            {/* 为他人添加勋章按钮 */}
            {!isOwner && user && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                送勋章
              </Button>
            )}
            
            {/* 勋章墙开关（仅墙主人可见） */}
            {isOwner && (
              <Tooltip title={settings.isEnabled ? '关闭勋章墙' : '开启勋章墙'}>
                <Switch
                  checked={settings.isEnabled}
                  onChange={handleToggleEnabled}
                  checkedChildren={<EyeOutlined />}
                  unCheckedChildren={<EyeInvisibleOutlined />}
                />
              </Tooltip>
            )}
          </Space>
        </div>

        {/* 展示的前三个勋章 */}
        {displayedBadges.length > 0 && (
          <div>
            <Title level={5} style={{ marginBottom: 16 }}>
              ⭐ 勋章展示台 {isOwner && <Text type="secondary" style={{ fontSize: '12px', fontWeight: 'normal' }}>（点击⭐按钮可选择展示的勋章）</Text>}
            </Title>
            <Row gutter={16}>
              {displayedBadges.map((badge, index) => (
                <Col xs={24} sm={8} md={8} key={badge.objectId}>
                  <div style={{ position: 'relative' }}>
                    <BadgeCard 
                      badge={badge} 
                      onUpdate={handleBadgeUpdate} 
                      onDelete={handleBadgeDelete}
                      isOwner={isOwner}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Card>

      {/* 所有勋章 */}
      {totalCount > 0 && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0 }}>
              📋 全部勋章
            </Title>
            <Button 
              type="text" 
              onClick={() => setShowAllBadges(!showAllBadges)}
            >
              {showAllBadges ? '收起' : `展开全部 (${totalCount})`}
            </Button>
          </div>
          
          {showAllBadges && (
            <Row gutter={16}>
              {allBadges.map(badge => (
                <Col xs={24} sm={12} md={8} lg={6} key={badge.objectId}>
                  <BadgeCard 
                    badge={badge} 
                    onUpdate={handleBadgeUpdate} 
                    onDelete={handleBadgeDelete}
                    isOwner={isOwner}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Card>
      )}

      {/* 空状态 */}
      {totalCount === 0 && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Space direction="vertical" size={16}>
              <TrophyOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
              <div>
                <Title level={4} type="secondary">
                  {isOwner ? '还没有勋章' : `${username} 还没有勋章`}
                </Title>
                <Paragraph type="secondary">
                  {isOwner 
                    ? '快邀请朋友为您添加第一个勋章吧！' 
                    : '快为TA添加第一个勋章吧！'
                  }
                </Paragraph>
              </div>
              {!isOwner && user && (
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  送勋章
                </Button>
              )}
            </Space>
          </div>
        </Card>
      )}

      {/* 有勋章但未选择展示的状态 */}
      {totalCount > 0 && displayedBadges.length === 0 && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Space direction="vertical" size={16}>
              <StarOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
              <div>
                <Title level={4} type="secondary">
                  {isOwner ? '还没有展示的勋章' : `${username} 还没有展示的勋章`}
                </Title>
                <Paragraph type="secondary">
                  {isOwner 
                    ? '您有勋章但还没有选择展示，点击勋章上的⭐按钮来展示您的勋章吧！' 
                    : `${username} 有勋章但还没有选择展示`
                  }
                </Paragraph>
              </div>
            </Space>
          </div>
        </Card>
      )}

      {/* 创建勋章模态框 */}
      <CreateBadgeModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
        receiverUserId={userId}
        receiverUsername={username}
      />
    </div>
  );
};

export default BadgeWall; 