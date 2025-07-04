# 游戏组队平台 - 设计文档

## 1. 项目概述

### 1.1 背景
为游戏爱好者群体创建一个便捷的组队平台，支持日常投票决定游戏安排和周末时段匹配组队。

### 1.2 目标用户
- 游戏爱好者群体
- 需要组织游戏活动的玩家
- 寻找队友的单人玩家

### 1.3 核心价值
- 简化组队流程
- 提高游戏体验
- 增强社群互动

## 2. 功能需求

### 2.1 用户系统
- **登录方式**: 仅需昵称，昵称一致即视为同一用户
- **用户数据**: 昵称、收藏游戏列表
- **权限控制**: 只能修改/删除自己创建的内容

### 2.2 游戏库管理
- **基础信息**: 
  - 游戏名称（必填）
  - 最小/最大人数（必填）
  - 平台、描述、类型（选填）
- **操作功能**: 增删改查、批量导入
- **社交功能**: 收藏、点赞

### 2.3 每日投票
- **投票内容**: 今晚是否游玩 + 游戏偏好选择
- **结果展示**: 实时统计投票结果和热门游戏
- **时效性**: 每日重置

### 2.4 周末组队
- **创建组队**: 选择游戏 + 时间段（开始/结束时间）
- **权限机制**: 第一个创建者默认为组长
- **匹配推荐**: 按游戏和时间进行智能匹配
- **一键加入**: 直接加入感兴趣的组队

### 2.5 新增功能建议（2025-01-06）
1. **个人中心**：用户可查看自己的历史投票、历史组队、收藏信息。
2. **定时任务**：每天晚上00:00将投票信息、组队信息统计固定归档，便于后续分析和追溯。
3. **每日投票分享链接**：为每日投票结果生成可分享的链接，方便用户在社群传播。
4. **文件上传功能**：支持用户上传文件（如图片、文档），可探索对接NFS存储。
5. **组件复用优化**：提升通用组件的复用率，减少重复代码。
6. **数据类型检查**：系统性检查和优化所有数据类型定义，确保类型安全和一致性。

### 2.5 新功能详细设计（2025-01-06）

#### 2.5.1 登录持久化
- **需求背景**：用户每次刷新页面都需要重新登录，体验不佳
- **技术方案**：
  - 使用 localStorage 保存用户登录信息（加密存储）
  - 实现自动登录和 token 刷新机制
  - 添加"记住我"选项，允许用户选择是否保持登录状态
  - 设置合理的过期时间（如7天）
- **安全考虑**：
  - 敏感信息加密存储
  - 定期验证 token 有效性
  - 提供主动登出功能

#### 2.5.2 投票列表优化
- **需求背景**：当前只显示前5条投票，信息展示不充分
- **技术方案**：
  - 移除投票数量限制，展示所有投票记录
  - 添加虚拟滚动支持大量数据展示
  - 优化列表样式，添加滚动条
  - 支持投票记录搜索和筛选
- **用户体验**：
  - 平滑滚动体验
  - 快速定位功能
  - 投票统计信息置顶展示

#### 2.5.3 个人中心（Profile）
- **功能模块**：
  - **基本信息**：用户昵称、注册时间、活跃度等级
  - **历史投票**：按时间线展示投票记录，支持日期筛选
  - **组队历史**：参与过的所有组队活动，包括已结束和进行中的
  - **收藏游戏**：管理收藏列表，支持排序和快速访问
  - **数据统计**：个人游戏偏好分析、活跃时段分析等
- **技术实现**：
  - 新增 `/profile` 路由和页面组件
  - 扩展用户相关 API，支持历史数据查询
  - 实现数据分页加载，优化性能
  - 添加数据导出功能（个人数据下载）

#### 2.5.4 定时任务归档
- **归档策略**：
  - 每天 00:00 自动执行归档任务
  - 归档前一天的投票数据和组队数据
  - 生成每日快照，保存统计汇总信息
