# 登录持久化功能测试指南

## 测试步骤

### 步骤1：清理现有数据
1. 打开开发者工具（F12）
2. 在控制台中运行：`debugAuth.clearAll()`
3. 或者手动清理：
   - Application → Storage → Local Storage → 删除 `game_group_auth`
   - Application → Storage → Session Storage → 删除 `game_group_auth`

### 步骤2：测试登录功能
1. 刷新页面，应该跳转到登录页面
2. 输入一个昵称（如：测试用户）
3. **确保勾选"记住我（7天内免登录）"**
4. 点击"进入游戏"
5. 登录成功后应该显示："欢迎回来，测试用户！"

### 步骤3：测试持久化
1. 刷新页面（Ctrl+F5 或 F5）
2. **预期结果**：应该自动登录并显示"欢迎回来，测试用户！"
3. **如果失败**：会跳转到登录页面

### 步骤4：检查存储状态
1. 打开开发者工具
2. 在控制台运行：`debugAuth.checkStorage()`
3. 查看详细的存储信息

### 步骤5：调试路由状态
如果出现"自动登录成功但页面没跳转"的问题：
1. 在控制台运行：`debugAuth.debugRoutes()`
2. 检查当前路径和用户状态
3. 如果需要，运行：`debugAuth.simulateAutoLogin()`

### 步骤6：测试会话存储
1. 登录时**不勾选**"记住我"
2. 刷新页面，应该仍然保持登录
3. 关闭浏览器标签页重新打开，应该需要重新登录

## 调试工具

在开发环境下，控制台提供以下调试命令：

```javascript
// 检查存储状态
debugAuth.checkStorage()

// 清空所有存储
debugAuth.clearAll()

// 测试存储功能
debugAuth.testStorage()

// 调试路由状态（新增）
debugAuth.debugRoutes()

// 模拟自动登录（新增）
debugAuth.simulateAutoLogin()

// 检查Auth Store状态（新增）
authStore.getState()
```

## 排查问题

### 问题1：刷新后仍需重新登录
**可能原因**：
- 没有勾选"记住我"选项
- 本地存储被禁用或清理
- 加密/解密失败

**检查方法**：
1. 运行 `debugAuth.checkStorage()` 查看是否有存储数据
2. 检查控制台是否有错误信息
3. 确认登录时勾选了"记住我"

### 问题2：自动登录成功但页面没跳转
**可能原因**：
- 路由状态同步问题
- 登录状态更新延迟
- ProtectedRoute组件逻辑问题

**检查方法**：
1. 运行 `debugAuth.debugRoutes()` 查看路由和状态
2. 检查控制台登录日志
3. 运行 `authStore.getState()` 查看当前用户状态
4. 如果状态正确但页面没跳转，手动刷新页面

**解决方法**：
1. 运行 `debugAuth.simulateAutoLogin()` 重新触发登录
2. 手动导航：在控制台运行 `window.location.href = '/'`

### 问题3：控制台显示解密失败
**可能原因**：
- 密钥配置问题
- 存储数据被篡改
- crypto-js库问题

**解决方法**：
1. 运行 `debugAuth.clearAll()` 清空存储
2. 重新登录
3. 检查 `.env.local` 中的密钥配置

### 问题4：antd message警告
这个警告已经通过以下方式解决：
- App.tsx 中使用了 `<AntdApp>` 包装
- 登录页面使用了 `App.useApp()` Hook
- 其他组件使用了 `useMessage()` Hook

如果仍然出现警告，请检查是否有组件直接使用了 `message.xxx()` 静态方法。

## 技术实现

### 存储键
- **localStorage**: `game_group_auth`（记住我时）
- **sessionStorage**: `game_group_auth`（不记住我时）

### 数据格式
```javascript
{
  user: {
    objectId: "用户ID",
    username: "用户名",
    favoriteGames: [],
    createdAt: "创建时间",
    updatedAt: "更新时间"
  },
  timestamp: 1234567890123,  // 保存时间戳
  rememberMe: true           // 是否记住登录
}
```

### 加密方式
使用 CryptoJS.AES 加密，密钥来自环境变量或默认值。

### 路由保护逻辑
```javascript
// ProtectedRoute 组件逻辑
if (isLoading) {
  // 显示加载状态
  return <Spin />;
}

if (!user) {
  // 跳转到登录页
  return <Navigate to="/login" />;
}

// 显示受保护内容
return children;
```

## 预期行为

✅ **正常情况**：
- 登录时勾选"记住我" → 7天内自动登录
- 登录时不勾选"记住我" → 会话期间保持登录
- 超过7天 → 自动清理，需要重新登录
- 手动退出 → 清理所有存储
- 自动登录成功 → 从登录页跳转到主页

❌ **异常情况**：
- 解密失败 → 自动清理存储，跳转登录页
- 用户不存在 → 清理存储，显示"登录信息已过期"
- 网络错误 → 显示错误信息，保留存储供下次尝试
- 路由同步问题 → 使用调试工具手动修复

## 状态流程图

```
应用启动
    ↓
检查本地存储
    ↓
有保存的用户信息？
    ↓        ↓
   是        否
    ↓        ↓
自动登录   检查当前session
    ↓        ↓
登录成功？   有session？
    ↓        ↓
   是        是/否
    ↓        ↓
跳转主页   保持当前状态/跳转登录页
``` 