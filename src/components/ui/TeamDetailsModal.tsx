/**
 * 组队详情模态框组件
 */

import React, { useState } from 'react';
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
  message,
  Alert
} from 'antd';
import {
  TeamOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CrownOutlined,
  ExclamationCircleOutlined,
  LogoutOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import { TeamDetails, JoinTeamForm } from '../../types/team';
import { useTeamStore } from '../../store/teams';
import { useAuthStore } from '../../store/auth';
import JoinTeamModal from './JoinTeamModal';

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
  const { joinTeam, joinTeamWithTime, leaveTeam, dissolveTeam, joining } = useTeamStore();
  const { user } = useAuthStore();
  const [joinModalVisible, setJoinModalVisible] = useState(false);

  if (!team) return null;

  /**
   * 打开加入队伍模态框
   */
  const handleOpenJoinModal = () => {
    setJoinModalVisible(true);
  };

  /**
   * 处理加入队伍（带个性化时间）
   */
  const handleJoinWithTime = async (joinForm: JoinTeamForm) => {
    try {
      await joinTeamWithTime(joinForm);
      setJoinModalVisible(false);
      onJoin?.();
    } catch (error) {
      throw error; // 让JoinTeamModal处理错误显示
    }
  };

  /**
   * 处理离开队伍
   */
  const handleLeave = async () => {
    // 如果用户是队长，提示队伍将被删除
    const isLeader = team.isCurrentUserLeader;
    
    confirm({
      title: isLeader ? '确认解散队伍' : '确认离开队伍',
      icon: <ExclamationCircleOutlined />,
      content: isLeader ? (
        <div>
          <p>⚠️ 您是队长，离开队伍后整个队伍将被删除。</p>
          <p>所有队员都将被自动移除。</p>
          <p>确定要继续吗？</p>
        </div>
      ) : '确定要离开这个队伍吗？',
      okText: isLeader ? '确定删除' : '确认离开',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await leaveTeam(team.objectId);
          message.success(isLeader ? '队伍已删除' : '已离开队伍');
          if (isLeader) {
            onCancel(); // 队伍删除后关闭模态框
          } else {
            onLeave?.();
          }
        } catch (error) {
          message.error('操作失败，请重试');
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

    // 如果是成员（包括队长），显示离开队伍按钮
    if (team.isCurrentUserMember) {
      buttons.push(
        <Button
          key="leave"
          icon={<LogoutOutlined />}
          loading={joining}
          onClick={handleLeave}
          danger={team.isCurrentUserLeader}
        >
          {team.isCurrentUserLeader ? '解散队伍' : '离开队伍'}
        </Button>
      );
    } else if (team.status === 'open') {
      // 如果不是成员且队伍开放，显示加入按钮
      buttons.push(
        <Button
          key="join"
          type="primary"
          icon={<ScheduleOutlined />}
          loading={joining}
          onClick={handleOpenJoinModal}
        >
          设置时间并加入
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
            dataSource={team.memberNames.map((name, index) => {
              const memberId = team.members[index];
              const memberTimeInfo = team.memberTimeInfo?.find(info => info.userId === memberId);
              
              return {
                name,
                id: memberId,
                isLeader: memberId === team.leader,
                timeInfo: memberTimeInfo
              };
            })}
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
                  description={
                    <Space direction="vertical" size={4}>
                      {member.timeInfo && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          游戏时间: {member.timeInfo.startTime} - {member.timeInfo.endTime}
                        </Text>
                      )}
                      {member.timeInfo?.joinedAt && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          <CalendarOutlined style={{ marginRight: 4 }} />
                          加入时间: {new Date(member.timeInfo.joinedAt).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
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
            创建于 {new Date(team.createdAt).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </div>

        {/* 成员时间信息展示 */}
        {team.memberTimeInfo && team.memberTimeInfo.length > 0 && (
          <Card
            size="small"
            title={
              <Space>
                <ScheduleOutlined />
                成员时间安排
              </Space>
            }
            style={{ marginTop: 16 }}
          >
            <List
              size="small"
              dataSource={team.memberTimeInfo.sort((a, b) => {
                // 队长排在最前面，其他按加入时间排序
                if (a.userId === team.leader) return -1;
                if (b.userId === team.leader) return 1;
                return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
              })}
              renderItem={(memberTime) => (
                <List.Item key={memberTime.userId}>
                  <List.Item.Meta
                    title={
                      <Space>
                        {memberTime.username}
                        {memberTime.userId === team.leader && (
                          <Tag color="gold">队长</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        <Text style={{ fontSize: '13px' }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          游戏时间: {memberTime.startTime} - {memberTime.endTime}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          <CalendarOutlined style={{ marginRight: 4 }} />
                          加入时间: {new Date(memberTime.joinedAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </div>

      {/* 加入队伍模态框 */}
      <JoinTeamModal
        visible={joinModalVisible}
        team={team}
        onCancel={() => setJoinModalVisible(false)}
        onJoin={handleJoinWithTime}
        loading={joining}
      />
    </Modal>
  );
};

export default TeamDetailsModal; 