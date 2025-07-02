# 游戏组队平台

一个基于 React + EdgeOne + LeanCloud 的游戏组队网页应用。

## 功能特性

- 📝 简单昵称登录
- 🎮 游戏库管理（增删改查）
- 📊 批量导入游戏（CSV/JSON/文本格式）
- 🔍 游戏搜索筛选排序
- ❤️ 游戏收藏和点赞
- 🗳️ 每日投票选择游戏 ✅
- 👥 周末组队匹配 ✅

## 技术栈

- **前端**: React 18 + TypeScript
- **UI库**: Ant Design
- **状态管理**: Zustand
- **后端**: LeanCloud BaaS
- **部署**: 腾讯云 EdgeOne

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build
```

## 部署

### 部署到 EdgeOne

项目已经配置好了 EdgeOne 部署：

1. **构建项目**
   ```bash
   npm run build
   ```

2. **上传到 EdgeOne**
   - 登录 EdgeOne 控制台
   - 创建新的静态网站项目
   - 上传 `build/` 目录中的所有文件

3. **配置路由重定向**
   - 添加规则：`/* -> /index.html` (状态码 200)

详细部署指南请参考 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 项目结构

```
src/
├── components/          # 通用组件
├── pages/              # 页面组件
├── store/              # 状态管理
├── services/           # API服务
├── types/              # 类型定义
├── utils/              # 工具函数
└── App.tsx             # 主应用组件
```

## 文档

- [开发文档](./docs/DEVELOPMENT.md) - 技术实现详情
- [设计文档](./docs/DESIGN.md) - 产品设计说明
- [进度文档](./docs/PROGRESS.md) - 开发进度追踪
- [批量导入指南](./docs/BATCH_IMPORT_GUIDE.md) - 批量导入功能使用说明

## 主要功能

### 🎮 游戏库管理
- 完整的CRUD操作
- 搜索、筛选、排序功能
- 收藏和点赞系统
- 权限控制（只能编辑自己添加的游戏）

### 📊 批量导入
- 支持CSV文件导入
- 支持JSON文件导入
- 支持文本格式导入
- 实时预览和错误处理
- 提供示例文件下载

### 🗳️ 每日投票
- 每日游戏投票功能
- 实时投票统计和排行
- 投票历史记录
- 基于投票的偏好分析

### 👥 周末组队
- 创建周末游戏组队
- 加入/离开组队活动
- 组队详情查看
- 队长权限管理
- 智能推荐匹配（基于投票偏好）
- 周末日期限制和时间选择 