/**
 * 报表页面主组件
 * 提供数据统计和可视化报表功能
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Space,
  Button,
  Tabs,
  Spin,
  message,
  Typography,
  Statistic,
  Alert
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  ReloadOutlined,
  HeartOutlined,
  TrophyOutlined,
  TeamOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';
import {
  getGameFavoriteReport,
  getVoteReport,
  getTeamReport
} from '../../services/reports';
import type {
  GameFavoriteReport,
  VoteReport,
  TeamReport,
  ReportQuery,
  TimeRange
} from '../../types/report';
import PageHeader from '../../components/common/PageHeader';
import {
  ChartWrapper,
  createBarChartOption,
  createLineChartOption,
  createPieChartOption,
  createMultiBarChartOption
} from '../../components/common/ChartWrapper';
import { ExportButton } from '../../components/common/ExportButton';
import './Reports.css';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

/**
 * 报表页面组件
 */
const Reports: React.FC = () => {
  // 时间范围状态
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [customDateRange, setCustomDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  
  // 报表数据状态
  const [gameFavoriteReport, setGameFavoriteReport] = useState<GameFavoriteReport | null>(null);
  const [voteReport, setVoteReport] = useState<VoteReport | null>(null);
  const [teamReport, setTeamReport] = useState<TeamReport | null>(null);
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('favorite');

  /**
   * 获取查询参数
   */
  const getReportQuery = (): ReportQuery => {
    if (customDateRange) {
      return {
        startDate: customDateRange[0].format('YYYY-MM-DD'),
        endDate: customDateRange[1].format('YYYY-MM-DD'),
        timeRange
      };
    }

    const endDate = dayjs();
    let startDate = dayjs();

    switch (timeRange) {
      case 'week':
        startDate = endDate.subtract(7, 'days');
        break;
      case 'month':
        startDate = endDate.subtract(1, 'month');
        break;
      case 'quarter':
        startDate = endDate.subtract(3, 'months');
        break;
      case 'year':
        startDate = endDate.subtract(1, 'year');
        break;
    }

    return {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      timeRange
    };
  };

  /**
   * 加载报表数据
   */
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const query = getReportQuery();
      
      // 并行加载所有报表数据
      const [favoriteData, voteData, teamData] = await Promise.all([
        getGameFavoriteReport(query),
        getVoteReport(query),
        getTeamReport(query)
      ]);

      setGameFavoriteReport(favoriteData);
      setVoteReport(voteData);
      setTeamReport(teamData);
    } catch (error) {
      console.error('加载报表数据失败:', error);
      message.error('加载报表数据失败，请重试');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, customDateRange]);

  /**
   * 处理时间范围变化
   */
  const handleTimeRangeChange = (value: TimeRange) => {
    setTimeRange(value);
    setCustomDateRange(null); // 清除自定义日期范围
  };

  /**
   * 处理自定义日期范围变化
   */
  const handleCustomDateRangeChange: RangePickerProps['onChange'] = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setCustomDateRange([dates[0], dates[1]]);
    } else {
      setCustomDateRange(null);
    }
  };

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    loadReports();
  };

  /**
   * 初始化加载数据
   */
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  /**
   * 渲染游戏收藏报表
   */
  const renderGameFavoriteReport = () => {
    if (!gameFavoriteReport) return null;

    const {
      topFavoriteGames,
      userFavoriteDistribution,
      favoriteTrend,
      summary
    } = gameFavoriteReport;

    return (
      <div className="report-section">
        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="游戏总数"
                value={summary.totalGames}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="收藏总数"
                value={summary.totalFavorites}
                prefix={<HeartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="平均收藏数"
                value={summary.averageFavoritesPerGame}
                precision={1}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="最受欢迎"
                value={summary.mostFavoritedGame}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <ChartWrapper
              key="favorite-games-bar"
              title="游戏收藏排行榜"
              option={createBarChartOption(
                topFavoriteGames.slice(0, 8),
                'gameName',
                'favoriteCount'
              )}
              height={350}
              loading={loading}
            />
          </Col>
          <Col xs={24} lg={12}>
            <ChartWrapper
              key="favorite-distribution-pie"
              title="用户收藏数量分布"
              option={createPieChartOption(
                userFavoriteDistribution,
                'range',
                'userCount'
              )}
              height={350}
              loading={loading}
            />
          </Col>
          <Col xs={24}>
            <ChartWrapper
              key="favorite-trend-line"
              title="收藏趋势（最近30天）"
              option={createLineChartOption(
                favoriteTrend,
                'date',
                'count'
              )}
              height={300}
              loading={loading}
            />
          </Col>
        </Row>

        {/* 导出按钮 */}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <ExportButton
              data={topFavoriteGames}
              filename="游戏收藏排行榜"
              sheetName="收藏排行"
              buttonText="导出收藏数据"
            />
          </Space>
        </div>
      </div>
    );
  };

  /**
   * 渲染每日投票报表
   */
  const renderVoteReport = () => {
    if (!voteReport) return null;

    const {
      participationStats,
      topVotedGames,
      userActivity
    } = voteReport;

    return (
      <div className="report-section">
        {/* 参与度统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总投票数"
                value={participationStats.reduce((sum, stat) => sum + stat.totalVotes, 0)}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="想玩人次"
                value={participationStats.reduce((sum, stat) => sum + stat.wantToPlayCount, 0)}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="平均参与率"
                value={participationStats.length > 0 ? 
                  (participationStats.reduce((sum, stat) => sum + stat.participationRate, 0) / participationStats.length * 100) : 0
                }
                precision={1}
                suffix="%"
                prefix={<LineChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="活跃用户"
                value={userActivity.length}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <ChartWrapper
              key="vote-games-bar"
              title="游戏得票排行榜"
              option={createBarChartOption(
                topVotedGames.slice(0, 8),
                'gameName',
                'totalVotes'
              )}
              height={350}
              loading={loading}
            />
          </Col>
          <Col xs={24} lg={12}>
            <ChartWrapper
              key="vote-users-bar"
              title="用户投票活跃度"
              option={createBarChartOption(
                userActivity.slice(0, 8),
                'username',
                'voteDays'
              )}
              height={350}
              loading={loading}
            />
          </Col>
          <Col xs={24}>
            <ChartWrapper
              key="vote-trend-multi"
              title="投票参与趋势"
              option={createMultiBarChartOption(
                participationStats.slice(-30), // 最近30天
                'date',
                [
                  { field: 'totalVotes', name: '总投票数', color: '#1890ff' },
                  { field: 'wantToPlayCount', name: '想玩人数', color: '#52c41a' }
                ]
              )}
              height={300}
              loading={loading}
            />
          </Col>
        </Row>

        {/* 导出按钮 */}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <ExportButton
              data={topVotedGames}
              filename="游戏投票统计"
              sheetName="投票统计"
              buttonText="导出投票数据"
            />
          </Space>
        </div>
      </div>
    );
  };

  /**
   * 渲染周末组队报表
   */
  const renderTeamReport = () => {
    if (!teamReport) return null;

    const {
      teamStats,
      gamePopularity,
      timeDistribution,
      teamTrend
    } = teamReport;

    return (
      <div className="report-section">
        {/* 组队统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="组队总数"
                value={teamStats.totalTeams}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="参与人次"
                value={teamStats.totalParticipants}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="平均队伍规模"
                value={teamStats.averageTeamSize}
                precision={1}
                prefix={<LineChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="完成率"
                value={teamStats.completionRate * 100}
                precision={1}
                suffix="%"
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <ChartWrapper
              key="team-games-bar"
              title="游戏组队热度"
              option={createBarChartOption(
                gamePopularity.slice(0, 8),
                'gameName',
                'teamCount'
              )}
              height={350}
              loading={loading}
            />
          </Col>
          <Col xs={24} lg={12}>
            <ChartWrapper
              key="team-time-pie"
              title="时间段分布"
              option={createPieChartOption(
                timeDistribution,
                'timeSlot',
                'teamCount'
              )}
              height={350}
              loading={loading}
            />
          </Col>
          <Col xs={24}>
            <ChartWrapper
              key="team-trend-multi"
              title="组队趋势（按周统计）"
              option={createMultiBarChartOption(
                teamTrend.slice(-12), // 最近12周
                'weekStart',
                [
                  { field: 'teamCount', name: '组队数量', color: '#1890ff' },
                  { field: 'participantCount', name: '参与人数', color: '#52c41a' }
                ]
              )}
              height={300}
              loading={loading}
            />
          </Col>
        </Row>

        {/* 导出按钮 */}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <ExportButton
              data={gamePopularity}
              filename="组队统计报表"
              sheetName="组队统计"
              buttonText="导出组队数据"
            />
          </Space>
        </div>
      </div>
    );
  };

  return (
    <div className="reports-page">
      <PageHeader
        title="数据报表"
        subtitle="全面的游戏平台数据统计和分析"
        icon={<BarChartOutlined />}
      />

      {/* 时间范围选择器 */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <div>
                <Text strong>时间范围：</Text>
                <Select
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  style={{ width: 120, marginLeft: 8 }}
                >
                  <Option value="week">最近一周</Option>
                  <Option value="month">最近一月</Option>
                  <Option value="quarter">最近一季</Option>
                  <Option value="year">最近一年</Option>
                </Select>
              </div>
              <div>
                <Text strong>自定义范围：</Text>
                <RangePicker
                  value={customDateRange}
                  onChange={handleCustomDateRangeChange}
                  style={{ marginLeft: 8 }}
                  placeholder={['开始日期', '结束日期']}
                  format="YYYY-MM-DD"
                />
              </div>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新数据
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 报表标签页 */}
      <Spin spinning={loading}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
          destroyInactiveTabPane={false}
        >
          <TabPane
            tab={
              <span>
                <HeartOutlined />
                游戏收藏情况
              </span>
            }
            key="favorite"
            forceRender={false}
          >
            {activeTab === 'favorite' && renderGameFavoriteReport()}
          </TabPane>
          <TabPane
            tab={
              <span>
                <TrophyOutlined />
                每日投票情况
              </span>
            }
            key="vote"
            forceRender={false}
          >
            {activeTab === 'vote' && renderVoteReport()}
          </TabPane>
          <TabPane
            tab={
              <span>
                <TeamOutlined />
                周末组队情况
              </span>
            }
            key="team"
            forceRender={false}
          >
            {activeTab === 'team' && renderTeamReport()}
          </TabPane>
        </Tabs>
      </Spin>

      {/* 数据说明 */}
      <Alert
        message="数据说明"
        description="报表数据基于选定的时间范围进行统计。自定义时间范围会覆盖预设范围。数据每小时更新一次，如需最新数据请点击刷新按钮。"
        type="info"
        showIcon
        style={{ marginTop: 24 }}
      />
    </div>
  );
};

export default Reports; 