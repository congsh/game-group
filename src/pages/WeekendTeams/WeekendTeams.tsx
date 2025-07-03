/**
 * 周末组队页面
 * 用户可以在此页面创建、查看和加入周末游戏组队
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  Space,
  Empty,
  Spin,
  Alert,
  message,
  Select,
  Modal
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  CalendarOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import { useTeamStore } from '../../store/teams';
import { TeamDetails } from '../../types/team';
import { initWeekendTeamTable } from '../../utils/initData';
import PageHeader from '../../components/common/PageHeader';
import CreateTeamModal from '../../components/ui/CreateTeamModal';
import TeamDetailsModal from '../../components/ui/TeamDetailsModal';
import JoinTeamModal from '../../components/ui/JoinTeamModal';


const { Option } = Select;

/**
 * 周末组队页面组件
 */
const WeekendTeams: React.FC = () => {
  const {
    teams,
    loading,
    fetchTeams,
    joinTeam,
    joinTeamWithTime,
    leaveTeam,
    joining,
    error,
    clearError,
    setFilters,
    filters
  } = useTeamStore();

  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetails | null>(null);

  /**
   * 初始化页面数据
   */
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  /**
   * 处理查看详情
   */
  const handleViewDetails = (team: TeamDetails) => {
    setSelectedTeam(team);
    setDetailsModalVisible(true);
  };

  /**
   * 打开加入队伍模态框
   */
  const handleOpenJoinModal = (team: TeamDetails) => {
    setSelectedTeam(team);
    setJoinModalVisible(true);
  };

  /**
   * 处理加入队伍（带个性化时间）
   */
  const handleJoinTeamWithTime = async (joinForm: any) => {
    try {
      await joinTeamWithTime(joinForm);
      setJoinModalVisible(false);
      setSelectedTeam(null);
      message.success('已成功加入队伍！');
    } catch (error) {
      throw error; // 让JoinTeamModal处理错误显示
    }
  };

  /**
   * 处理离开队伍
   */
  const handleLeaveTeam = async (team: TeamDetails) => {
    // 如果用户是队长，提示队伍将被删除
    if (team.isCurrentUserLeader) {
      Modal.confirm({
        title: '确认离开队伍',
        content: (
          <div>
            <p>⚠️ 您是队长，离开队伍后整个队伍将被删除。</p>
            <p>所有队员都将被自动移除。</p>
            <p>确定要继续吗？</p>
          </div>
        ),
        okText: '确定删除',
        cancelText: '取消',
        okType: 'danger',
        onOk: async () => {
          try {
            await leaveTeam(team.objectId);
            message.success('队伍已删除');
          } catch (error) {
            message.error('操作失败，请重试');
          }
        }
      });
    } else {
      // 普通成员离开
      try {
        await leaveTeam(team.objectId);
        message.success('已离开队伍');
      } catch (error) {
        message.error('离开队伍失败，请重试');
      }
    }
  };

  /**
   * 处理排序变化
   */
  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(':');
    setFilters({ 
      ...filters, 
      sortBy: sortBy as any, 
      sortOrder: sortOrder as any 
    });
  };

  /**
   * 手动修复组队数据表
   */
  const handleManualFixTeams = async () => {
    try {
      message.loading('正在修复组队数据表...', 0);
      await initWeekendTeamTable();
      message.destroy();
      message.success('组队数据表修复成功！');
      // 重新加载数据
      fetchTeams();
    } catch (error) {
      message.destroy();
      message.error('组队数据表修复失败，请重试');
      console.error('修复失败:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 400 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <PageHeader
        title="游戏组队"
        subtitle="创建或加入游戏组队，随时享受多人游戏的乐趣！"
        icon={<TeamOutlined />}
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setCreateModalVisible(true)}
          >
            创建组队
          </Button>
        }
      />

      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <CalendarOutlined />
              <span>游戏组队活动</span>
            </Space>
          </Col>
          <Col>
            <Space>
              <SortAscendingOutlined />
              <span>排序：</span>
              <Select
                style={{ width: 140 }}
                placeholder="选择排序方式"
                value={filters.sortBy ? `${filters.sortBy}:${filters.sortOrder || 'desc'}` : undefined}
                onChange={handleSortChange}
                allowClear
              >
                <Option value="createdAt:desc">🆕 最新创建</Option>
                <Option value="memberCount:desc">👥 人数最多</Option>
                <Option value="memberCount:asc">👤 人数最少</Option>
                <Option value="startTime:asc">⏰ 时间最早</Option>
                <Option value="startTime:desc">⏰ 时间最晚</Option>
                <Option value="eventDate:asc">📅 日期最近</Option>
                <Option value="eventDate:desc">📅 日期最远</Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </div>

      {error && (
        <Alert
          message="错误"
          description={
            <div>
              <div>{error}</div>
              {error.includes('doesn\'t exists') && (
                <div style={{ marginTop: 8 }}>
                  <Button 
                    size="small" 
                    type="primary" 
                    onClick={handleManualFixTeams}
                  >
                    点击修复组队数据表
                  </Button>
                </div>
              )}
            </div>
          }
          type="error"
          showIcon
          closable
          onClose={clearError}
          style={{ marginBottom: 16 }}
        />
      )}

      {teams.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无组队活动"
          >
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建第一个组队
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {teams.map(team => (
            <Col xs={24} sm={12} lg={8} key={team.objectId}>
              <Card
                title={team.gameName}
                extra={
                  <span style={{ color: team.status === 'open' ? '#52c41a' : '#faad14' }}>
                    {team.status === 'open' ? '招募中' : '已满员'}
                  </span>
                }
                actions={[
                  <Button 
                    type="link" 
                    key="view"
                    onClick={() => handleViewDetails(team)}
                  >
                    查看详情
                  </Button>,
                  team.status === 'open' && !team.isCurrentUserMember ? (
                    <Button 
                      type="primary" 
                      key="join"
                      loading={joining}
                      onClick={() => handleOpenJoinModal(team)}
                    >
                      设置时间并加入
                    </Button>
                  ) : team.isCurrentUserMember ? (
                    <Button 
                      key="leave" 
                      onClick={() => handleLeaveTeam(team)}
                      loading={joining}
                      type={team.isCurrentUserLeader ? "default" : "default"}
                      danger={team.isCurrentUserLeader}
                    >
                      {team.isCurrentUserLeader ? '解散队伍' : '离开队伍'}
                    </Button>
                  ) : (
                    <Button key="full" disabled>
                      已满员
                    </Button>
                  )
                ]}
              >
                <div>
                  <p><strong>队长：</strong>{team.leaderName}</p>
                  <p><strong>时间：</strong>{team.eventDate} {team.startTime}-{team.endTime}</p>
                  <p><strong>人数：</strong>{team.members.length}/{team.maxMembers}</p>
                  {team.memberTimeInfo && team.memberTimeInfo.length > 1 && (
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                      <CalendarOutlined style={{ marginRight: '4px' }} />
                      最新加入: {(() => {
                        // 找到最后加入的非队长成员
                        const nonLeaderMembers = team.memberTimeInfo
                          .filter(member => member.userId !== team.leader)
                          .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
                        
                        if (nonLeaderMembers.length > 0) {
                          const latestMember = nonLeaderMembers[0];
                          const joinTime = new Date(latestMember.joinedAt);
                          const now = new Date();
                          const timeDiff = now.getTime() - joinTime.getTime();
                          const minutesDiff = Math.floor(timeDiff / (1000 * 60));
                          const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
                          const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                          
                          let timeAgo = '';
                          if (daysDiff > 0) {
                            timeAgo = `${daysDiff}天前`;
                          } else if (hoursDiff > 0) {
                            timeAgo = `${hoursDiff}小时前`;
                          } else if (minutesDiff > 0) {
                            timeAgo = `${minutesDiff}分钟前`;
                          } else {
                            timeAgo = '刚刚';
                          }
                          
                          return `${latestMember.username} (${timeAgo})`;
                        }
                        return '队长创建';
                      })()}
                    </p>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 创建组队模态框 */}
      <CreateTeamModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          // 创建成功后刷新列表
          fetchTeams();
        }}
      />

      {/* 组队详情模态框 */}
      <TeamDetailsModal
        visible={detailsModalVisible}
        team={selectedTeam}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedTeam(null);
        }}
        onJoin={() => {
          // 加入成功后刷新列表
          fetchTeams();
        }}
        onLeave={() => {
          // 离开成功后刷新列表
          fetchTeams();
        }}
      />

      {/* 加入组队模态框 */}
      <JoinTeamModal
        visible={joinModalVisible}
        team={selectedTeam}
        onCancel={() => {
          setJoinModalVisible(false);
          setSelectedTeam(null);
        }}
        onJoin={handleJoinTeamWithTime}
        loading={joining}
      />
    </div>
  );
};

export default WeekendTeams; 