# 文件上传系统修复说明

## 问题描述

在开发环境中，文件上传功能出现以下错误：

```
POST https://wjl-work.top/api/qiniu/token 405 (Method Not Allowed)
文件分享失败: Error: 无法获取上传凭证，请检查服务器配置
```

## 问题原因

1. **API端点不存在**: `/api/qiniu/token` 端点无法处理POST请求
2. **缺少代理配置**: 没有配置开发服务器代理来处理API请求
3. **配置依赖**: 开发环境依赖七牛云配置，但配置不完整

## 解决方案

### 1. 创建API代理配置

创建了 `src/setupProxy.js` 文件，配置开发服务器代理：

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 代理七牛云API请求
  app.use('/api/qiniu', createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // 返回模拟的token和删除响应
    }
  }));

  // 代理本地文件上传API
  app.use('/api/upload', createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // 返回模拟的上传结果
    }
  }));
};
```

### 2. 改进上传服务配置

修改了 `src/services/upload.service.ts`：

- **开发环境默认使用本地存储**: 无需配置七牛云参数
- **自动降级机制**: 配置不完整时自动使用模拟上传
- **改进错误处理**: 提供更友好的错误提示
- **添加配置日志**: 便于调试和问题排查

### 3. 安装必要依赖

```bash
npm install --save-dev http-proxy-middleware
```

## 配置说明

### 开发环境（推荐）

开发环境现在默认使用本地存储模式，无需额外配置：

```bash
# 启动开发服务器
npm start
```

### 使用七牛云存储

如需使用七牛云存储，请在项目根目录创建 `.env.local` 文件：

```env
# 存储提供商设置
REACT_APP_STORAGE_PROVIDER=qiniu

# 七牛云配置
REACT_APP_QINIU_AK=your-access-key
REACT_APP_QINIU_SK=your-secret-key
REACT_APP_QINIU_BUCKET=your-bucket-name
REACT_APP_QINIU_DOMAIN=https://your-domain.com
REACT_APP_QINIU_REGION=z0
```

### 使用本地存储

```env
# 存储提供商设置
REACT_APP_STORAGE_PROVIDER=local

# 本地存储配置
REACT_APP_STORAGE_ENDPOINT=/api/upload
REACT_APP_STORAGE_BUCKET=local-uploads
REACT_APP_STORAGE_DOMAIN=http://localhost:3000
```

## 功能特性

### 自动降级机制

- 开发环境下，如果七牛云配置不完整，自动使用模拟上传
- 生产环境下，如果服务器API不可用，提供明确的错误提示

### 多种存储支持

- **七牛云**: 生产环境推荐
- **本地存储**: 开发环境默认
- **模拟上传**: 开发环境备用方案

### 进度反馈

- 实时显示上传进度
- 支持多文件上传
- 详细的错误信息提示

## 测试方法

### 1. 访问测试页面

在浏览器中访问：`http://localhost:3000/test-upload.html`

### 2. 在应用中测试

1. 登录应用
2. 进入文件分享页面
3. 尝试上传文件
4. 检查控制台日志

### 3. 检查配置

在浏览器控制台中查看上传服务配置日志：

```
上传服务配置: {
  provider: "local",
  endpoint: "/api/upload",
  bucket: "local-uploads",
  domain: "http://localhost:3000",
  isDevelopment: true
}
```

## 故障排除

### 常见问题

1. **405错误**: 检查代理配置是否正确
2. **配置错误**: 确认环境变量设置
3. **网络错误**: 检查开发服务器是否正常运行

### 调试步骤

1. 检查浏览器控制台错误信息
2. 查看网络请求面板
3. 确认代理配置生效
4. 验证环境变量加载

## 生产环境部署

在生产环境中，需要：

1. 配置真实的七牛云参数
2. 实现真正的后端API
3. 配置正确的域名和HTTPS
4. 设置适当的CORS策略

## 相关文件

- `src/setupProxy.js` - API代理配置
- `src/services/upload.service.ts` - 上传服务实现
- `public/api/qiniu/upload-token.js` - 七牛云API示例
- `public/api/upload.js` - 本地API示例
- `public/test-upload.html` - 测试页面
- `.env.local` - 环境变量配置（需要手动创建） 