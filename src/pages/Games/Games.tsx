/**
 * 游戏库页面
 * 优化版：现代化界面设计和用户体验
 */

import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Input,
  Select,
  Button,
  Space,
  Pagination,
  Empty,
  Spin,
  message,
  Modal,
  Form,
  InputNumber,
  Typography,
  Tag,
  Tooltip,
  Dropdown,
  Avatar,
  Progress,
  Badge,
  Statistic
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HeartOutlined,
  HeartFilled,
  ImportOutlined,
  FilterOutlined,
  DownOutlined,
  DatabaseOutlined,
  RocketOutlined,
  LikeFilled,
  StarFilled,
  ThunderboltFilled,
  UserOutlined,
  TeamOutlined,
  ClearOutlined,
  SortAscendingOutlined,
  AppstoreAddOutlined
} from '@ant-design/icons';
import { useGameStore } from '../../store/games';
import { useAuthStore } from '../../store/auth';
import type { Game, GameForm as GameFormType } from '../../types/game';

import { BatchImportModal } from '../../components/ui/BatchImportModal';
import PageHeader from '../../components/common/PageHeader';
import './Games.css';

const { Search } = Input;
const { Option } = Select;
const { Text, Title } = Typography;
const { Meta } = Card;

/**
 * 热度指示器组件
 */
const HotScore: React.FC<{ score: number }> = ({ score }) => {
  const getHotLevel = (score: number) => {
    if (score >= 4) return { level: 'hot', color: '#ff4d4f', icon: '🔥' };
    if (score >= 3) return { level: 'warm', color: '#fa8c16', icon: '⭐' };
    if (score >= 2) return { level: 'normal', color: '#52c41a', icon: '👍' };
    return { level: 'cold', color: '#8c8c8c', icon: '💤' };
  };
  
  const hot = getHotLevel(score);
  
  return (
    <Tooltip title={`热度分数: ${score.toFixed(1)}`}>
      <Badge 
        count={hot.icon} 
        style={{ 
          backgroundColor: hot.color,
          fontSize: '10px',
          minWidth: '20px',
          height: '20px',
          lineHeight: '20px'
        }}
      />
    </Tooltip>
  );
};

/**
 * 游戏卡片组件 - 优化版
 */
