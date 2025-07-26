# 游戏组队平台 - 开发文档

## 1. 开发环境搭建

### 1.1 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0
- Git

### 1.2 LeanCloud 配置

1. 注册 LeanCloud 账号：https://leancloud.cn/
2. 创建新应用，获取以下信息：
   - App ID
   - App Key
   - Server URL (国际版需要)

### 1.3 项目初始化

```bash
# 克隆项目
git clone <repository-url>
cd GameGroup

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 LeanCloud 配置
```

## 2. 开发计划

### 阶段一：项目基础搭建（第1-2天）

- [X] 项目文档创建
- [X] React 项目初始化
- [X] 基础目录结构搭建
- [X] LeanCloud SDK 集成
- [X] 基础路由配置
- [X] UI 框架集成

### 阶段二：用户系统（第3-4天）

- [X] 用户登录页面
- [X] 登录逻辑实现
- [X] 用户状态管理
- [X] 登录鉴权中间件

### 阶段三：游戏库模块（第5-7天）

- [X] 游戏列表页面
- [X] 游戏添加/编辑表单
- [X] 游戏删除功能
- [X] 批量导入功能
- [X] 收藏/点赞功能

### 阶段四：每日投票模块（第8-9天）

- [X] 投票页面UI
- [X] 投票逻辑实现
- [X] 投票结果统计
- [X] 每日重置机制

### 阶段五：周末组队模块（第10-12天）

- [X] 组队创建页面
- [X] 组队列表展示
- [X] 组队加入功能
- [X] 智能匹配推荐

### 阶段六：功能增强（第13-15天）

- [X] 报表功能系统
- [X] 数据可视化
- [X] 响应式优化
- [X] 性能优化

### 阶段七：新功能开发第一批（当前阶段）

#### 7.1 登录持久化与投票优化（1天）
- [ ] 实现登录信息本地存储
- [ ] 添加自动登录功能
- [ ] 优化投票列表展示
- [ ] 添加投票记录滚动加载

#### 7.2 个人中心模块（2天）
- [ ] 创建个人中心页面路由
- [ ] 实现基本信息展示

#### 7.3 文件分享模块优化（已完成）
- [x] 移除 isPublic 字段，简化文件权限逻辑
- [x] 统一文件访问控制，通过七牛云签名URL确保安全性
- [x] 优化 ACL 设置，所有文件记录均可被查询
- [x] 简化上传界面，移除"公开文件"选项
- [x] 修复生产环境文件上传成功但不显示的问题

### 阶段八：新功能开发第二批

#### 8.1 分享功能（1.5天）
- [ ] 实现分享链接生成
- [ ] 开发分享页面组件
- [ ] 添加社交媒体集成
- [ ] 实现访问统计功能

#### 8.2 文件上传系统（2天）
- [ ] 集成上传组件
- [ ] 实现文件存储服务
- [ ] 添加文件管理功能
- [ ] 实现安全验证机制

#### 8.3 组件优化与类型检查（1.5天）
- [ ] 提取通用组件
- [ ] 优化组件复用性
- [ ] 增强类型定义
- [ ] 添加运行时验证

### 阶段九：部署与优化（第20-21天）

- [ ] 错误处理完善
- [ ] EdgeOne 部署配置
- [ ] 性能测试与优化
- [ ] 用户体验优化

## 3. 目录结构

```
src/
├── components/              # 通用组件
│   ├── common/             # 基础组件
│   │   ├── Loading/        # 加载组件
│   │   ├── ErrorBoundary/  # 错误边界
│   │   └── ConfirmModal/   # 确认对话框
│   ├── layout/             # 布局组件
│   │   ├── Header/         # 顶部导航
│   │   ├── Sidebar/        # 侧边栏
│   │   └── Footer/         # 底部导航
│   └── ui/                 # UI组件
├── pages/                  # 页面组件
│   ├── Login/              # 登录页
│   ├── Games/              # 游戏库
│   ├── DailyVote/          # 每日投票
│   ├── WeekendTeams/       # 周末组队
│   └── Profile/            # 个人中心
├── services/               # API服务
│   ├── leancloud.ts        # LeanCloud 配置
│   ├── auth.ts             # 认证服务
│   ├── games.ts            # 游戏相关API
│   ├── votes.ts            # 投票相关API
│   └── teams.ts            # 组队相关API
├── store/                  # 状态管理
│   ├── auth.ts             # 用户状态
│   ├── games.ts            # 游戏状态
│   ├── votes.ts            # 投票状态
│   └── teams.ts            # 组队状态
├── types/                  # TypeScript 类型定义
│   ├── user.ts             # 用户类型
│   ├── game.ts             # 游戏类型
│   ├── vote.ts             # 投票类型
│   └── team.ts             # 组队类型
├── utils/                  # 工具函数
│   ├── date.ts             # 日期处理
│   ├── validation.ts       # 表单验证
│   └── storage.ts          # 本地存储
├── hooks/                  # 自定义Hook
│   ├── useAuth.ts          # 认证Hook
│   ├── useGames.ts         # 游戏Hook
│   └── useLocalStorage.ts  # 本地存储Hook
├── styles/                 # 样式文件
│   ├── global.css          # 全局样式
│   ├── variables.css       # CSS变量
│   └── responsive.css      # 响应式样式
├── App.tsx                 # 主应用组件
├── index.tsx               # 应用入口
└── setupTests.ts           # 测试配置
```

