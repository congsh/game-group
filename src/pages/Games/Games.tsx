/**
 * 游戏库页面
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
  Dropdown
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
  RocketOutlined
} from '@ant-design/icons';
import { useGameStore } from '../../store/games';
import { useAuthStore } from '../../store/auth';
import type { Game, GameForm as GameFormType } from '../../types/game';
import { checkAndInitData } from '../../utils/initData';
import { BatchImportModal } from '../../components/ui/BatchImportModal';
import PageHeader from '../../components/common/PageHeader';
import './Games.css';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { Meta } = Card;

/**
 * 游戏卡片组件
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
  return (
    <Card
      className="game-card"
      actions={[
        <Tooltip title={isFavorite ? '取消收藏' : '添加收藏'} key="favorite">
          <Button
            type="text"
            icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
            onClick={() => onToggleFavorite(game.objectId)}
          />
        </Tooltip>,
        <Tooltip title="点赞" key="like">
          <Button
            type="text"
            onClick={() => onLike(game.objectId)}
          >
            👍 {game.likeCount}
          </Button>
        </Tooltip>,
        ...(canEdit ? [
          <Tooltip title="编辑" key="edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(game)}
            />
          </Tooltip>,
          <Tooltip title="删除" key="delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(game)}
            />
          </Tooltip>
        ] : [])
      ]}
    >
      <Meta
        title={
          <div className="game-title">
            <span>{game.name}</span>
            {game.platform && <Tag color="blue">{game.platform}</Tag>}
          </div>
        }
        description={
          <div className="game-description">
            <div className="game-players">
              <Text type="secondary">
                {game.minPlayers === game.maxPlayers 
                  ? `${game.minPlayers} 人` 
                  : `${game.minPlayers}-${game.maxPlayers} 人`}
              </Text>
            </div>
            {game.type && (
              <div className="game-type">
                <Tag color="green">{game.type}</Tag>
              </div>
            )}
            {game.description && (
              <div className="game-desc">
                <Text ellipsis={{ tooltip: game.description }}>
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
 * 游戏表单组件
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
      title={game ? '编辑游戏' : '添加游戏'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
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
          <Input placeholder="请输入游戏名称" />
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
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
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
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="platform"
          label="游戏平台"
        >
          <Input placeholder="如：PC、PS5、Switch 等" />
        </Form.Item>

        <Form.Item
          name="type"
          label="游戏类型"
        >
          <Input placeholder="如：策略、射击、角色扮演 等" />
        </Form.Item>

        <Form.Item
          name="description"
          label="游戏描述"
        >
          <Input.TextArea
            rows={3}
            placeholder="请描述游戏的特色、玩法等..."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
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
    <div className="games-page">
      <PageHeader
        title="游戏库"
        subtitle="发现和管理你喜欢的游戏"
        icon={<RocketOutlined />}
      />

      {/* 搜索和筛选 */}
      <Card className="games-filters">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索游戏名称..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="游戏平台"
              style={{ width: '100%' }}
              value={filters.platform}
              onChange={(value) => handleFilterChange('platform', value)}
              allowClear
            >
              {platforms.map(platform => (
                <Option key={platform} value={platform}>{platform}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="游戏类型"
              style={{ width: '100%' }}
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
              allowClear
            >
              {types.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="排序方式"
              style={{ width: '100%' }}
              value={filters.sortBy ? `${filters.sortBy}:${filters.sortOrder || 'desc'}` : undefined}
              onChange={handleSortChange}
              allowClear
            >
              <Option value="createdAt:desc">最新添加</Option>
              <Option value="createdAt:asc">最早添加</Option>
              <Option value="name:asc">名称 A-Z</Option>
              <Option value="name:desc">名称 Z-A</Option>
              <Option value="likeCount:desc">最多点赞</Option>
              <Option value="likeCount:asc">最少点赞</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Space>
              <Button
                icon={<FilterOutlined />}
                onClick={handleClearFilters}
              >
                清除筛选
              </Button>
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
                <Button type="primary">
                  添加游戏 <DownOutlined />
                </Button>
              </Dropdown>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 游戏列表 */}
      <Spin spinning={loading || initLoading}>
        {games.length > 0 ? (
          <>
            <Row gutter={[16, 16]}>
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

            {/* 分页 */}
            <div className="games-pagination">
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
              />
            </div>
          </>
        ) : (
          <Empty
            description={
              <div>
                <p>还没有游戏数据</p>
                <Text type="secondary">
                  你可以手动添加游戏，或者加载一些精选的示例游戏来快速开始体验
                </Text>
                <br />
                <div style={{ 
                  background: '#f6ffed', 
                  border: '1px solid #b7eb8f', 
                  borderRadius: '6px', 
                  padding: '8px 12px', 
                  margin: '8px 0',
                  fontSize: '12px' 
                }}>
                  💡 <strong>首次使用提示</strong>：控制台的404错误是正常的，点击下方按钮即可解决
                </div>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Space>
              <Button 
                type="primary" 
                onClick={handleAddGame}
                icon={<PlusOutlined />}
              >
                手动添加游戏
              </Button>
              <Button 
                onClick={() => setBatchImportVisible(true)}
                icon={<DatabaseOutlined />}
                type="default"
              >
                批量导入游戏
              </Button>
              <Button 
                onClick={handleInitSampleData}
                loading={initLoading}
                icon={<ImportOutlined />}
                type="default"
              >
                {initLoading ? '正在加载示例数据...' : '加载7个精选游戏'}
              </Button>
            </Space>
          </Empty>
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