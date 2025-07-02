# EdgeOne 部署指南

## 🚀 快速部署到腾讯云 EdgeOne

### 前置准备

1. **腾讯云账号**: 确保已有腾讯云账号
2. **EdgeOne 服务**: 开通 EdgeOne 静态网站托管服务
3. **代码构建**: 本地已完成 `npm run build`

### 部署方式

#### 方式一：控制台上传部署（推荐）

1. **登录 EdgeOne 控制台**
   - 访问：https://console.cloud.tencent.com/edgeone
   - 选择「静态网站托管」

2. **创建新站点**
   ```
   站点名称：game-group
   描述：游戏组队平台
   ```

3. **上传构建文件**
   - 将 `build/` 目录下的所有文件上传
   - 或者压缩 `build/` 目录为 zip 文件上传

4. **配置路由重定向**
   ```
   规则类型：重定向
   源路径：/*
   目标路径：/index.html
   状态码：200
   ```

#### 方式二：Git 自动部署

1. **推送到代码仓库**
   ```bash
   # 如果还没有远程仓库，先添加
   git remote add origin <your-git-repo-url>
   git push -u origin master
   ```

2. **EdgeOne 连接仓库**
   - 在 EdgeOne 控制台选择「从Git仓库部署」
   - 连接你的 GitHub/GitLab/Coding 仓库
   - 选择 `game-group` 项目

3. **配置构建设置**
   ```
   框架：React
   构建命令：npm run build
   输出目录：build
   Node版本：18.x
   ```

### 重要配置

#### 1. 单页应用路由配置

React Router 需要配置重定向规则：

```json
{
  "source": "/*",
  "destination": "/index.html",
  "statusCode": 200
}
```

#### 2. 静态资源缓存

```json
{
  "source": "/static/**",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "public, max-age=31536000, immutable"
    }
  ]
}
```

#### 3. HTTPS 强制重定向

```json
{
  "source": "http://*",
  "destination": "https://*",
  "statusCode": 301
}
```

### 环境变量配置

如果需要配置环境变量（如不同环境的 LeanCloud 配置）：

```
REACT_APP_LEANCLOUD_APP_ID=your_app_id
REACT_APP_LEANCLOUD_APP_KEY=your_app_key
REACT_APP_LEANCLOUD_SERVER_URL=your_server_url
```

### 自定义域名配置

1. **添加自定义域名**
   - 在 EdgeOne 控制台添加你的域名
   - 例如：`game.yourdomain.com`

2. **DNS 配置**
   - 添加 CNAME 记录指向 EdgeOne 提供的地址
   
3. **SSL 证书**
   - EdgeOne 会自动申请和配置 SSL 证书

### 部署后检查清单

- [ ] ✅ 网站能正常访问
- [ ] ✅ 登录功能正常
- [ ] ✅ 游戏库页面加载正常
- [ ] ✅ 每日投票功能正常
- [ ] ✅ 周末组队功能正常
- [ ] ✅ 页面路由跳转正常
- [ ] ✅ 返回主页按钮正常
- [ ] ✅ 移动端适配正常

### 性能优化建议

1. **启用 CDN 加速**
   - EdgeOne 自动提供全球 CDN 加速

2. **开启 Gzip 压缩**
   - 在 EdgeOne 控制台开启文件压缩

3. **配置缓存策略**
   - 静态资源：长期缓存
   - HTML 文件：短期缓存或不缓存

### 监控和维护

1. **访问统计**
   - 在 EdgeOne 控制台查看访问数据

2. **错误监控**
   - 配置错误日志收集

3. **性能监控**
   - 查看页面加载性能指标

### 常见问题

#### Q: 页面刷新后出现 404 错误
A: 需要配置路由重定向规则，将所有路径重定向到 `/index.html`

#### Q: 静态资源加载失败
A: 检查 `build/` 目录是否完整上传，确认文件路径正确

#### Q: LeanCloud 连接失败
A: 检查 LeanCloud 配置文件中的域名和密钥是否正确

### 部署完成

🎉 恭喜！你的游戏组队平台现在已经成功部署到 EdgeOne！

访问你的网站开始使用：
- 🎮 管理游戏库
- 🗳️ 参与每日投票  
- 👥 创建和加入组队
- 📱 移动端体验

### 后续开发

如果需要更新代码：

1. 本地开发和测试
2. `git commit` 提交更改
3. `git push` 推送到仓库
4. EdgeOne 自动触发重新部署

或者手动重新构建上传：

1. `npm run build`
2. 上传新的 `build/` 目录到 EdgeOne 