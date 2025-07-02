# 游戏组队平台 - 设置说明

## 快速开始

### 1. 环境准备
确保您的开发环境中已安装：
- Node.js >= 16.0.0
- npm >= 8.0.0

### 2. 安装依赖
```bash
npm install
```

### 3. 配置 LeanCloud

#### 3.1 注册 LeanCloud 账号
访问 [LeanCloud 官网](https://leancloud.cn/) 注册账号并创建新应用。

#### 3.2 获取配置信息
在 LeanCloud 控制台中获取以下信息：
- App ID
- App Key
- Server URL（国际版需要）

#### 3.3 创建环境变量文件
在项目根目录创建 `.env.local` 文件：
```bash
# LeanCloud 配置
REACT_APP_LEANCLOUD_APP_ID=你的_app_id
REACT_APP_LEANCLOUD_APP_KEY=你的_app_key
REACT_APP_LEANCLOUD_SERVER_URL=你的_server_url

# 应用环境
REACT_APP_ENV=development
```

### 4. 配置 LeanCloud 数据表

在 LeanCloud 控制台的「数据存储」中创建以下表：

#### 4.1 Game 表（游戏表）
- `name` (String): 游戏名称
- `minPlayers` (Number): 最少人数  
- `maxPlayers` (Number): 最多人数
- `platform` (String): 游戏平台
- `description` (String): 游戏描述
- `type` (String): 游戏类型
- `likeCount` (Number): 点赞数
- `createdBy` (Pointer -> _User): 创建者

#### 4.2 DailyVote 表（每日投票表）
- `date` (String): 投票日期
- `user` (Pointer -> _User): 投票用户
- `wantsToPlay` (Boolean): 是否想玩
- `selectedGames` (Array): 选择的游戏ID列表

#### 4.3 WeekendTeam 表（周末组队表）
- `game` (Pointer -> Game): 关联游戏
- `eventDate` (String): 活动日期
- `startTime` (String): 开始时间
- `endTime` (String): 结束时间
- `leader` (Pointer -> _User): 队长
- `members` (Array): 成员用户ID列表
- `maxMembers` (Number): 最大成员数
- `status` (String): 组队状态

### 5. 启动开发服务器
```bash
npm start
```

应用将在 http://localhost:3000 启动。

### 6. 构建生产版本
```bash
npm run build
```

## 当前功能状态

### ✅ 已完成
- 项目基础架构搭建
- 用户登录系统（昵称登录）
- 基础路由和状态管理
- 响应式UI设计

### 🚧 开发中
- 游戏库管理模块
- 每日投票功能
- 周末组队功能

### ⏳ 计划中
- 批量导入游戏
- 收藏点赞功能
- 智能推荐算法
- 移动端优化

## 问题排查

### 常见问题

1. **无法启动项目**
   - 检查 Node.js 版本是否 >= 16
   - 删除 `node_modules` 文件夹，重新运行 `npm install`

2. **LeanCloud 连接失败**
   - 检查 `.env.local` 文件是否存在且配置正确
   - 确认 LeanCloud 应用状态正常

3. **TypeScript 错误**
   - 运行 `npm install @types/node` 安装类型定义
   - 重启 VS Code 或其他编辑器

## 下一步开发

1. 完善游戏库管理功能
2. 实现每日投票系统
3. 开发周末组队功能
4. 添加更多用户交互功能

## 联系支持

如遇到问题，请查看：
- [LeanCloud 文档](https://leancloud.cn/docs/)
- [React 官方文档](https://react.dev/)
- [Ant Design 文档](https://ant.design/) 