/**
 * 个人资料上传组件
 * 支持头像、作品展示等文件上传
 */

import React, { useState } from 'react';
import { Card, Avatar, Button, Space, List, Image, Modal, message, Spin } from 'antd';
import { UserOutlined, CameraOutlined, PlusOutlined } from '@ant-design/icons';
import FileUpload from '../../components/FileUpload';
import { uploadService } from '../../services/upload.service';
import { useAuthStore } from '../../store/auth';

interface ProfileFile {
  id: string;
  url: string;
  thumbnailUrl?: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

const ProfileUpload: React.FC = () => {
  const { user } = useAuthStore();
  const [avatar, setAvatar] = useState<string>((user as any)?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<ProfileFile[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // 上传头像
  const handleAvatarUpload = async (file: File) => {
    try {
      setUploading(true);
      const result = await uploadService.upload(file, {
        onProgress: (percent) => {
          console.log(`头像上传进度: ${percent}%`);
        },
        metadata: {
          type: 'avatar',
          userId: user?.objectId
        }
      });

      // 更新头像URL
      setAvatar(result.url);
      
      // TODO: 调用后端API更新用户头像
      // await updateUserAvatar(result.url);
      
      message.success('头像上传成功！');
    } catch (error) {
      message.error('头像上传失败');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // 上传作品/文件
  const handleFileUpload = async (uploadedFile: any) => {
    const newFile: ProfileFile = {
      id: Date.now().toString(),
      url: uploadedFile.url,
      thumbnailUrl: uploadedFile.thumbnailUrl,
      name: uploadedFile.name,
      type: uploadedFile.type,
      size: uploadedFile.size,
      uploadedAt: new Date()
    };

    setFiles([...files, newFile]);
    
    // TODO: 保存到后端
    // await saveUserFile(newFile);
  };

  // 删除文件
  const handleDeleteFile = async (fileId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个文件吗？',
      onOk: async () => {
        try {
          // TODO: 调用后端API删除文件
          // await deleteUserFile(fileId);
          
          setFiles(files.filter(f => f.id !== fileId));
          message.success('文件已删除');
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  // 预览文件
  const handlePreview = (file: ProfileFile) => {
    if (file.type.startsWith('image/')) {
      setPreviewImage(file.url);
      setPreviewTitle(file.name);
      setPreviewVisible(true);
    } else {
      // 对于非图片文件，直接下载
      window.open(file.url, '_blank');
    }
  };

  return (
    <div className="profile-upload-container">
      {/* 头像上传 */}
      <Card title="个人头像" className="avatar-card">
        <div className="avatar-upload-wrapper">
          <Spin spinning={uploading}>
            <Avatar
              size={120}
              src={avatar}
              icon={!avatar && <UserOutlined />}
              className="user-avatar"
            />
            <div className="avatar-upload-overlay">
              <input
                type="file"
                accept="image/*"
                aria-label="上传头像"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleAvatarUpload(file);
                  }
                }}
                style={{ display: 'none' }}
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload" className="avatar-upload-button">
                <Button 
                  type="primary" 
                  shape="circle" 
                  icon={<CameraOutlined />}
                  size="large"
                />
              </label>
            </div>
          </Spin>
        </div>
        <p className="avatar-tips">点击相机图标上传新头像</p>
      </Card>

      {/* 作品/文件上传 */}
      <Card title="我的作品" className="works-card">
        <FileUpload
          fileTypes={['image', 'video', 'document']}
          multiple={true}
          onSuccess={handleFileUpload}
          onError={(error) => {
            console.error('上传失败:', error);
            message.error('文件上传失败');
          }}
        />

        {/* 已上传文件列表 */}
        {files.length > 0 && (
          <List
            className="file-list"
            grid={{
              gutter: 16,
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4,
              xl: 4,
              xxl: 6,
            }}
            dataSource={files}
            renderItem={(file) => (
              <List.Item>
                <Card
                  hoverable
                  cover={
                    file.type.startsWith('image/') ? (
                      <img
                        alt={file.name}
                        src={file.thumbnailUrl || file.url}
                        style={{ height: 200, objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ 
                        height: 200, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f0f0f0'
                      }}>
                        {file.type.startsWith('video/') ? '视频文件' : '文档文件'}
                      </div>
                    )
                  }
                  actions={[
                    <Button
                      type="text"
                      onClick={() => handlePreview(file)}
                    >
                      预览
                    </Button>,
                    <Button
                      type="text"
                      danger
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      删除
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={file.name}
                    description={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                  />
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 图片预览 */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <img alt={previewTitle} style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

// CSS样式
const styles = `
  .profile-upload-container {
    padding: 24px;
  }

  .avatar-card {
    margin-bottom: 24px;
  }

  .avatar-upload-wrapper {
    display: flex;
    justify-content: center;
    position: relative;
    width: fit-content;
    margin: 0 auto;
  }

  .avatar-upload-overlay {
    position: absolute;
    bottom: 0;
    right: 0;
  }

  .avatar-upload-button {
    cursor: pointer;
  }

  .avatar-tips {
    text-align: center;
    margin-top: 16px;
    color: #999;
  }

  .works-card {
    margin-bottom: 24px;
  }

  .file-list {
    margin-top: 24px;
  }
`;

// 添加样式到head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

export default ProfileUpload; 