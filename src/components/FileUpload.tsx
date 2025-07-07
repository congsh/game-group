/**
 * 通用文件上传组件
 * 支持图片、视频、音频、文档等多种文件类型
 */

import React, { useState, useRef } from 'react';
import { Upload, Button, message, Progress, Card, List, Image, Space, Modal } from 'antd';
import { 
  UploadOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  DownloadOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  FileTextOutlined,
  FileOutlined
} from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';

// 文件类型配置
const FILE_TYPE_CONFIG = {
  image: {
    accept: '.jpg,.jpeg,.png,.gif,.webp,.bmp',
    maxSize: 10 * 1024 * 1024, // 10MB
    icon: <FileImageOutlined />,
    color: '#1890ff'
  },
  video: {
    accept: '.mp4,.avi,.mov,.wmv,.flv,.webm',
    maxSize: 100 * 1024 * 1024, // 100MB
    icon: <VideoCameraOutlined />,
    color: '#52c41a'
  },
  audio: {
    accept: '.mp3,.wav,.ogg,.m4a,.flac',
    maxSize: 20 * 1024 * 1024, // 20MB
    icon: <AudioOutlined />,
    color: '#faad14'
  },
  document: {
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt',
    maxSize: 20 * 1024 * 1024, // 20MB
    icon: <FileTextOutlined />,
    color: '#eb2f96'
  }
};

interface FileUploadProps {
  // 上传地址
  uploadUrl?: string;
  // 支持的文件类型
  fileTypes?: Array<keyof typeof FILE_TYPE_CONFIG>;
  // 是否支持多文件上传
  multiple?: boolean;
  // 上传成功回调
  onSuccess?: (file: any) => void;
  // 上传失败回调
  onError?: (error: any) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  uploadUrl = '/api/upload',
  fileTypes = ['image', 'video', 'audio', 'document'],
  multiple = false,
  onSuccess,
  onError
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // 生成accept字符串
  const acceptString = fileTypes
    .map(type => FILE_TYPE_CONFIG[type].accept)
    .join(',');

  // 获取文件类型
  const getFileType = (file: File): keyof typeof FILE_TYPE_CONFIG | 'unknown' => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
      if (config.accept.includes(`.${extension}`)) {
        return type as keyof typeof FILE_TYPE_CONFIG;
      }
    }
    
    return 'unknown';
  };

  // 文件验证
  const beforeUpload = (file: File): boolean => {
    const fileType = getFileType(file);
    
    if (fileType === 'unknown' || !fileTypes.includes(fileType)) {
      message.error('不支持的文件类型！');
      return false;
    }

    const config = FILE_TYPE_CONFIG[fileType];
    if (file.size > config.maxSize) {
      message.error(`文件大小不能超过 ${config.maxSize / 1024 / 1024}MB！`);
      return false;
    }

    return true;
  };

  // 自定义上传
  const customRequest = async (options: any) => {
    const { onSuccess, onError, file, onProgress } = options;
    
    const formData = new FormData();
    formData.append('file', file);
    
    // 添加文件类型信息
    const fileType = getFileType(file);
    formData.append('fileType', fileType);

    try {
      setUploading(true);
      
      const xhr = new XMLHttpRequest();
      
      // 监听上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress({ percent });
        }
      });

      // 监听请求完成
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          onSuccess(response, xhr);
          message.success('上传成功！');
          
          if (onSuccess) {
            onSuccess(response);
          }
        } else {
          onError(new Error('上传失败'));
          message.error('上传失败！');
        }
        setUploading(false);
      });

      // 监听请求错误
      xhr.addEventListener('error', () => {
        onError(new Error('网络错误'));
        message.error('网络错误！');
        setUploading(false);
      });

      // 发送请求
      xhr.open('POST', uploadUrl);
      
      // 添加认证token（如果需要）
      const token = localStorage.getItem('authToken');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.send(formData);
    } catch (error) {
      onError(error);
      message.error('上传失败！');
      setUploading(false);
      
      if (onError) {
        onError(error);
      }
    }
  };

  // 处理文件列表变化
  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // 预览文件
  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }

    setPreviewFile(file.url || (file.preview as string));
    setPreviewVisible(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  // 获取文件的base64
  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  // 渲染文件图标
  const renderFileIcon = (file: UploadFile) => {
    const fileType = getFileType(file.originFileObj as File);
    
    if (fileType === 'unknown') {
      return <FileOutlined style={{ fontSize: 48, color: '#999' }} />;
    }

    const config = FILE_TYPE_CONFIG[fileType];
    return React.cloneElement(config.icon, {
      style: { fontSize: 48, color: config.color }
    });
  };

  return (
    <div className="file-upload-container">
      <Upload
        accept={acceptString}
        fileList={fileList}
        multiple={multiple}
        beforeUpload={beforeUpload}
        customRequest={customRequest}
        onChange={handleChange}
        onPreview={handlePreview}
        listType="picture-card"
        className="upload-list-inline"
      >
        {fileList.length < (multiple ? 10 : 1) && (
          <div>
            <UploadOutlined style={{ fontSize: 20 }} />
            <div style={{ marginTop: 8 }}>选择文件</div>
          </div>
        )}
      </Upload>

      {/* 文件预览弹窗 */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        {previewFile && (
          <div style={{ textAlign: 'center' }}>
            {/* 根据文件类型显示不同的预览 */}
            {previewFile.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ? (
              <Image src={previewFile} alt={previewTitle} style={{ maxWidth: '100%' }} />
            ) : previewFile.match(/\.(mp4|webm|ogg)$/i) ? (
              <video controls style={{ maxWidth: '100%', maxHeight: '500px' }}>
                <source src={previewFile} />
                您的浏览器不支持视频播放
              </video>
            ) : previewFile.match(/\.(mp3|wav|ogg|m4a)$/i) ? (
              <audio controls style={{ width: '100%' }}>
                <source src={previewFile} />
                您的浏览器不支持音频播放
              </audio>
            ) : (
              <div style={{ padding: '40px' }}>
                <FileOutlined style={{ fontSize: 64, color: '#999' }} />
                <p style={{ marginTop: 20 }}>该文件类型不支持预览</p>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  href={previewFile}
                  download={previewTitle}
                  style={{ marginTop: 20 }}
                >
                  下载文件
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 上传提示 */}
      <div style={{ marginTop: 16 }}>
        <Space direction="vertical" size="small">
          <span>支持的文件类型：</span>
          {fileTypes.map(type => (
            <span key={type} style={{ marginLeft: 8 }}>
              {FILE_TYPE_CONFIG[type].icon}
              <span style={{ marginLeft: 4 }}>
                {type === 'image' ? '图片' : 
                 type === 'video' ? '视频' : 
                 type === 'audio' ? '音频' : '文档'}
                ({FILE_TYPE_CONFIG[type].accept})
              </span>
            </span>
          ))}
          <span>单个文件最大：
            {Math.max(...fileTypes.map(type => FILE_TYPE_CONFIG[type].maxSize)) / 1024 / 1024}MB
          </span>
        </Space>
      </div>
    </div>
  );
};

export default FileUpload; 