- **数据模型**：
  ```typescript
  interface DailyArchive {
    objectId: string;
    date: string;              // 归档日期 YYYY-MM-DD
    voteSnapshot: {
      totalVotes: number;      // 总投票数
      wantToPlay: number;      // 想玩的人数
      topGames: GameVoteStat[]; // 热门游戏TOP10
      userStats: UserVoteStat[]; // 用户投票统计
    };
    teamSnapshot: {
      totalTeams: number;      // 总组队数
      activeTeams: number;     // 活跃组队数
      gameStats: GameTeamStat[]; // 游戏组队统计
      timeDistribution: TimeSlotStat[]; // 时间段分布
    };
    createdAt: Date;
  }
  ```
- **技术方案**：
  - LeanCloud 云函数实现定时任务
  - 增量归档，避免重复处理
  - 归档数据压缩存储，节省空间
  - 提供归档数据查询 API

#### 2.5.5 每日投票分享链接
- **功能设计**：
  - 为每日投票结果生成唯一分享链接
  - 链接格式：`/daily-vote/share/{date}/{shareId}`
  - 分享页面展示当日投票统计和热门游戏
  - 支持一键复制链接和社交媒体分享
- **技术实现**：
  - 生成短链接 ID（6-8位字符）
  - 实现分享页面路由和组件
  - 添加 Open Graph 元标签，优化社交媒体预览
  - 统计分享链接访问次数

#### 2.5.6 文件上传功能
- **应用场景**：
  - 游戏截图上传
  - 组队活动图片
  - 用户头像（未来功能）
- **技术方案**：
  - 集成 Ant Design Upload 组件
  - 对接 LeanCloud 文件存储服务
  - 支持图片压缩和格式转换
  - 实现文件类型和大小限制
- **安全措施**：
  - 文件类型白名单验证
  - 文件大小限制（如图片最大 5MB）
  - 病毒扫描（可选）
  - 用户上传配额限制

#### 2.5.7 组件复用优化
- **优化目标**：
  - 提取通用 UI 组件到 `components/common` 目录
  - 建立组件文档和使用示例
  - 统一组件 props 接口设计
- **重点组件**：
  - **DataTable**：通用数据表格组件
  - **SearchBar**：搜索筛选组件
  - **StatCard**：统计卡片组件
  - **TimeRangePicker**：时间范围选择器
  - **ShareButton**：分享按钮组件
- **最佳实践**：
  - 使用 TypeScript 泛型提高复用性
  - 实现组件的主题定制能力
  - 添加组件单元测试

#### 2.5.8 数据类型检查增强
- **检查范围**：
  - 所有 TypeScript 接口和类型定义
  - API 请求和响应的类型验证
  - 组件 props 类型完整性
- **技术方案**：
  - 启用 TypeScript 严格模式
  - 使用 zod 或 yup 进行运行时类型验证
  - 添加类型守卫函数
  - 实现 API 响应的类型安全封装
- **质量保证**：
  - 类型覆盖率达到 95% 以上
  - 消除所有 any 类型使用
  - 添加类型定义的文档注释

## 3. 技术架构

### 3.1 总体架构
```
前端 (React)  →  后端服务 (LeanCloud)  →  数据库 (LeanCloud)
     ↓
  静态部署 (EdgeOne)
```

### 3.2 前端技术栈
- **框架**: React 18 + TypeScript
- **UI库**: Ant Design
- **状态管理**: Zustand
- **路由**: React Router
- **构建工具**: Create React App / Vite
- **样式**: CSS Modules + Ant Design

### 3.3 后端技术栈
- **BaaS平台**: LeanCloud
- **数据存储**: LeanCloud 对象存储
- **用户系统**: LeanCloud 用户系统
- **云函数**: LeanCloud 云引擎（批量导入等）

### 3.4 部署方案
- **前端部署**: 腾讯云 EdgeOne 静态站点托管
- **CDN加速**: EdgeOne 全球节点加速
- **域名配置**: 自定义域名 + HTTPS

## 4. 数据模型设计