## 4. 开发规范

### 4.1 代码规范

- 使用 TypeScript 严格模式
- 组件名使用 PascalCase
- 文件名使用 PascalCase（组件）或 camelCase（工具函数）
- 使用 ESLint + Prettier 格式化代码

### 4.2 组件规范

```typescript
// 组件文件结构示例
import React from 'react';
import { Button } from 'antd';
import styles from './GameCard.module.css';

interface GameCardProps {
  game: Game;
  onEdit?: (game: Game) => void;
  onDelete?: (gameId: string) => void;
}

/**
 * 游戏卡片组件
 * @param game 游戏数据
 * @param onEdit 编辑回调
 * @param onDelete 删除回调
 */
export const GameCard: React.FC<GameCardProps> = ({
  game,
  onEdit,
  onDelete
}) => {
  // 组件逻辑
  return (
    <div className={styles.card}>
      {/* 组件内容 */}
    </div>
  );
};
```

### 4.3 API 调用规范

```typescript
// API服务示例
import AV from 'leancloud-storage';

/**
 * 获取游戏列表
 * @param page 页码
 * @param limit 每页数量
 * @returns 游戏列表
 */
export const getGames = async (page = 1, limit = 20): Promise<Game[]> => {
  try {
    const query = new AV.Query('Game');
    query.skip((page - 1) * limit);
    query.limit(limit);
    query.descending('createdAt');
  
    const results = await query.find();
    return results.map(item => ({
      objectId: item.id,
      name: item.get('name'),
      minPlayers: item.get('minPlayers'),
      maxPlayers: item.get('maxPlayers'),
      // ... 其他字段
    }));
  } catch (error) {
    console.error('获取游戏列表失败:', error);
    throw error;
  }
};
```

### 4.4 状态管理规范

```typescript
// Zustand store示例
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // 操作方法
  login: (username: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  
  login: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      // 登录逻辑
      const user = await authService.login(username);
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  logout: () => {
    authService.logout();
    set({ user: null });
  },
  
  clearError: () => set({ error: null })
}));
```

## 5. 新功能技术实现指南

### 5.1 登录持久化实现

```typescript
// utils/auth-storage.ts
import CryptoJS from 'crypto-js';

const AUTH_KEY = 'game_group_auth';
const SECRET_KEY = process.env.REACT_APP_SECRET_KEY || 'default_secret';

export const authStorage = {
  // 保存登录信息
  saveAuth: (user: User, rememberMe: boolean = false) => {
    const data = {
      user,
      timestamp: Date.now(),
      rememberMe
    };
    
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data), 
      SECRET_KEY
    ).toString();
    
    if (rememberMe) {
      localStorage.setItem(AUTH_KEY, encrypted);
    } else {
      sessionStorage.setItem(AUTH_KEY, encrypted);
    }
  },
  
  // 获取登录信息
  getAuth: (): User | null => {
    const encrypted = localStorage.getItem(AUTH_KEY) || 
                     sessionStorage.getItem(AUTH_KEY);
    
    if (!encrypted) return null;
    
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      const data = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      
      // 检查是否过期（7天）
      if (Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000) {
        authStorage.clearAuth();
        return null;
      }
      
      return data.user;
    } catch (error) {
      console.error('解密失败:', error);
      return null;
    }
  },
  
  // 清除登录信息
  clearAuth: () => {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
  }
};
```

