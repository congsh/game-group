/**
 * 文件详情模态框组件
 * 支持文件预览、评论、点赞、下载等功能
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Row,
  Col,
  Card,
  Button,
  Avatar,
  Space,
  Typography,
  Tag,
  Divider,
  Input,
  List,
  message,
  Image,
  Tooltip,
  Popconfirm,
  Empty,
  Spin
} from 'antd';
import {
  DownloadOutlined,
  LikeOutlined,
  LikeFilled,
  CommentOutlined,
  ShareAltOutlined,
  UserOutlined,
  CalendarOutlined,
  ArrowsAltOutlined,
  EyeOutlined,
  DeleteOutlined,
  SendOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  FileTextOutlined,
  FileOutlined
} from '@ant-design/icons';
import { useFileShareStore } from '../../store/fileShare';
import { useAuthStore } from '../../store/auth';
import type { FileShare, FileComment } from '../../types/fileShare';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface FileDetailModalProps {
  visible: boolean;
  file: FileShare | null;
  onCancel: () => void;
}

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

const FileDetailModal: React.FC<FileDetailModalProps> = ({
  visible,
  file,
  onCancel
}) => {
  const { user } = useAuthStore();
  const {
    currentFileComments,
    commentsLoading,
    commentsHasMore,
    userLikes,
    loadComments,
    loadMoreComments,
    addComment,
    deleteComment,
    toggleLike,
    downloadFile,
    deleteFile
  } = useFileShareStore();

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // 组件挂载时加载评论
  useEffect(() => {
    if (visible && file) {
      loadComments(file.objectId, true);
    }
  }, [visible, file, loadComments]);

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
    return date.toLocaleString('zh-CN');
  };

  // 获取相对时间
  const getRelativeTime = (timeString: string): string => {
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

  // 处理点赞
  const handleLike = async () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    
    if (!file) return;
    
    try {
      await toggleLike(file.objectId);
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  // 处理下载
  const handleDownload = async () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    
    if (!file) return;
    
    try {
      await downloadFile(file.objectId);
      message.success('开始下载...');
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  // 处理分享
  const handleShare = () => {
    if (!file) return;
    
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板');
    });
  };

  // 提交评论
  const handleSubmitComment = async () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    
    if (!file || !commentText.trim()) {
      message.warning('请输入评论内容');
      return;
    }

    try {
      setSubmittingComment(true);
      await addComment(file.objectId, commentText.trim());
      setCommentText('');
      message.success('评论发布成功');
    } catch (error) {
      console.error('评论失败:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  // 删除评论
  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      message.success('评论删除成功');
    } catch (error) {
      console.error('删除评论失败:', error);
    }
  };

  // 删除文件
  const handleDeleteFile = async () => {
    if (!file) return;
    
    try {
      await deleteFile(file.objectId);
      message.success('文件删除成功');
      onCancel();
    } catch (error) {
      console.error('删除文件失败:', error);
    }
  };

  if (!file) return null;

  const isLiked = userLikes.has(file.objectId);
  const isOwner = user?.objectId === file.uploaderId;
  const typeIcon = FILE_TYPE_ICONS[file.category];
  const typeColor = FILE_TYPE_COLORS[file.category];

  return (
    <Modal
      title="文件详情"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      className="file-detail-modal"
    >
      <Row gutter={24}>
        {/* 左侧：文件预览 */}
        <Col xs={24} md={12}>
          <Card title="文件预览" size="small">
            {file.thumbnailUrl ? (
              <div style={{ textAlign: 'center' }}>
                <Image
                  src={file.thumbnailUrl}
                  alt={file.title}
                  style={{ maxHeight: 300 }}
                />
              </div>
            ) : (
              <div style={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${typeColor}20`,
                borderRadius: 8
              }}>
                <div style={{ fontSize: 48, color: typeColor }}>
                  {typeIcon}
                </div>
              </div>
            )}
            
            {/* 文件信息 */}
            <div style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">文件名：</Text>
                  <Text>{file.fileName}</Text>
                </div>
                <div>
                  <Text type="secondary">文件大小：</Text>
                  <Text>{formatFileSize(file.fileSize)}</Text>
                </div>
                <div>
                  <Text type="secondary">文件类型：</Text>
                  <Tag color={typeColor}>{file.category}</Tag>
                </div>
                <div>
                  <Text type="secondary">上传时间：</Text>
                  <Text>{formatTime(file.createdAt)}</Text>
                </div>
              </Space>
            </div>

            {/* 操作按钮 */}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  disabled={!file.allowDownload}
                >
                  下载文件
                </Button>
                <Button
                  icon={isLiked ? <LikeFilled style={{ color: '#ff4d4f' }} /> : <LikeOutlined />}
                  onClick={handleLike}
                >
                  {file.likeCount}
                </Button>
                <Button icon={<ShareAltOutlined />} onClick={handleShare}>
                  分享
                </Button>
                {isOwner && (
                  <Popconfirm
                    title="确定要删除这个文件吗？"
                    onConfirm={handleDeleteFile}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </div>
          </Card>
        </Col>

        {/* 右侧：文件信息和评论 */}
        <Col xs={24} md={12}>
          {/* 文件信息 */}
          <Card title="文件信息" size="small" style={{ marginBottom: 16 }}>
            <Title level={4} style={{ marginBottom: 8 }}>
              {file.title}
            </Title>
            
            {file.description && (
              <Paragraph style={{ marginBottom: 16 }}>
                {file.description}
              </Paragraph>
            )}

            {/* 标签 */}
            {file.tags && file.tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">标签：</Text>
                <div style={{ marginTop: 4 }}>
                  {file.tags.map(tag => (
                    <Tag key={tag} color="blue" style={{ marginBottom: 4 }}>
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {/* 上传者信息 */}
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                <div>
                  <Text strong>{file.uploaderName}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {getRelativeTime(file.createdAt)}
                  </Text>
                </div>
              </Space>
            </div>

            {/* 统计信息 */}
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                    {file.viewCount}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <EyeOutlined /> 查看
                  </Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                    {file.likeCount}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <LikeOutlined /> 点赞
                  </Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                    {file.downloadCount}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <DownloadOutlined /> 下载
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* 评论区 */}
          <Card
            title={`评论 (${file.commentCount})`}
            size="small"
            style={{ height: 400, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            {/* 发表评论 */}
            {file.allowComment && (
              <div style={{ marginBottom: 16 }}>
                <TextArea
                  rows={3}
                  placeholder="写下你的评论..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!user || submittingComment}
                />
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<SendOutlined />}
                    onClick={handleSubmitComment}
                    loading={submittingComment}
                    disabled={!user || !commentText.trim()}
                  >
                    发表评论
                  </Button>
                </div>
              </div>
            )}

            <Divider style={{ margin: '8px 0' }} />

            {/* 评论列表 */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <Spin spinning={commentsLoading}>
                {currentFileComments.length === 0 ? (
                  <Empty
                    description="暂无评论"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ marginTop: 40 }}
                  />
                ) : (
                  <List
                    dataSource={currentFileComments}
                    renderItem={(comment) => (
                      <List.Item
                        key={comment.objectId}
                        actions={
                          user?.objectId === comment.commenterId ? [
                            <Popconfirm
                              title="确定要删除这条评论吗？"
                              onConfirm={() => handleDeleteComment(comment.objectId)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button type="text" size="small" danger>
                                删除
                              </Button>
                            </Popconfirm>
                          ] : []
                        }
                      >
                        <List.Item.Meta
                          avatar={<Avatar size="small" icon={<UserOutlined />} />}
                          title={
                            <Space>
                              <Text strong>{comment.commenterName}</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {getRelativeTime(comment.createdAt)}
                              </Text>
                            </Space>
                          }
                          description={comment.content}
                        />
                      </List.Item>
                    )}
                  />
                )}

                {/* 加载更多评论 */}
                {commentsHasMore && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Button
                      size="small"
                      onClick={() => loadMoreComments(file.objectId)}
                      loading={commentsLoading}
                    >
                      加载更多评论
                    </Button>
                  </div>
                )}
              </Spin>
            </div>
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default FileDetailModal; 