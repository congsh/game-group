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

## 5. 页面设计

### 5.1 页面结构
```
├── 登录页 (/login)
├── 主页 (/)
│   ├── 游戏库 (/games)
│   ├── 每日投票 (/daily-vote)
│   └── 周末组队 (/weekend-teams)
├── 游戏详情页 (/games/:id)
├── 我的收藏 (/favorites)
└── 我的组队 (/my-teams)
```

### 5.2 导航设计
- **顶部导航**: Logo + 主要功能入口 + 用户信息
- **侧边导航**: 移动端收缩式菜单
- **底部导航**: 移动端主要功能快捷入口

### 5.3 响应式设计
- **桌面端**: 1200px+ 三栏布局
- **平板端**: 768px-1199px 两栏布局
- **移动端**: <768px 单栏布局 + 底部导航

## 6. 用户体验设计

### 6.1 交互流程
1. **首次访问**: 昵称登录 → 浏览游戏库 → 参与投票/组队
2. **日常使用**: 快速登录 → 每日投票 → 查看组队
3. **周末组队**: 创建/加入组队 → 等待匹配 → 确认参与

### 6.2 关键体验点
- **登录简化**: 只需昵称，无需复杂注册流程
- **操作便捷**: 一键投票、一键加入组队
- **信息清晰**: 实时显示投票结果和组队状态
- **反馈及时**: 操作成功/失败的即时提示

### 6.3 移动端优化
- **触摸友好**: 按钮大小适配手指触摸
- **滑动操作**: 支持左右滑动切换功能模块
- **快捷操作**: 常用功能在首屏可见

## 7. 性能与安全

### 7.1 性能优化
- **代码分割**: 按页面拆分 JavaScript 包
- **图片优化**: WebP 格式 + 懒加载
- **缓存策略**: 静态资源长期缓存 + API 合理缓存
- **CDN加速**: EdgeOne 全球节点部署

### 7.2 安全考虑
- **输入验证**: 前后端双重验证用户输入
- **权限控制**: 基于用户ID的操作权限验证
- **数据保护**: HTTPS 传输 + LeanCloud 安全机制
- **防刷机制**: 投票和组队的频率限制

## 8. 扩展规划

### 8.1 功能扩展
- **实时聊天**: 组队内部沟通
- **积分系统**: 参与度奖励机制
- **游戏推荐**: 基于历史数据的智能推荐
- **活动统计**: 个人和群体的游戏统计

### 8.2 技术扩展
- **PWA支持**: 离线缓存 + 桌面安装
- **推送通知**: 组队提醒 + 投票提醒
- **数据分析**: 用户行为统计
- **API开放**: 第三方集成接口

---

本设计文档将作为开发的指导文档，后续开发过程中会根据实际情况进行调整和完善。 