### 5.2 投票列表虚拟滚动

```typescript
// components/common/VirtualList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
}

export function VirtualList<T>({ 
  items, 
  height, 
  renderItem,
  itemHeight = 60 
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5
  });
  
  return (
    <div ref={parentRef} style={{ height, overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5.3 个人中心数据聚合

```typescript
// services/profile.ts
export const profileService = {
  // 获取用户统计数据
  getUserStats: async (userId: string) => {
    const [votes, teams, favorites] = await Promise.all([
      // 获取投票历史
      new AV.Query('DailyVote')
        .equalTo('user', userId)
        .descending('createdAt')
        .limit(1000)
        .find(),
      
      // 获取组队历史
      new AV.Query('WeekendTeam')
        .containedIn('members', [userId])
        .include(['game'])
        .descending('createdAt')
        .find(),
      
      // 获取收藏游戏
      new AV.Query('UserFavorite')
        .equalTo('user', userId)
        .include(['game'])
        .find()
    ]);
    
    return {
      totalVotes: votes.length,
      voteHistory: votes.map(formatVote),
      totalTeams: teams.length,
      teamHistory: teams.map(formatTeam),
      favoriteGames: favorites.map(f => f.get('game'))
    };
  },
  
  // 获取游戏偏好分析
  getGamePreferences: async (userId: string) => {
    const votes = await new AV.Query('DailyVote')
      .equalTo('user', userId)
      .descending('createdAt')
      .limit(100)
      .find();
    
    // 统计游戏出现频率
    const gameFrequency = new Map<string, number>();
    votes.forEach(vote => {
      const games = vote.get('selectedGames') || [];
      games.forEach((gameId: string) => {
        gameFrequency.set(gameId, (gameFrequency.get(gameId) || 0) + 1);
      });
    });
    
    // 转换为排序数组
    return Array.from(gameFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }
};
```

### 5.4 定时归档云函数

```javascript
// cloud/functions/dailyArchive.js
AV.Cloud.define('dailyArchive', async (request) => {
  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
  
  // 检查是否已归档
  const existing = await new AV.Query('DailyArchive')
    .equalTo('date', yesterday)
    .first();
  
  if (existing) {
    return { message: '已存在归档数据' };
  }
  
  // 获取昨日投票数据
  const votes = await new AV.Query('DailyVote')
    .equalTo('date', yesterday)
    .include(['user'])
    .limit(1000)
    .find();
  
  // 获取昨日组队数据
  const teams = await new AV.Query('WeekendTeam')
    .equalTo('eventDate', yesterday)
    .include(['game', 'leader'])
    .find();
  
  // 统计数据
  const voteStats = calculateVoteStats(votes);
  const teamStats = calculateTeamStats(teams);
  
  // 创建归档记录
  const archive = new AV.Object('DailyArchive');
  archive.set('date', yesterday);
  archive.set('voteSnapshot', voteStats);
  archive.set('teamSnapshot', teamStats);
  
  await archive.save();
  
  return { 
    message: '归档成功',
    date: yesterday,
    voteCount: votes.length,
    teamCount: teams.length
  };
});

// 设置定时任务
AV.Cloud.useMasterKey();
AV.Cloud.startJob('dailyArchiveJob', {
  cronTime: '0 0 * * *', // 每天00:00执行
  job: 'dailyArchive'
});
```

### 5.5 分享链接生成

```typescript
// utils/share.ts
import { nanoid } from 'nanoid';

export const shareUtils = {
  // 生成分享链接
  generateShareLink: async (type: string, targetId: string) => {
    const shareId = nanoid(8); // 8位随机ID
    
    const shareLink = new AV.Object('ShareLink');
    shareLink.set('shareId', shareId);
    shareLink.set('type', type);
    shareLink.set('targetId', targetId);
    shareLink.set('viewCount', 0);
    shareLink.set('createdBy', AV.User.current()?.id);
    
    await shareLink.save();
    
    return {
      shareId,
      url: `${window.location.origin}/share/${shareId}`,
      shortUrl: `${window.location.host}/s/${shareId}`
    };
  },
  
  // 复制到剪贴板
  copyToClipboard: async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('链接已复制到剪贴板');
    } catch (error) {
      // 降级方案
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      message.success('链接已复制');
    }
  },
  
  // 分享到社交媒体
  shareToSocial: (platform: string, url: string, title: string) => {
    const shareUrls = {
      weibo: `https://service.weibo.com/share/share.php?url=${url}&title=${title}`,
      qq: `https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`,
      wechat: `weixin://dl/business/?url=${url}` // 需要微信SDK
    };
    
    window.open(shareUrls[platform], '_blank');
  }
};
```

### 5.6 文件上传服务

```typescript
// services/upload.ts
import { RcFile } from 'antd/lib/upload';
import imageCompression from 'browser-image-compression';

