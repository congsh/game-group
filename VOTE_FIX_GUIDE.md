# 每日投票功能修复指南

## 问题描述

用户在使用每日投票功能时遇到 `DailyVote` 表不存在的404错误：

```
Error: Class or object doesn't exists. [404 GET https://kdx6azmd.lc-cn-n1-shared.com/1.1/classes/DailyVote]
```

## 修复方案

### 1. 自动修复机制

已在投票服务层添加自动修复机制：

- **`src/services/votes.ts`**: 在 `getTodayVote`、`submitTodayVote` 和 `getTodayVoteStats` 函数中添加404错误处理
- 当检测到404错误时，自动调用 `initDailyVoteTable()` 创建表结构
- 创建表后重新执行原始操作

### 2. 手动修复按钮

在每日投票页面添加手动修复功能：

- **`src/pages/DailyVote/DailyVote.tsx`**: 添加手动修复按钮
- 当显示404相关错误时，用户可以点击"点击修复数据表"按钮
- 手动修复会调用 `initDailyVoteTable()` 函数

### 3. 数据表初始化优化

优化了 `src/utils/initData.ts` 中的初始化逻辑：

- 移除了预检查（因为预检查也会触发404错误）
- 直接创建占位符记录来建立表结构
- 使用真实用户ID而不是占位符字符串
- 创建后立即删除占位符记录

## 使用方法

### 方法1：等待自动修复

1. 正常使用投票功能
2. 如果遇到404错误，系统会自动尝试修复
3. 修复成功后会自动重试原操作

### 方法2：手动修复

1. 进入每日投票页面
2. 如果看到包含 "doesn't exists" 的错误提示
3. 点击错误提示中的"点击修复数据表"按钮
4. 等待修复完成提示
5. 刷新页面或重新操作

### 方法3：控制台修复

开发者可以在浏览器控制台中执行：

```javascript
window.manualInitTables()
```

## 修复后的功能

✅ **自动错误处理**: 遇到404错误时自动创建表结构  
✅ **用户友好提示**: 显示清晰的错误信息和修复按钮  
✅ **无数据丢失**: 修复过程不会影响现有数据  
✅ **一次性修复**: 表创建后永久解决问题  

## 技术细节

### 错误检测
```typescript
if (error.code === 404) {
  console.log('DailyVote表不存在，尝试自动创建...');
  await initDailyVoteTable();
  // 重新执行原操作
}
```

### 表结构创建
```typescript
const placeholderVote = new DailyVoteClass();
placeholderVote.set('date', today);
placeholderVote.set('user', currentUser.id);
placeholderVote.set('wantsToPlay', false);
placeholderVote.set('selectedGames', []);
await placeholderVote.save();
await placeholderVote.destroy(); // 清理占位符
```

## 注意事项

1. **用户需要登录**: 修复功能需要用户处于登录状态
2. **网络连接**: 确保与LeanCloud服务器连接正常
3. **权限要求**: 确保应用有创建数据表的权限

## 相关文件

- `src/services/votes.ts` - 投票服务层
- `src/pages/DailyVote/DailyVote.tsx` - 投票页面
- `src/utils/initData.ts` - 数据初始化工具
- `src/store/votes.ts` - 投票状态管理

## 测试建议

1. 清除LeanCloud控制台中的DailyVote表
2. 刷新应用并尝试投票
3. 验证自动修复是否工作
4. 测试手动修复按钮功能 