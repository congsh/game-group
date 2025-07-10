/**
 * 勋章墙用户列表组件
 * 显示所有开启勋章墙的用户，可以点击查看详情或为其添加勋章
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Avatar, 
  Button, 
  Space, 
  Typography, 
  Empty, 
  Spin, 
  message,
  Modal,
  Badge
} from 'antd';
import { 
  UserOutlined, 
  TrophyOutlined, 
  PlusOutlined, 
  EyeOutlined 
} from '@ant-design/icons';
import { badgeService } from '../../services/badges';
import { useAuthStore } from '../../store/auth';
import BadgeWall from './BadgeWall';
import CreateBadgeModal from './CreateBadgeModal';

const { Title, Text } = Typography;

interface BadgeWallUser {
  userId: string;
  username: string;
  badgeCount: number;
}

const BadgeWallList: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<BadgeWallUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<BadgeWallUser | null>(null);
  const [wallModalVisible, setWallModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  /**
   * 加载开启勋章墙的用户列表
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await badgeService.getEnabledBadgeWallUsers();
      setUsers(userList);
    } catch (error) {
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 查看用户勋章墙
   */
  const viewUserWall = (user: BadgeWallUser) => {
    setSelectedUser(user);
    setWallModalVisible(true);
  };

  /**
   * 为用户创建勋章
   */
  const createBadgeForUser = (user: BadgeWallUser) => {
    setSelectedUser(user);
    setCreateModalVisible(true);
  };

  /**
   * 创建勋章成功回调
   */
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    loadUsers(); // 重新加载列表以更新勋章数量
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Space direction="vertical" size={16}>
            <TrophyOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <div>
              <Title level={4} type="secondary">
                暂无开启勋章墙的用户
              </Title>
              <Text type="secondary">
                快去个人中心开启您的勋章墙吧！
              </Text>
            </div>
          </Space>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <TrophyOutlined style={{ color: '#faad14' }} />
            <span>勋章墙用户</span>
            <Badge count={users.length} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
      >
        <List
          dataSource={users}
          renderItem={(wallUser) => (
            <List.Item
              actions={[
                <Button
                  key="view"
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => viewUserWall(wallUser)}
                >
                  查看
                </Button>,
                user && user.objectId !== wallUser.userId && (
                  <Button
                    key="add"
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => createBadgeForUser(wallUser)}
                  >
                    送勋章
                  </Button>
                )
              ].filter(Boolean)}
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
                    <Text strong>{wallUser.username}</Text>
                    {user && user.objectId === wallUser.userId && (
                      <Badge 
                        count="我" 
                        style={{ 
                          backgroundColor: '#52c41a',
                          fontSize: '10px'
                        }} 
                      />
                    )}
                  </Space>
                }
                description={
                  <Space>
                    <TrophyOutlined style={{ color: '#faad14', fontSize: '12px' }} />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {wallUser.badgeCount} 个勋章
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 位用户开启了勋章墙`
          }}
        />
      </Card>

      {/* 勋章墙详情模态框 */}
      <Modal
        title={`${selectedUser?.username} 的勋章墙`}
        open={wallModalVisible}
        onCancel={() => setWallModalVisible(false)}
        footer={null}
        width={800}
        bodyStyle={{ padding: 0 }}
      >
        {selectedUser && (
          <div style={{ padding: 24 }}>
            <BadgeWall
              userId={selectedUser.userId}
              username={selectedUser.username}
              isOwner={user?.objectId === selectedUser.userId}
            />
          </div>
        )}
      </Modal>

      {/* 创建勋章模态框 */}
      {selectedUser && (
        <CreateBadgeModal
          visible={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          onSuccess={handleCreateSuccess}
          receiverUserId={selectedUser.userId}
          receiverUsername={selectedUser.username}
        />
      )}
    </div>
  );
};

export default BadgeWallList; 