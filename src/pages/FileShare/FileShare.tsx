/**
 * 文件分享论坛页面
 * 展示所有分享的文件，支持搜索、筛选、上传等功能
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Input,
  Select,
  Tag,
  Avatar,
  Space,
  Typography,
  Statistic,
  List,
  Badge,
  Modal,
  Empty,
  Spin,
  message,
  Tooltip,
  Divider,
  Image
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  LikeOutlined,
  CommentOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  FileTextOutlined,
  FileOutlined,
  UserOutlined,
  CalendarOutlined,
  ArrowsAltOutlined,
  HeartFilled,
  HeartOutlined
} from '@ant-design/icons';
import { useFileShareStore } from '../../store/fileShare';
import { useAuthStore } from '../../store/auth';
import FileUploadModal from '../../components/ui/FileUploadModal';
import FileDetailModal from '../../components/ui/FileDetailModal';
import type { FileShare as FileShareType } from '../../types/fileShare';
import './FileShare.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

// 文件类型图标映射
const FILE_TYPE_ICONS = {
  image: <FileImageOutlined />,
  video: <VideoCameraOutlined />,
  audio: <AudioOutlined />,
  document: <FileTextOutlined />,
  other: <FileOutlined />
};

// 文件类型颜色映射
const FILE_TYPE_COLORS = {
  image: '#1890ff',
  video: '#52c41a',
  audio: '#faad14',
  document: '#eb2f96',
  other: '#999999'
};

const FileShare: React.FC = () => {
  const { user } = useAuthStore();
  const {
    files,
    loading,
    error,
    total,
    hasMore,
    searchParams,
    userLikes,
    stats,
    statsLoading,
    setSearchParams,
    loadFiles,
    loadMoreFiles,
    refreshFiles,
    toggleLike,
    downloadFile,
    loadStats,
    clearError
  } = useFileShareStore();

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileShareType | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 组件挂载时加载数据
  useEffect(() => {
    loadFiles(true);
    loadStats();
  }, [loadFiles, loadStats]);

  // 监听搜索参数变化
  useEffect(() => {
    loadFiles(true);
  }, [searchParams, loadFiles]);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setSearchParams({ keyword: value });
  };

  // 处理分类筛选
  const handleCategoryChange = (category: string) => {
    setSearchParams({ category: category === 'all' ? undefined : category });
  };

  // 处理排序方式
  const handleSortChange = (sortBy: string) => {
    setSearchParams({ sortBy: sortBy as any });
  };

  // 处理文件上传成功
  const handleUploadSuccess = () => {
    setUploadModalVisible(false);
    refreshFiles();
    message.success('文件上传成功！');
  };

  // 处理点赞
  const handleLike = async (file: FileShareType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      message.warning('请先登录');
      return;
    }
    
    try {
      await toggleLike(file.objectId);
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  // 处理下载
  const handleDownload = async (file: FileShareType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      message.warning('请先登录');
      return;
    }
    
    try {
      await downloadFile(file.objectId);
      message.success('开始下载...');
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  // 处理查看详情
  const handleViewDetail = (file: FileShareType) => {
    setSelectedFile(file);
    setDetailModalVisible(true);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    if (days === 0) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      if (hours === 0) {
        const minutes = Math.floor(diff / (60 * 1000));
        return minutes <= 0 ? '刚刚' : `${minutes}分钟前`;
      }
      return `${hours}小时前`;
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 渲染文件卡片
  const renderFileCard = (file: FileShareType) => {
    const isLiked = userLikes.has(file.objectId);
    const typeIcon = FILE_TYPE_ICONS[file.category];
    const typeColor = FILE_TYPE_COLORS[file.category];

    return (
      <Card
        hoverable
        className="file-card"
        onClick={() => handleViewDetail(file)}
        cover={
          file.thumbnailUrl ? (
            <div className="file-cover">
              <Image
                src={file.thumbnailUrl}
                alt={file.title}
                preview={false}
                style={{ height: 200, objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div className="file-cover-placeholder" style={{ backgroundColor: `${typeColor}20` }}>
              <div style={{ fontSize: 48, color: typeColor }}>
                {typeIcon}
              </div>
            </div>
          )
        }
        actions={[
          <Tooltip title={isLiked ? '取消点赞' : '点赞'}>
            <Button
              type="text"
              icon={isLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
              onClick={(e) => handleLike(file, e)}
            >
              {file.likeCount}
            </Button>
          </Tooltip>,
          <Tooltip title="查看次数">
            <Button type="text" icon={<EyeOutlined />}>
              {file.viewCount}
            </Button>
          </Tooltip>,
          <Tooltip title="评论">
            <Button type="text" icon={<CommentOutlined />}>
              {file.commentCount}
            </Button>
          </Tooltip>,
          <Tooltip title="下载">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={(e) => handleDownload(file, e)}
              disabled={!file.allowDownload}
            >
              {file.downloadCount}
            </Button>
          </Tooltip>
        ]}
      >
        <Card.Meta
          title={
            <div className="file-card-title">
              <Text strong ellipsis={{ tooltip: file.title }}>
                {file.title}
              </Text>
              <Tag color={typeColor} style={{ marginLeft: 8 }}>
                {file.category}
              </Tag>
            </div>
          }
          description={
            <div className="file-card-description">
              {file.description && (
                <Paragraph
                  ellipsis={{ rows: 2, tooltip: file.description }}
                  style={{ marginBottom: 8 }}
                >
                  {file.description}
                </Paragraph>
              )}
              <div className="file-meta">
                <Space size="small">
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Text type="secondary">{file.uploaderName}</Text>
                </Space>
                <Text type="secondary">{formatTime(file.createdAt)}</Text>
              </div>
              <div className="file-details">
                <Space size="small">
                  <ArrowsAltOutlined />
                  <Text type="secondary">{formatFileSize(file.fileSize)}</Text>
                </Space>
              </div>
            </div>
          }
        />
      </Card>
    );
  };

  return (
    <div className="file-share-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <Title level={2} style={{ margin: 0 }}>
              文件分享
            </Title>
            <Text type="secondary">分享你的文件，发现精彩内容</Text>
          </div>
          <div className="header-right">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setUploadModalVisible(true)}
              disabled={!user}
            >
              分享文件
            </Button>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      {stats && (
        <Row gutter={16} className="stats-section">
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总文件数"
                value={stats.totalFiles}
                prefix={<FileOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总下载数"
                value={stats.totalDownloads}
                prefix={<DownloadOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总查看数"
                value={stats.totalViews}
                prefix={<EyeOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总评论数"
                value={stats.totalComments}
                prefix={<CommentOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索和筛选 */}
      <Card className="filter-section">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索文件名、描述..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="文件类型"
              allowClear
              style={{ width: '100%' }}
              onChange={handleCategoryChange}
              value={searchParams.category}
            >
              <Option value="all">全部类型</Option>
              <Option value="image">图片</Option>
              <Option value="video">视频</Option>
              <Option value="audio">音频</Option>
              <Option value="document">文档</Option>
              <Option value="other">其他</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="排序方式"
              style={{ width: '100%' }}
              onChange={handleSortChange}
              value={searchParams.sortBy}
            >
              <Option value="latest">最新发布</Option>
              <Option value="popular">最受欢迎</Option>
              <Option value="downloads">下载最多</Option>
              <Option value="likes">点赞最多</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Text type="secondary">
              共找到 {total} 个文件
            </Text>
          </Col>
        </Row>
      </Card>

      {/* 文件列表 */}
      <div className="file-list-section">
        {error && (
          <Card>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Text type="danger">{error}</Text>
              <br />
              <Button
                type="primary"
                onClick={() => {
                  clearError();
                  refreshFiles();
                }}
                style={{ marginTop: 16 }}
              >
                重试
              </Button>
            </div>
          </Card>
        )}

        <Spin spinning={loading && files.length === 0}>
          {files.length === 0 && !loading ? (
            <Card>
              <Empty
                description="暂无文件分享"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                {user && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setUploadModalVisible(true)}
                  >
                    分享第一个文件
                  </Button>
                )}
              </Empty>
            </Card>
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {files.map(file => (
                  <Col key={file.objectId} xs={24} sm={12} md={8} lg={6} xl={4}>
                    {renderFileCard(file)}
                  </Col>
                ))}
              </Row>

              {/* 加载更多 */}
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <Button
                    loading={loading}
                    onClick={loadMoreFiles}
                  >
                    加载更多
                  </Button>
                </div>
              )}
            </>
          )}
        </Spin>
      </div>

      {/* 文件上传模态框 */}
      <FileUploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* 文件详情模态框 */}
      <FileDetailModal
        visible={detailModalVisible}
        file={selectedFile}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedFile(null);
        }}
      />
    </div>
  );
};

export default FileShare;