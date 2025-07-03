# 故障排除指南

## 常见问题及解决方案

### 1. 周末组队页面显示"未知游戏"和"未知队长"

**问题原因**: LeanCloud 采用"懒创建"机制，数据表在首次使用时才会被创建。如果游戏数据或用户数据缺失，会显示占位符文本。

**解决方案**:

#### 方法一: 使用快速修复工具（推荐）
1. 登录系统
2. 按 F12 打开浏览器开发者工具
3. 在控制台（Console）中输入以下命令：
```javascript
quickFixMissingTables()
```
4. 等待修复完成，刷新页面

#### 方法二: 手动初始化
1. 登录系统
2. 按 F12 打开浏览器开发者工具
3. 在控制台中输入：
```javascript
manualInitTables()
```
4. 等待初始化完成

### 2. 报表页面出现404错误（UserFavorite表不存在）

**错误信息**: 
```
GET https://xxx.lc-cn-n1-shared.com/1.1/classes/UserFavorite 404 (Not Found)
Class or object doesn't exists.
```

**解决方案**:

#### 方法一: 自动修复（推荐）
报表服务已经内置了自动修复机制，当检测到表不存在时会自动创建。如果自动修复失败，请使用方法二。

#### 方法二: 手动修复
1. 确保已登录系统
2. 打开浏览器开发者工具（F12）
3. 在控制台中执行：
```javascript
quickFixMissingTables()
```
4. 等待修复完成，刷新页面

### 3. 游戏库为空或数据缺失

**解决方案**:
1. 打开开发者工具
2. 执行快速修复：
```javascript
quickFixMissingTables()
```
3. 或者访问游戏库页面，点击"批量导入"按钮导入示例数据

### 4. 投票功能无法使用

**解决方案**:
1. 确保游戏库中有数据（参考问题3的解决方案）
2. 执行数据表修复：
```javascript
quickFixMissingTables()
```

### 数据表缺失问题 (404错误)

如果遇到类似以下错误：
- `Game Class or object doesn't exists`
- `DailyVote Class or object doesn't exists` 
- `WeekendTeam Class or object doesn't exists`
- `UserFavorite Class or object doesn't exists`

**快速解决方案**：
1. 打开浏览器控制台 (F12)
2. 输入以下命令：
```javascript
// 快速修复所有缺失的数据表
quickFixMissingTables()

// 或者手动初始化所有表
manualInitTables()
```

### 报表页面显示异常

如果报表页面显示空白或错误，可能是UserFavorite表不存在。

**解决方案**：
```javascript
// 检查收藏数据一致性
checkFavoriteDataConsistency()

// 修复收藏数据不一致问题
fixFavoriteDataConsistency()
```

### 收藏功能数据同步问题

**问题描述**：收藏游戏后，_User表的favoriteGames字段有数据，但UserFavorite表没有对应记录，导致报表统计不准确。

**解决方案**：

1. **检查数据一致性**：
```javascript
// 在控制台运行
checkFavoriteDataConsistency()
```
这会返回详细的检查结果，包括：
- 数据是否一致
- 具体的不一致问题
- 统计信息

2. **自动修复数据**：
```javascript
// 一键修复所有收藏数据问题
fixFavoriteDataConsistency()
```
这个函数会：
- 自动检查数据一致性
- 将_User表的收藏数据同步到UserFavorite表
- 修复历史数据不一致的问题

3. **手动迁移数据**（高级用户）：
```javascript
// 手动执行数据迁移
migrateFavoriteData()
```

**功能说明**：
- 从v1.3版本开始，收藏功能会同时维护两个表的数据
- `_User.favoriteGames`：用户收藏的游戏ID列表
- `UserFavorite`：每个收藏关系的独立记录，用于报表统计

**预防措施**：
- 新的收藏操作会自动同步两个表
- 如果UserFavorite表不存在，系统会自动创建
- 建议定期运行数据一致性检查

### 组队功能问题

如果遇到"未知游戏"或"未知队长"的显示问题：

**解决方案**：
```javascript
// 修复数据表
quickFixMissingTables()
```

然后刷新页面即可。

### 投票功能异常

如果投票页面无法正常工作：

**解决方案**：
```javascript
// 手动初始化投票表
manualInitTables()
```

### Dashboard权限错误 (403 Forbidden)

**问题描述**：Dashboard页面显示"获取用户数量失败: Error: Forbidden to find by class '_User' permissions. [403 GET]"错误。

**原因分析**：LeanCloud的`_User`表有默认的权限限制，不允许普通用户查询其他用户信息。

**解决方案**：
- 已在v1.3版本中移除用户数量统计功能
- Dashboard现在只显示游戏总数、今日投票、活跃组队三个统计项
- 如果仍遇到此错误，请刷新页面

**技术说明**：
- 移除了`getUserCount()`函数及其调用
- 调整统计卡片布局为3列平均分布
- 保持其他功能正常运行

## 预防措施

### 1. 定期备份数据
建议定期在报表页面导出数据作为备份。

### 2. 初始化检查
每次部署后，可以执行以下命令确保所有表都正常：
```javascript
quickFixMissingTables()
```

### 3. 监控日志
注意浏览器控制台中的错误信息，及时发现问题。

## 技术说明

### 数据表结构
系统包含以下主要数据表：
- `Game`: 游戏信息
- `DailyVote`: 每日投票记录
- `WeekendTeam`: 周末组队信息
- `UserFavorite`: 用户收藏记录
- `_User`: 用户信息（LeanCloud内置）

### 自动修复机制
- 报表服务会自动检测缺失的表并尝试创建
- 组队服务会在获取游戏/用户信息失败时自动重试
- 所有服务都有优雅降级机制，确保系统可用性

## 联系支持

如果以上方案都无法解决问题，请：
1. 记录详细的错误信息（控制台输出）
2. 记录操作步骤
3. 联系技术支持

---

**注意**: 所有修复操作都需要在登录状态下进行。如果遇到权限问题，请确认用户账号状态。

## 开发者工具

以下函数已暴露到全局作用域，可在控制台直接调用：

### 数据表管理
- `manualInitTables()` - 手动初始化所有数据表
- `quickFixMissingTables()` - 快速修复缺失的数据表

### 收藏数据管理
- `checkFavoriteDataConsistency()` - 检查收藏数据一致性
- `migrateFavoriteData()` - 迁移收藏数据到UserFavorite表  
- `fixFavoriteDataConsistency()` - 一键修复收藏数据问题

如果上述方法无法解决问题，请：
1. 记录具体的错误信息
2. 截图相关页面
3. 在控制台运行 `checkFavoriteDataConsistency()` 并记录结果
4. 联系技术支持团队

---

**注意**：所有修复操作都是安全的，不会删除现有数据，只会补充缺失的数据结构。 