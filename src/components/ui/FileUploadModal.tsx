/**
 * 文件上传模态框组件
 * 支持文件选择、表单填写、上传进度等功能
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Upload,
  Progress,
  Space,
  Typography,
  Tag,
  App,
  Row,
  Col,
  Divider,
  notification
} from 'antd';
import {
  UploadOutlined,
  InboxOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  FileTextOutlined,
  FileOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import { fileShareService } from '../../services/fileShare';
import type { FileUploadForm } from '../../types/fileShare';
import { uploadService } from '../../services/upload.service';
import './FileUploadModal.css';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { Dragger } = Upload;

interface FileUploadModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

// 文件类型配置
const FILE_TYPE_CONFIG = {
  image: {
    accept: '.jpg,.jpeg,.png,.gif,.webp,.bmp',
    maxSize: 20 * 1024 * 1024, // 20MB
    icon: <FileImageOutlined />,
    color: '#1890ff',
    label: '图片'
  },
  video: {
    accept: '.mp4,.avi,.mov,.wmv,.flv,.webm',
    maxSize: 500 * 1024 * 1024, // 500MB
    icon: <VideoCameraOutlined />,
    color: '#52c41a',
    label: '视频'
  },
  audio: {
    accept: '.mp3,.wav,.ogg,.m4a,.flac',
    maxSize: 150 * 1024 * 1024, // 150MB
    icon: <AudioOutlined />,
    color: '#faad14',
    label: '音频'
  },
  document: {
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt',
    maxSize: 40 * 1024 * 1024, // 40MB
    icon: <FileTextOutlined />,
    color: '#eb2f96',
    label: '文档'
  },
  other: {
    accept: '*',
    maxSize: 100 * 1024 * 1024, // 100MB
    icon: <FileOutlined />,
    color: '#999999',
    label: '其他'
  }
};

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<RcFile | null>(null);
  const [fileCategory, setFileCategory] = useState<keyof typeof FILE_TYPE_CONFIG>('image');
  const [tags, setTags] = useState<string[]>([]);
  const [inputTag, setInputTag] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 检查存储是否为私有
  const isPrivateBucket = useMemo(() => uploadService.isPrivateBucket(), []);

  // 重置表单
  const resetForm = () => {
    form.resetFields();
    setSelectedFile(null);
    setFileCategory('image');
    setTags([]);
    setInputTag('');
    setUploadProgress(0);
    setUploading(false);
  };

  // 处理取消
  const handleCancel = () => {
    if (uploading) {
      Modal.confirm({
        title: '确认取消',
        content: '文件正在上传中，确定要取消吗？',
        onOk: () => {
          resetForm();
          onCancel();
        }
      });
    } else {
      resetForm();
      onCancel();
    }
  };

  // 获取文件类型
  const getFileType = (file: File): keyof typeof FILE_TYPE_CONFIG => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type.toLowerCase();
    
    // 根据 MIME 类型判断
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    if (mimeType.startsWith('video/')) {
      return 'video';
    }
    if (mimeType.startsWith('audio/')) {
      return 'audio';
    }
    
    // 根据文件扩展名判断文档类型
    const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    if (documentExtensions.includes(extension)) {
      return 'document';
    }
    
    // 其他类型
    return 'other';
  };

  // 文件选择前的验证
  const beforeUpload = (file: RcFile): boolean => {
    const detectedType = getFileType(file);
    const config = FILE_TYPE_CONFIG[detectedType];
    
    // 检查文件大小
    if (file.size > config.maxSize) {
      message.error(`文件大小不能超过 ${config.maxSize / 1024 / 1024}MB`);
      return false;
    }
    
    // 设置文件和类型
    setSelectedFile(file);
    setFileCategory(detectedType);
    
    // 自动填充标题
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    form.setFieldsValue({ title: fileName });
    
    return false; // 阻止自动上传
  };

  // 移除文件
  const handleRemoveFile = () => {
    setSelectedFile(null);
    form.setFieldsValue({ title: '' });
  };

  // 添加标签
  const handleAddTag = () => {
    if (inputTag && !tags.includes(inputTag)) {
      setTags([...tags, inputTag]);
      setInputTag('');
    }
  };

  // 移除标签
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    if (!selectedFile) {
      message.error('请选择要上传的文件');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData: FileUploadForm = {
        title: values.title,
        description: values.description,
        category: fileCategory,
        tags: tags,
        allowDownload: values.allowDownload !== false,
        allowComment: values.allowComment !== false
      };

      await fileShareService.uploadAndShareFile(
        selectedFile,
        formData,
        (percent) => {
          setUploadProgress(percent);
        }
      );

      message.success('文件上传成功！');
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error('上传失败:', error);
      message.error(`上传失败: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      title="分享文件"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
      maskClosable={!uploading}
      closable={!uploading}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          isPublic: !isPrivateBucket,
          allowDownload: true,
          allowComment: true,
          category: 'other'
        }}
      >
        {/* 文件上传区域 */}
        <Form.Item label="选择文件" required>
          {!selectedFile ? (
            <Dragger
              beforeUpload={beforeUpload}
              maxCount={1}
              showUploadList={false}
              disabled={uploading}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持图片、视频、音频、文档等多种格式
              </p>
            </Dragger>
          ) : (
            <div style={{ 
              border: '1px dashed #d9d9d9', 
              borderRadius: 6, 
              padding: 16,
              background: '#fafafa'
            }}>
              <Row align="middle" gutter={16}>
                <Col>
                  <div style={{ 
                    fontSize: 32, 
                    color: FILE_TYPE_CONFIG[fileCategory].color 
                  }}>
                    {FILE_TYPE_CONFIG[fileCategory].icon}
                  </div>
                </Col>
                <Col flex={1}>
                  <div>
                    <Text strong>{selectedFile.name}</Text>
                    <br />
                    <Space>
                      {selectedFile.size && (
                        <Text type="secondary">
                          {formatFileSize(selectedFile.size)}
                        </Text>
                      )}
                      <Tag color={FILE_TYPE_CONFIG[fileCategory].color}>
                        {FILE_TYPE_CONFIG[fileCategory].label}
                      </Tag>
                    </Space>
                  </div>
                </Col>
                <Col>
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveFile}
                    disabled={uploading}
                    danger
                  />
                </Col>
              </Row>
            </div>
          )}
        </Form.Item>

        {/* 基本信息 */}
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="title"
              label="文件标题"
              rules={[
                { required: true, message: '请输入文件标题' },
                { max: 100, message: '标题不能超过100个字符' }
              ]}
            >
              <Input placeholder="请输入文件标题" disabled={uploading} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="文件类型">
              <Select
                value={fileCategory}
                onChange={setFileCategory}
                disabled={uploading}
              >
                {Object.entries(FILE_TYPE_CONFIG).map(([key, config]) => (
                  <Option key={key} value={key}>
                    <Space>
                      <span style={{ color: config.color }}>
                        {config.icon}
                      </span>
                      {config.label}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="文件描述"
          rules={[{ max: 500, message: '描述不能超过500个字符' }]}
        >
          <TextArea
            rows={3}
            placeholder="请输入文件描述（可选）"
            disabled={uploading}
          />
        </Form.Item>

        {/* 标签 */}
        <Form.Item label="标签">
          <div style={{ marginBottom: 8 }}>
            {tags.map(tag => (
              <Tag
                key={tag}
                closable
                onClose={() => handleRemoveTag(tag)}
                style={{ marginBottom: 4 }}
              >
                {tag}
              </Tag>
            ))}
          </div>
          <Row gutter={8}>
            <Col flex={1}>
              <Input
                placeholder="添加标签"
                value={inputTag}
                onChange={(e) => setInputTag(e.target.value)}
                onPressEnter={handleAddTag}
                disabled={uploading}
                maxLength={20}
              />
            </Col>
            <Col>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddTag}
                disabled={!inputTag || uploading}
              >
                添加
              </Button>
            </Col>
          </Row>
        </Form.Item>

        <Divider />

        {/* 权限设置 */}
        <Title level={5}>权限设置</Title>
        
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="isPublic"
              label="公开文件"
              valuePropName="checked"
              tooltip={isPrivateBucket ? "当前存储空间为私有，无法公开文件" : "公开后，所有用户都可见"}
            >
              <Switch disabled={isPrivateBucket} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="allowDownload"
              label="允许下载"
              valuePropName="checked"
            >
              <Switch disabled={uploading} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="allowComment"
              label="允许评论"
              valuePropName="checked"
            >
              <Switch disabled={uploading} />
            </Form.Item>
          </Col>
        </Row>

        {/* 上传进度 */}
        {uploading && (
          <div style={{ marginBottom: 16 }}>
            <Progress 
              percent={uploadProgress} 
              status={uploadProgress === 100 ? 'success' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <Text type="secondary">
              正在上传文件... {uploadProgress}%
            </Text>
          </div>
        )}

        {/* 操作按钮 */}
        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancel} disabled={uploading}>
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={uploading}
              disabled={!selectedFile}
              icon={<UploadOutlined />}
            >
              {uploading ? '上传中...' : '开始上传'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FileUploadModal; 