### 4.1 用户表 (_User)
```typescript
interface User {
  objectId: string;
  username: string;           // 昵称（唯一）
  favoriteGames: string[];    // 收藏的游戏ID列表
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 游戏表 (Game)
```typescript
interface Game {
  objectId: string;
  name: string;               // 游戏名称
  minPlayers: number;         // 最少人数
  maxPlayers: number;         // 最多人数
  platform?: string;         // 游戏平台
  description?: string;       // 游戏描述
  type?: string;             // 游戏类型
  likeCount: number;         // 点赞数
  createdBy: string;         // 创建者用户ID
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.3 每日投票表 (DailyVote)
```typescript
interface DailyVote {
  objectId: string;
  date: string;              // 投票日期 (YYYY-MM-DD)
  user: string;              // 投票用户ID
  wantsToPlay: boolean;      // 是否想玩
  selectedGames: string[];   // 选择的游戏ID列表
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.4 周末组队表 (WeekendTeam)
```typescript
interface WeekendTeam {
  objectId: string;
  game: string;              // 游戏ID
  eventDate: string;         // 活动日期 (YYYY-MM-DD)
  startTime: string;         // 开始时间 (HH:mm)
  endTime: string;           // 结束时间 (HH:mm)
  leader: string;            // 队长用户ID
  members: string[];         // 成员用户ID列表
  maxMembers: number;        // 最大成员数（从游戏表获取）
  status: 'open' | 'full' | 'closed'; // 组队状态
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.5 每日归档表 (DailyArchive)
```typescript
interface DailyArchive {
  objectId: string;
  date: string;                    // 归档日期 (YYYY-MM-DD)
  voteSnapshot: {
    totalVotes: number;            // 总投票数
    wantToPlay: number;            // 想玩的人数
    topGames: {                    // 热门游戏TOP10
      gameId: string;
      gameName: string;
      voteCount: number;
      tendency: number;            // 平均倾向度
    }[];
    userStats: {                   // 活跃用户统计
      userId: string;
      username: string;
      voteCount: number;
    }[];
  };
  teamSnapshot: {
    totalTeams: number;            // 总组队数
    activeTeams: number;           // 活跃组队数
    gameStats: {                   // 游戏组队统计
      gameId: string;
      gameName: string;
      teamCount: number;
      memberCount: number;
    }[];
    timeDistribution: {            // 时间段分布
      timeSlot: string;            // 如 "18:00-20:00"
      teamCount: number;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.6 文件上传表 (FileUpload)
```typescript
interface FileUpload {
  objectId: string;
  filename: string;                // 原始文件名
  url: string;                     // 文件访问URL
  size: number;                    // 文件大小（字节）
  mimeType: string;                // 文件MIME类型
  uploadedBy: string;              // 上传用户ID
  relatedType?: string;            // 关联类型 (game/team/user)
  relatedId?: string;              // 关联对象ID
  metadata?: {                     // 文件元数据
    width?: number;                // 图片宽度
    height?: number;               // 图片高度
    duration?: number;             // 视频时长
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.7 分享链接表 (ShareLink)
```typescript
interface ShareLink {
  objectId: string;
  shareId: string;                 // 短链接ID (6-8位)
  type: 'daily-vote' | 'team' | 'game'; // 分享类型
  targetDate?: string;             // 目标日期 (投票分享用)
  targetId?: string;               // 目标对象ID
  viewCount: number;               // 访问次数
  createdBy: string;               // 创建用户ID
  expireAt?: Date;                 // 过期时间
  metadata?: {                     // 额外数据
    title?: string;                // 分享标题
    description?: string;          // 分享描述
    thumbnail?: string;            // 缩略图URL
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.8 用户活动日志表 (UserActivityLog)
```typescript
interface UserActivityLog {
  objectId: string;
  userId: string;                  // 用户ID
  activityType: string;            // 活动类型
  targetType?: string;             // 目标类型
  targetId?: string;               // 目标ID
  details?: object;                // 活动详情
  ipAddress?: string;              // IP地址
  userAgent?: string;              // 用户代理
  createdAt: Date;
}
```

## 5. 页面设计

### 5.1 页面结构
```