export const uploadService = {
  // 上传图片
  uploadImage: async (file: RcFile, options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
  }) => {
    // 图片压缩
    const compressedFile = await imageCompression(file, {
      maxSizeMB: options?.maxSizeMB || 2,
      maxWidthOrHeight: options?.maxWidthOrHeight || 1920,
      useWebWorker: true
    });
    
    // 创建AV文件对象
    const avFile = new AV.File(file.name, compressedFile);
    
    // 设置文件元数据
    avFile.metaData('owner', AV.User.current()?.id);
    avFile.metaData('uploadTime', new Date().toISOString());
    
    // 上传文件
    const savedFile = await avFile.save();
    
    // 保存文件记录
    const fileRecord = new AV.Object('FileUpload');
    fileRecord.set('filename', file.name);
    fileRecord.set('url', savedFile.url());
    fileRecord.set('size', compressedFile.size);
    fileRecord.set('mimeType', compressedFile.type);
    fileRecord.set('uploadedBy', AV.User.current()?.id);
    
    await fileRecord.save();
    
    return {
      id: fileRecord.id,
      url: savedFile.url(),
      thumbnail: savedFile.thumbnailURL(200, 200)
    };
  },
  
  // 验证文件
  validateFile: (file: RcFile): Promise<boolean> => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return Promise.reject(false);
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB！');
      return Promise.reject(false);
    }
    
    return Promise.resolve(true);
  }
};
```

## 6. 测试策略

### 6.1 单元测试

- 使用 Jest + React Testing Library
- 组件渲染测试
- 用户交互测试
- API 调用 Mock 测试

### 6.2 集成测试

- 页面流程测试
- 用户登录流程测试
- 数据 CRUD 操作测试

### 6.3 端到端测试

- 使用 Cypress 进行 E2E 测试
- 关键用户流程自动化测试

## 7. 部署配置

### 7.1 构建优化

```json
// package.json 构建脚本
{
  "scripts": {
    "build": "react-scripts build",
    "build:analyze": "npm run build && npx serve -s build",
    "build:prod": "CI=false npm run build"
  }
}
```

### 7.2 EdgeOne 部署

1. 执行 `npm run build` 生成构建文件
2. 登录腾讯云 EdgeOne 控制台
3. 创建站点并配置静态托管
4. 上传 `build` 目录下的所有文件
5. 配置自定义域名和 HTTPS

### 7.3 环境变量配置

```bash
# .env.production
REACT_APP_LEANCLOUD_APP_ID=your_app_id
REACT_APP_LEANCLOUD_APP_KEY=your_app_key
REACT_APP_LEANCLOUD_SERVER_URL=your_server_url
REACT_APP_ENV=production
```

## 8. 常见问题解决

### 8.1 LeanCloud 相关

- **跨域问题**: 在 LeanCloud 控制台配置允许的域名
- **API 调用失败**: 检查 App ID 和 App Key 是否正确
- **权限错误**: 确认数据表的 ACL 设置

### 8.2 开发环境

- **依赖安装失败**: 清除 node_modules 重新安装
- **端口冲突**: 修改 package.json 中的启动端口
- **TypeScript 错误**: 检查类型定义是否正确

## 9. 性能优化

### 9.1 代码分割

```typescript
// 路由懒加载
const Games = lazy(() => import('../pages/Games/Games'));
const DailyVote = lazy(() => import('../pages/DailyVote/DailyVote'));
const WeekendTeams = lazy(() => import('../pages/WeekendTeams/WeekendTeams'));
```

### 9.2 数据缓存

```typescript
// React Query 数据缓存
export const useGames = () => {
  return useQuery({
    queryKey: ['games'],
    queryFn: getGames,
    staleTime: 5 * 60 * 1000, // 5分钟
    cacheTime: 10 * 60 * 1000, // 10分钟
  });
};
```

---

本开发文档将随着项目进展持续更新，确保开发团队有明确的指导和参考。
