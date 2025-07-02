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
- [x] 项目文档创建
- [ ] React 项目初始化
- [ ] 基础目录结构搭建
- [ ] LeanCloud SDK 集成
- [ ] 基础路由配置
- [ ] UI 框架集成

### 阶段二：用户系统（第3-4天）
- [ ] 用户登录页面
- [ ] 登录逻辑实现
- [ ] 用户状态管理
- [ ] 登录鉴权中间件

### 阶段三：游戏库模块（第5-7天）
- [ ] 游戏列表页面
- [ ] 游戏添加/编辑表单
- [ ] 游戏删除功能
- [ ] 批量导入功能
- [ ] 收藏/点赞功能

### 阶段四：每日投票模块（第8-9天）
- [ ] 投票页面UI
- [ ] 投票逻辑实现
- [ ] 投票结果统计
- [ ] 每日重置机制

### 阶段五：周末组队模块（第10-12天）
- [ ] 组队创建页面
- [ ] 组队列表展示
- [ ] 组队加入功能
- [ ] 智能匹配推荐

### 阶段六：优化与部署（第13-14天）
- [ ] 响应式优化
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] EdgeOne 部署配置

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

## 5. 关键技术实现

### 5.1 昵称登录实现
```typescript
/**
 * 昵称登录逻辑
 * 1. 检查昵称是否已存在
 * 2. 存在则直接登录，不存在则创建新用户
 */
export const loginWithNickname = async (nickname: string): Promise<User> => {
  try {
    // 尝试查找已存在的用户
    const query = new AV.Query(AV.User);
    query.equalTo('username', nickname);
    const existingUser = await query.first();
    
    if (existingUser) {
      // 用户已存在，直接登录
      await AV.User.logIn(nickname, 'default_password');
      return existingUser;
    } else {
      // 用户不存在，创建新用户
      const user = new AV.User();
      user.setUsername(nickname);
      user.setPassword('default_password'); // 使用默认密码
      await user.signUp();
      return user;
    }
  } catch (error) {
    throw new Error(`登录失败: ${error.message}`);
  }
};
```

### 5.2 批量导入实现
```typescript
/**
 * 批量导入游戏
 * 支持CSV和JSON格式
 */
export const batchImportGames = async (
  file: File, 
  format: 'csv' | 'json'
): Promise<void> => {
  const text = await file.text();
  let games: Partial<Game>[] = [];
  
  if (format === 'csv') {
    games = parseCSV(text);
  } else {
    games = JSON.parse(text);
  }
  
  // 云函数批量处理
  const result = await AV.Cloud.run('batchCreateGames', { games });
  return result;
};
```

### 5.3 智能推荐算法
```typescript
/**
 * 周末组队智能推荐
 * 基于用户收藏游戏和时间匹配
 */
export const getRecommendedTeams = async (userId: string): Promise<WeekendTeam[]> => {
  // 获取用户收藏的游戏
  const user = await getUserById(userId);
  const favoriteGameIds = user.favoriteGames || [];
  
  // 查询相关游戏的组队
  const query = new AV.Query('WeekendTeam');
  query.containedIn('game', favoriteGameIds);
  query.equalTo('status', 'open');
  query.include(['game', 'leader']);
  
  const teams = await query.find();
  
  // 按推荐分数排序
  return teams.sort((a, b) => {
    const scoreA = calculateRecommendScore(a, user);
    const scoreB = calculateRecommendScore(b, user);
    return scoreB - scoreA;
  });
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