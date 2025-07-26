/**
 * 勋章墙页面
 * 展示所有开启勋章墙的用户，用户可以查看和为他人添加勋章
 */

import React, { useState } from 'react';
import { Card, Typography, Space, Tabs, Divider } from 'antd';
import { TrophyOutlined, TeamOutlined } from '@ant-design/icons';
import BadgeWallList from '../../components/ui/BadgeWallList';
import BadgeWall from '../../components/ui/BadgeWall';
import { useAuthStore } from '../../store/auth';
import './BadgeWalls.css';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const BadgeWalls: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="badge-walls-page">
      {/* 页面头部 */}
      <Card className="page-header">
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Space>
              <TrophyOutlined style={{ fontSize: 32, color: '#faad14' }} />
              <Title level={2} style={{ margin: 0 }}>
                勋章墙
              </Title>
            </Space>
          </div>
          
          <Paragraph style={{ textAlign: 'center', marginBottom: 0 }}>
            在这里您可以查看所有开启勋章墙的用户，为他们添加勋章或者查看他们的勋章收藏。
            勋章是对用户在游戏中表现的认可和鼓励！
          </Paragraph>
        </Space>
      </Card>

      {/* 主要内容 */}
      <Card style={{ marginTop: 16 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 所有用户的勋章墙 */}
          <TabPane 
            tab={
              <span>
                <TeamOutlined />
                所有勋章墙
              </span>
            } 
            key="all"
          >
            <BadgeWallList />
          </TabPane>

          {/* 我的勋章墙 */}
          {user && (
            <TabPane 
              tab={
                <span>
                  <TrophyOutlined />
                  我的勋章墙
                </span>
              } 
              key="mine"
            >
              <BadgeWall
                userId={user.objectId}
                username={user.username}
                isOwner={true}
              />
            </TabPane>
          )}
        </Tabs>
      </Card>

      {/* 使用说明 */}
      <Card 
        title="使用说明" 
        style={{ marginTop: 16 }}
        size="small"
      >
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <p><strong>🏆 关于勋章墙：</strong></p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li>勋章墙是展示用户获得勋章的地方</li>
            <li>用户可以在个人中心开启或关闭勋章墙功能</li>
            <li>开启勋章墙后，其他用户可以为您添加勋章</li>
            <li>勋章墙主人可以选择哪些勋章在展示台显示</li>
          </ul>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <p><strong>🎖️ 如何使用：</strong></p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li>点击"查看"按钮可以查看用户的完整勋章墙</li>
            <li>点击"送勋章"按钮可以为用户创建新勋章</li>
            <li>点击勋章上的👍按钮可以为勋章点赞</li>
            <li>勋章创建者可以点击🗑️按钮删除自己创建的勋章</li>
            <li>勋章墙主人可以点击⭐按钮选择展示台勋章</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default BadgeWalls; 