const GameCard: React.FC<{
  game: Game;
  isFavorite: boolean;
  onEdit: (game: Game) => void;
  onDelete: (game: Game) => void;
  onToggleFavorite: (gameId: string) => void;
  onLike: (gameId: string) => void;
  canEdit: boolean;
}> = ({ game, isFavorite, onEdit, onDelete, onToggleFavorite, onLike, canEdit }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Card
      className={`game-card-modern ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      cover={
        <div className="game-card-header">
          <div className="game-card-avatar">
            <Avatar 
              size={48} 
              icon={<RocketOutlined />}
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
            />
          </div>
          <div className="game-card-hot">
            <HotScore score={game.hotScore || 0} />
          </div>
        </div>
      }
      actions={[
        <Tooltip title={isFavorite ? '取消收藏' : '添加收藏'} key="favorite">
          <Button
            type="text"
            icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
            onClick={() => onToggleFavorite(game.objectId)}
            className="game-action-btn"
          />
        </Tooltip>,
        <Tooltip title="点赞" key="like">
          <Button
            type="text"
            onClick={() => onLike(game.objectId)}
            className="game-action-btn"
          >
            <LikeFilled style={{ color: '#52c41a', marginRight: 4 }} />
            {game.likeCount}
          </Button>
        </Tooltip>,
        ...(canEdit ? [
          <Tooltip title="编辑" key="edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(game)}
              className="game-action-btn"
            />
          </Tooltip>,
          <Tooltip title="删除" key="delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(game)}
              className="game-action-btn"
            />
          </Tooltip>
        ] : [])
      ]}
    >
      <Meta
        title={
          <div className="game-title-modern">
            <Text strong className="game-name">{game.name}</Text>
            <div className="game-tags">
              {game.platform && (
                <Tag color="blue" className="game-tag">
                  {game.platform}
                </Tag>
              )}
              {game.type && (
                <Tag color="green" className="game-tag">
                  {game.type}
                </Tag>
              )}
            </div>
          </div>
        }
        description={
          <div className="game-description-modern">
            <div className="game-stats">
              <div className="game-stat">
                <UserOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                <Text type="secondary">
                  {game.minPlayers === game.maxPlayers 
                    ? `${game.minPlayers} 人` 
                    : `${game.minPlayers}-${game.maxPlayers} 人`}
                </Text>
              </div>
              {game.favoriteCount !== undefined && (
                <div className="game-stat">
                  <HeartFilled style={{ marginRight: 4, color: '#ff4d4f' }} />
                  <Text type="secondary">{game.favoriteCount}</Text>
                </div>
              )}
            </div>
            {game.description && (
              <div className="game-desc-modern">
                <Text ellipsis={{ tooltip: game.description }} type="secondary">
                  {game.description}
                </Text>
              </div>
            )}
          </div>
        }
      />
    </Card>
  );
};

/**
 * 游戏表单组件 - 优化版
 */
const GameForm: React.FC<{
  visible: boolean;
  game?: Game;
  onSubmit: (values: GameFormType) => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ visible, game, onSubmit, onCancel, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && game) {
      form.setFieldsValue({
        name: game.name,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        platform: game.platform,
        type: game.type,
        description: game.description
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, game, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RocketOutlined style={{ color: '#1890ff' }} />
          {game ? '编辑游戏' : '添加游戏'}
        </div>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
      className="game-form-modal"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          minPlayers: 1,
          maxPlayers: 4
        }}
      >
        <Form.Item
          name="name"
          label="游戏名称"
          rules={[
            { required: true, message: '请输入游戏名称' },
            { max: 100, message: '游戏名称不能超过100个字符' }
          ]}
        >
          <Input placeholder="请输入游戏名称" size="large" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="minPlayers"
              label="最少人数"
              rules={[
                { required: true, message: '请输入最少人数' },
                { type: 'number', min: 1, message: '最少人数不能小于1' }
              ]}
            >
              <InputNumber min={1} max={100} style={{ width: '100%' }} size="large" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="maxPlayers"
              label="最多人数"
              rules={[
                { required: true, message: '请输入最多人数' },
                { type: 'number', min: 1, message: '最多人数不能小于1' }
              ]}
            >
              <InputNumber min={1} max={100} style={{ width: '100%' }} size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="platform"
          label="游戏平台"
        >
          <Input placeholder="如：PC、PS5、Switch 等" size="large" />
        </Form.Item>

        <Form.Item
          name="type"
          label="游戏类型"
        >
          <Input placeholder="如：策略、射击、角色扮演 等" size="large" />
        </Form.Item>

        <Form.Item
          name="description"
          label="游戏描述"
        >
          <Input.TextArea
            rows={4}
            placeholder="请描述游戏的特色、玩法等..."
            maxLength={500}
            showCount
            size="large"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/**
 * 精美的空状态组件
 */
const EmptyState: React.FC<{
  onAddGame: () => void;
  onBatchImport: () => void;
  onInitSample: () => void;
  initLoading: boolean;
}> = ({ onAddGame, onBatchImport, onInitSample, initLoading }) => {
  return (
    <div className="games-empty-state">
      <div className="empty-illustration">
        <div className="empty-icon">
          <RocketOutlined />
        </div>
        <div className="empty-planets">
          <div className="planet planet-1"></div>
          <div className="planet planet-2"></div>
          <div className="planet planet-3"></div>
        </div>
      </div>
      
      <div className="empty-content">
        <Title level={3} className="empty-title">
          探索游戏宇宙 🚀
        </Title>
        <Text className="empty-subtitle">
          这里还没有游戏数据，让我们一起创建一个精彩的游戏库吧！
        </Text>
        
        <div className="empty-tip">
          <div className="tip-icon">💡</div>
          <div className="tip-content">
            <Text strong>首次使用提示：</Text>
            <br />
            <Text type="secondary">
              控制台的404错误是正常的LeanCloud懒创建机制，点击下方按钮即可解决
            </Text>
          </div>
        </div>
        
        <div className="empty-actions">
          <Space direction="vertical" size="large" className="action-space">
            <div className="primary-actions">
              <Button 
                type="primary" 
                size="large"
                onClick={onAddGame}
                icon={<PlusOutlined />}
                className="action-btn primary-btn"
              >
                手动添加游戏
              </Button>
              <Button 
                type="default"
                size="large"
                onClick={onBatchImport}
                icon={<DatabaseOutlined />}
                className="action-btn"
              >
                批量导入游戏
              </Button>
            </div>
            
            <div className="secondary-action">
              <Button 
                onClick={onInitSample}
                loading={initLoading}
                icon={<ImportOutlined />}
                size="large"
                className="action-btn sample-btn"
                ghost
              >
                {initLoading ? '正在加载示例数据...' : '🎮 加载7个精选游戏'}
              </Button>
            </div>
          </Space>
        </div>
      </div>
    </div>
  );
};

/**
 * 游戏库主页面
 */
export const Games: React.FC = () => {
  const { user } = useAuthStore();
  const {
    games,
    total,
    loading,
    error,
    currentPage,
    pageSize,
    filters,
    favoriteGames,
    platforms,
    types,
    fetchGames,
    createGame,
    updateGame,
    deleteGame,
    likeGame,
    toggleFavorite,
    setFilters,
    setPage,
    setPageSize,
    clearFilters,
    fetchPlatforms,
    fetchTypes,
    fetchFavoriteGames,
    clearError,
    batchImportGames
  } = useGameStore();

  const [gameFormVisible, setGameFormVisible] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | undefined>();
  const [searchValue, setSearchValue] = useState('');
  const [initLoading, setInitLoading] = useState(false);
  const [batchImportVisible, setBatchImportVisible] = useState(false);

  // 初始化数据
  useEffect(() => {
    fetchGames();
    fetchFavoriteGames();
    fetchPlatforms();
    fetchTypes();
  }, [fetchGames, fetchFavoriteGames, fetchPlatforms, fetchTypes]);

  // 错误提示 - 只显示非404错误
  useEffect(() => {
    if (error && !error.includes('Class or object doesn\'t exists')) {
      message.error(error);
      clearError();
    }
  }, [error, clearError]);

  /**
   * 处理搜索
   */
  const handleSearch = (value: string) => {
    setSearchValue(value);
    setFilters({ ...filters, search: value });
  };

  /**
   * 处理筛选
   */
  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  /**
   * 处理排序
   */
  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(':');
    setFilters({ ...filters, sortBy: sortBy as any, sortOrder: sortOrder as any });
  };

  /**
   * 清除筛选
   */
  const handleClearFilters = () => {
    setSearchValue('');
    clearFilters();
  };

  /**
   * 添加游戏
   */
  const handleAddGame = () => {
    setEditingGame(undefined);
    setGameFormVisible(true);
  };

  /**
   * 编辑游戏
   */
  const handleEditGame = (game: Game) => {
    setEditingGame(game);
    setGameFormVisible(true);
  };

  /**
   * 删除游戏
   */
  const handleDeleteGame = (game: Game) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除游戏「${game.name}」吗？此操作不可撤销。`,
      onOk: async () => {
        try {
          await deleteGame(game.objectId);
          message.success('删除成功');
        } catch (error: any) {
          message.error(error.message);
        }
      }
    });
  };

  /**
   * 提交游戏表单
   */
  const handleGameFormSubmit = async (values: GameFormType) => {
    try {
      if (editingGame) {
        await updateGame(editingGame.objectId, values);
        message.success('更新成功');
      } else {
        await createGame(values);
        message.success('添加成功');
      }
      setGameFormVisible(false);
    } catch (error: any) {
      message.error(error.message);
    }
  };

  /**
   * 点赞游戏
   */
  const handleLikeGame = async (gameId: string) => {
    try {
      await likeGame(gameId);
    } catch (error: any) {
      message.error(error.message);
    }
  };

  /**
   * 切换收藏
   */
  const handleToggleFavorite = async (gameId: string) => {
    try {
      await toggleFavorite(gameId);
      const isFavorite = favoriteGames.some(game => game.objectId === gameId);
      message.success(isFavorite ? '已取消收藏' : '已添加收藏');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  /**
   * 判断用户是否可以编辑游戏
   */
  const canEditGame = (game: Game): boolean => {
    return user?.objectId === game.createdBy;
  };

  /**
   * 判断游戏是否被收藏
   */
  const isGameFavorite = (gameId: string): boolean => {
    return favoriteGames.some(game => game.objectId === gameId);
  };

  /**
   * 初始化示例数据
   */
  const handleInitSampleData = async () => {
    setInitLoading(true);
    try {
      // 先快速建立数据表
      const { quickInitTable } = await import('../../utils/initData');
      await quickInitTable();
      
      // 然后创建示例数据
      const { checkAndInitData } = await import('../../utils/initData');
      await checkAndInitData();
      
      message.success('示例数据初始化成功！');
      
      // 重新获取数据
      await fetchGames();
      await fetchFavoriteGames();
      await fetchPlatforms();
      await fetchTypes();
    } catch (error: any) {
      message.error(`初始化失败: ${error.message}`);
    } finally {
      setInitLoading(false);
    }
  };

  /**
   * 处理批量导入
   */
  const handleBatchImport = async (games: GameFormType[]) => {
    return await batchImportGames(games);
  };

  return (
    <div className="games-page-modern">
      <PageHeader
        title="游戏库"
        subtitle="发现和管理你喜欢的游戏"
        icon={<RocketOutlined />}
      />

      {/* 统计面板 */}
      {games.length > 0 && (
        <Card className="games-stats-panel">
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic
                title="游戏总数"
                value={total}
                prefix={<RocketOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="我的收藏"
                value={favoriteGames.length}
                prefix={<HeartFilled style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="游戏平台"
                value={platforms.length}
                prefix={<AppstoreAddOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="游戏类型"
                value={types.length}
                prefix={<StarFilled style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 搜索和筛选面板 */}
      <Card className="games-filters-modern">
        <div className="filters-header">
          <div className="filters-title">
            <FilterOutlined />
            <span>筛选和排序</span>
          </div>
          <Button 
            type="text" 
            icon={<ClearOutlined />} 
            onClick={handleClearFilters}
            className="clear-filters-btn"
          >
            清除筛选
          </Button>
        </div>
        
        <div className="filters-content">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <div className="filter-item">
                <label>搜索游戏</label>
                <Search
                  placeholder="搜索游戏名称..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onSearch={handleSearch}
                  enterButton={<SearchOutlined />}
                  allowClear
                  size="large"
                />
              </div>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <div className="filter-item">
                <label>游戏平台</label>
                <Select
                  placeholder="选择平台"
                  style={{ width: '100%' }}
                  value={filters.platform}
                  onChange={(value) => handleFilterChange('platform', value)}
                  allowClear
                  size="large"
                >
                  {platforms.map(platform => (
                    <Option key={platform} value={platform}>{platform}</Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <div className="filter-item">
                <label>游戏类型</label>
                <Select
                  placeholder="选择类型"
                  style={{ width: '100%' }}
                  value={filters.type}
                  onChange={(value) => handleFilterChange('type', value)}
                  allowClear
                  size="large"
                >
                  {types.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="filter-item">
                <label>排序方式</label>
                <Select
                  placeholder="选择排序"
                  style={{ width: '100%' }}
                  value={filters.sortBy ? `${filters.sortBy}:${filters.sortOrder || 'desc'}` : undefined}
                  onChange={handleSortChange}
                  allowClear
                  size="large"
                >
                  <Option value="hotScore:desc">🔥 综合热度</Option>
                  <Option value="favoriteCount:desc">❤️ 最多收藏</Option>
                  <Option value="likeCount:desc">👍 最多点赞</Option>
                  <Option value="createdAt:desc">🆕 最新添加</Option>
                  <Option value="name:asc">🔤 名称 A-Z</Option>
                  <Option value="name:desc">🔤 名称 Z-A</Option>
                </Select>
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="filter-item">
                <label>操作</label>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'single',
                        label: '单个添加',
                        icon: <PlusOutlined />,
                        onClick: handleAddGame
                      },
                      {
                        key: 'batch',
                        label: '批量导入',
                        icon: <DatabaseOutlined />,
                        onClick: () => setBatchImportVisible(true)
                      }
                    ]
                  }}
                  trigger={['click']}
                >
                  <Button type="primary" size="large" className="add-game-btn">
                    添加游戏 <DownOutlined />
                  </Button>
                </Dropdown>
              </div>
            </Col>
          </Row>
        </div>
      </Card>

      {/* 游戏列表 */}
      <Spin spinning={loading || initLoading} tip={initLoading ? "正在加载示例数据..." : "加载中..."}>
        {games.length > 0 ? (
          <>
            <div className="games-grid">
              <Row gutter={[24, 24]}>
                {games.map(game => (
                  <Col key={game.objectId} xs={24} sm={12} md={8} lg={6}>
                    <GameCard
                      game={game}
                      isFavorite={isGameFavorite(game.objectId)}
                      onEdit={handleEditGame}
                      onDelete={handleDeleteGame}
                      onToggleFavorite={handleToggleFavorite}
                      onLike={handleLikeGame}
                      canEdit={canEditGame(game)}
                    />
                  </Col>
                ))}
              </Row>
            </div>

            {/* 分页 */}
            <div className="games-pagination-modern">
              <Pagination
                current={currentPage}
                total={total}
                pageSize={pageSize}
                onChange={setPage}
                onShowSizeChange={(current, size) => setPageSize(size)}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                }
                size="default"
              />
            </div>
          </>
        ) : (
          <EmptyState
            onAddGame={handleAddGame}
            onBatchImport={() => setBatchImportVisible(true)}
            onInitSample={handleInitSampleData}
            initLoading={initLoading}
          />
        )}
      </Spin>

      {/* 游戏表单对话框 */}
      <GameForm
        visible={gameFormVisible}
        game={editingGame}
        loading={loading}
        onSubmit={handleGameFormSubmit}
        onCancel={() => setGameFormVisible(false)}
      />

      {/* 批量导入对话框 */}
      <BatchImportModal
        visible={batchImportVisible}
        loading={loading}
        onImport={handleBatchImport}
        onCancel={() => setBatchImportVisible(false)}
      />
    </div>
  );
}; 