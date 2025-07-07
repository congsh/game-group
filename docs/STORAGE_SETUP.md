# 存储服务配置指南

本文档介绍如何配置不同的存储服务提供商，以实现文件上传功能。

## 支持的存储服务

1. **七牛云** - 国内访问速度快，免费额度充足
2. **阿里云OSS** - 功能完善，稳定可靠
3. **腾讯云COS** - 与微信生态集成良好
4. **本地存储** - 适合开发测试

## 环境变量配置

在项目根目录创建 `.env` 文件，根据您选择的存储服务添加相应配置：

### 通用配置

```env
# 存储提供商选择：qiniu | aliyun | tencent | local
REACT_APP_STORAGE_PROVIDER=qiniu

# API端点（用于获取上传凭证或上传到本地服务器）
REACT_APP_STORAGE_ENDPOINT=http://localhost:3000/api

# 存储域名（用于访问已上传的文件）
REACT_APP_STORAGE_DOMAIN=https://your-domain.com

# 存储桶名称
REACT_APP_STORAGE_BUCKET=your-bucket-name

# 存储区域
REACT_APP_STORAGE_REGION=z2
```

### 七牛云配置

1. 注册七牛云账号：https://www.qiniu.com/
2. 创建存储空间（建议选择华南区域）
3. 获取密钥：在个人中心 -> 密钥管理

```env
REACT_APP_STORAGE_PROVIDER=qiniu
REACT_APP_QINIU_ACCESS_KEY=your-qiniu-access-key
REACT_APP_QINIU_SECRET_KEY=your-qiniu-secret-key
REACT_APP_QINIU_BUCKET=your-qiniu-bucket
REACT_APP_QINIU_DOMAIN=https://your-qiniu-domain.com
REACT_APP_QINIU_REGION=z2  # z0:华东 z1:华北 z2:华南 na0:北美
```

### 阿里云OSS配置

1. 注册阿里云账号：https://www.aliyun.com/
2. 开通OSS服务并创建Bucket
3. 创建RAM用户并授权OSS权限

```env
REACT_APP_STORAGE_PROVIDER=aliyun
REACT_APP_ALIYUN_ACCESS_KEY_ID=your-aliyun-access-key-id
REACT_APP_ALIYUN_ACCESS_KEY_SECRET=your-aliyun-access-key-secret
REACT_APP_ALIYUN_BUCKET=your-aliyun-bucket
REACT_APP_ALIYUN_REGION=oss-cn-hangzhou
REACT_APP_ALIYUN_DOMAIN=https://your-bucket.oss-cn-hangzhou.aliyuncs.com
```

### 腾讯云COS配置

1. 注册腾讯云账号：https://cloud.tencent.com/
2. 开通COS服务并创建存储桶
3. 获取API密钥

```env
REACT_APP_STORAGE_PROVIDER=tencent
REACT_APP_TENCENT_SECRET_ID=your-tencent-secret-id
REACT_APP_TENCENT_SECRET_KEY=your-tencent-secret-key
REACT_APP_TENCENT_BUCKET=your-bucket-1234567890
REACT_APP_TENCENT_REGION=ap-guangzhou
REACT_APP_TENCENT_DOMAIN=https://your-bucket-1234567890.cos.ap-guangzhou.myqcloud.com
```

### 本地存储配置

适合开发测试环境使用：

```env
REACT_APP_STORAGE_PROVIDER=local
REACT_APP_STORAGE_ENDPOINT=http://localhost:3000/api
REACT_APP_STORAGE_DOMAIN=http://localhost:3000/uploads
```

## 后端配置

### 七牛云后端接口

创建获取上传凭证的接口：

```javascript
// /api/qiniu/token
const qiniu = require('qiniu');

const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
const putPolicy = new qiniu.rs.PutPolicy({
  scope: bucket,
  expires: 3600,
  returnBody: JSON.stringify({
    key: '$(key)',
    hash: '$(etag)',
    size: '$(fsize)',
    bucket: '$(bucket)',
    name: '$(fname)'
  })
});

const uploadToken = putPolicy.uploadToken(mac);
const key = `uploads/${Date.now()}_${filename}`;

res.json({ token: uploadToken, key });
```

### 本地存储后端接口

使用 multer 处理文件上传：

```javascript
// /api/upload
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有文件上传' });
  }

  res.json({
    url: `/uploads/${req.file.filename}`,
    key: req.file.filename,
    size: req.file.size,
    name: req.file.originalname,
    type: req.file.mimetype
  });
});
```

## 使用示例

### 在组件中使用

```tsx
import { uploadService } from '@/services/upload.service';

// 上传文件
const handleUpload = async (file: File) => {
  try {
    const result = await uploadService.upload(file, {
      onProgress: (percent) => {
        console.log(`上传进度: ${percent}%`);
      }
    });
  
    console.log('上传成功:', result);
    // result.url - 文件访问URL
    // result.thumbnailUrl - 缩略图URL（仅图片）
  } catch (error) {
    console.error('上传失败:', error);
  }
};

// 批量上传
const handleBatchUpload = async (files: File[]) => {
  const results = await uploadService.batchUpload(files, {
    concurrent: 3, // 同时上传3个文件
    onProgress: (fileIndex, percent) => {
      console.log(`文件 ${fileIndex + 1} 上传进度: ${percent}%`);
    },
    onFileComplete: (fileIndex, result) => {
      console.log(`文件 ${fileIndex + 1} 上传完成:`, result);
    }
  });
};
```

### 使用FileUpload组件

```tsx
import FileUpload from '@/components/FileUpload';

function MyComponent() {
  return (
    <FileUpload
      fileTypes={['image', 'video']}
      multiple={true}
      onSuccess={(file) => {
        console.log('文件上传成功:', file);
      }}
      onError={(error) => {
        console.error('文件上传失败:', error);
      }}
    />
  );
}
```

## 注意事项

1. **安全性**：

   - 不要在前端代码中直接暴露 AccessKey/SecretKey
   - 使用后端生成临时上传凭证
   - 设置合理的上传大小限制
2. **性能优化**：

   - 大文件使用分片上传
   - 批量上传时控制并发数
   - 使用CDN加速文件访问
3. **成本控制**：

   - 定期清理无用文件
   - 根据文件类型设置不同的存储策略
   - 监控流量使用情况
4. **用户体验**：

   - 显示上传进度
   - 支持断点续传
   - 提供文件预览功能

## 故障排查

### 常见问题

1. **跨域问题**

   - 在存储服务中配置CORS规则
   - 允许来自您域名的请求
2. **上传失败**

   - 检查上传凭证是否过期
   - 确认文件大小是否超限
   - 验证文件类型是否允许
3. **访问失败**

   - 检查存储桶权限设置
   - 确认域名配置正确
   - 验证防盗链设置

## 相关链接

- [七牛云文档](https://developer.qiniu.com/)
- [阿里云OSS文档](https://help.aliyun.com/product/31815.html)
- [腾讯云COS文档](https://cloud.tencent.com/document/product/436)
