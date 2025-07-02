/**
 * 组队详情模态框组件
 */

import React from 'react';
import {
  Modal,
  Card,
  Space,
  Button,
  Tag,
  Avatar,
  List,
  Typography,
  Divider,
  message
} from 'antd';
import {
  TeamOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CrownOutlined,
  ExclamationCircleOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { TeamDetails } from '../../types/team';
import { useTeamStore } from '../../store/teams';
import { useAuthStore } from '../../store/auth';

const { Text } = Typography;
const { confirm } = Modal;

interface TeamDetailsModalProps {
  visible: boolean;
  team: TeamDetails | null;
  onCancel: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
}

/**
 * 组队详情模态框
 */
const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({
  visible,
  team,
  onCancel,
  onJoin,
  onLeave
}) => {
  const { joinTeam, leaveTeam, dissolveTeam, joining } = useTeamStore();
  const { user } = useAuthStore();

  if (!team) return null;

  /**
   * 处理加入队伍
   */
  const handleJoin = async () => {
    try {
      await joinTeam(team.objectId);
      message.success('已成功加入队伍！');
      onJoin?.();
    } catch (error) {
      message.error('加入队伍失败，请重试');
    }
  };

  /**
   * 处理离开队伍
   */
  const handleLeave = async () => {
    confirm({
      title: '确认离开队伍',
      icon: <ExclamationCircleOutlined />,
      content: '确定要离开这个队伍吗？',
      okText: '确认离开',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await leaveTeam(team.objectId);
          message.success('已离开队伍');
          onLeave?.();
        } catch (error) {
          message.error('离开队伍失败，请重试');
        }
      }
    });
  };

  /**
   * 处理解散队伍
   */
  const handleDissolve = async () => {
    confirm({
      title: '确认解散队伍',
      icon: <ExclamationCircleOutlined />,
      content: '确定要解散这个队伍吗？此操作不可撤销！',
      okText: '确认解散',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await dissolveTeam(team.objectId);
          message.success('队伍已解散');
          onCancel();
        } catch (error) {
          message.error('解散队伍失败，请重试');
        }
      }
    });
  };

  /**
   * 获取状态标签
   */
  const getStatusTag = () => {
    switch (team.status) {
      case 'open':
        return <Tag color="green">招募中</Tag>;
      case 'full':
        return <Tag color="orange">已满员</Tag>;
      case 'closed':
        return <Tag color="red">已关闭</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  /**
   * 获取操作按钮
   */
  const getActionButtons = () => {
    if (!user) return [];

    const buttons = [];

    // 如果是队长，显示解散队伍按钮
    if (team.isCurrentUserLeader) {
      buttons.push(
        <Button
          key="dissolve"
          danger
          icon={<LogoutOutlined />}
          onClick={handleDissolve}
        >
          解散队伍
        </Button>
      );
    } else if (team.isCurrentUserMember) {
      // 如果是队员，显示离开队伍按钮
      buttons.push(
        <Button
          key="leave"
          icon={<LogoutOutlined />}
          loading={joining}
          onClick={handleLeave}
        >
          离开队伍
        </Button>
      );
    } else if (team.status === 'open') {
      // 如果不是成员且队伍开放，显示加入按钮
      buttons.push(
        <Button
          key="join"
          type="primary"
          icon={<TeamOutlined />}
          loading={joining}
          onClick={handleJoin}
        >
          加入队伍
        </Button>
      );
    }

    return buttons;
  };

  return (
    <Modal
      title={
        <Space>
          <TeamOutlined />
          {team.gameName} - 组队详情
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
        ...getActionButtons()
      ]}
      width={700}
    >
      <div>
        {/* 基本信息 */}
        <Card
          size="small"
          title={
            <Space>
              <CalendarOutlined />
              活动信息
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>游戏：</Text>
              <Text>{team.gameName}</Text>
            </div>
            <div>
              <Text strong>日期：</Text>
              <Text>{team.eventDate}</Text>
            </div>
            <div>
              <Text strong>时间：</Text>
              <Space>
                <ClockCircleOutlined />
                <Text>{team.startTime} - {team.endTime}</Text>
              </Space>
            </div>
            <div>
              <Text strong>状态：</Text>
              {getStatusTag()}
            </div>
            <div>
              <Text strong>人数：</Text>
              <Text>{team.members.length} / {team.maxMembers}</Text>
            </div>
          </Space>
        </Card>

        {/* 队伍成员 */}
        <Card
          size="small"
          title={
            <Space>
              <UserOutlined />
              队伍成员 ({team.members.length}/{team.maxMembers})
            </Space>
          }
        >
          <List
            dataSource={team.memberNames.map((name, index) => ({
              name,
              id: team.members[index],
              isLeader: team.members[index] === team.leader
            }))}
            renderItem={(member) => (
              <List.Item key={member.id}>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={
                    <Space>
                      {member.name}
                      {member.isLeader && (
                        <Tag color="gold" icon={<CrownOutlined />}>
                          队长
                        </Tag>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
          
          {/* 空位显示 */}
          {team.members.length < team.maxMembers && (
            <>
              <Divider />
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Text type="secondary">
                  还有 {team.maxMembers - team.members.length} 个空位
                </Text>
              </div>
            </>
          )}
        </Card>

        {/* 创建时间 */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary">
            创建于 {new Date(team.createdAt).toLocaleString()}
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default TeamDetailsModal; 