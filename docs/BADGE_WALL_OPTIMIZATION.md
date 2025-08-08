# 勋章墙查询优化说明

## 问题描述

在勋章墙功能中，出现了大量的 429 错误（Too many requests），主要表现为：

```
Failed to load resource: the server responded with a status of 429 ()
获取用户信息失败: Error: Too many requests. [429 GET `https://kdx6azmd.lc-cn-n1-shared.com/1.1/classes/_User/xxx`]
获取用户勋章失败: Error: Too many requests. [429 GET `https://kdx6azmd.lc-cn-n1-shared.com/1.1/classes/Badge`]
```

## 问题原因分析

### 1. 并发请求过多

在 `getEnabledBadgeWallUsers()` 方法中，原始实现对每个启用勋章墙的用户都会并发发起两个 API 请求：
- 获取用户信息：`getUserById(userId)`
- 获取用户勋章：`getUserBadges(userId)`

如果有 N 个用户启用了勋章墙，就会同时发起 2N 个并发请求，这很容易触发 LeanCloud 的请求频率限制。

### 2. 重复查询

原始代码中没有缓存机制，每次加载勋章墙列表都会重新查询所有数据，造成不必要的重复请求。

## 优化方案

### 1. 批量查询优化

将原来的并发单个查询改为批量查询：

```typescript
// 原始方案：并发查询每个用户
const results = await Promise.all(
  userIds.map(async (userId) => {
    const [user, badges] = await Promise.all([
      this.getUserById(userId),    // N个并发请求
      this.getUserBadges(userId)   // N个并发请求
    ]);
    // ...
  })
);

// 优化方案：批量查询
// 1. 批量获取用户信息
const userQuery = new AV.Query('_User');
userQuery.containedIn('objectId', userIds);
const users = await userQuery.find();  // 1个请求

// 2. 批量获取勋章信息
const badgeQuery = new AV.Query('Badge');
badgeQuery.containedIn('receiverUserId', userIds);
const badges = await badgeQuery.find();  // 1个请求
```

### 2. 请求队列机制

添加请求队列来控制并发请求数量：

```typescript
class BadgeService {
  private requestQueue: Promise<any> = Promise.resolve();
  private readonly REQUEST_DELAY = 100; // 请求间隔100ms

  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    this.requestQueue = this.requestQueue.then(async () => {
      await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY));
      return requestFn();
    });
    return this.requestQueue;
  }
}
```

### 3. 用户信息缓存

添加用户信息缓存，避免重复查询：

```typescript
class BadgeService {
  private userCache = new Map<string, { username: string; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  private getCachedUser(userId: string): { username: string } | null {
    const cached = this.userCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return { username: cached.username };
    }
    return null;
  }
}
```

## 优化效果

### 请求数量减少

- **优化前**：N个用户 = 2N个并发请求
- **优化后**：N个用户 = 2个批量请求 + 缓存机制

### 性能提升

1. **减少网络请求**：从 2N 个请求减少到 2 个请求
2. **避免并发限制**：通过请求队列控制并发数量
3. **提高响应速度**：缓存机制减少重复查询
4. **降低服务器压力**：批量查询比单个查询更高效

## 相关文件

- `src/services/badges.ts` - 主要优化文件
- `src/components/ui/BadgeWallList.tsx` - 调用方

## 注意事项

1. 缓存时间设置为 5 分钟，可根据实际需求调整
2. 请求间隔设置为 100ms，可根据 LeanCloud 限制调整
3. 如果用户数量很大，可能需要进一步优化，如分页查询