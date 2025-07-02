# LeanCloud 配置说明

## ✅ 配置完成

LeanCloud已成功配置完毕，配置信息如下：

### 📋 配置信息
- **AppID**: `Kdx6AZMdQRwQXsAIa45L8wb5-gzGzoHsz`
- **AppKey**: `T5SUIFGSeWjK1H7yrsULt79j`
- **服务器地址**: `https://kdx6azmd.lc-cn-n1-shared.com`

### 📁 配置文件位置
- **主配置文件**: `src/config/leancloud.config.ts`
- **服务文件**: `src/services/leancloud.ts`
- **应用初始化**: `src/App.tsx`

### 🔧 配置特点

1. **环境变量支持**: 配置支持环境变量覆盖，生产环境可通过设置以下环境变量：
   - `REACT_APP_LEANCLOUD_APP_ID`
   - `REACT_APP_LEANCLOUD_APP_KEY`
   - `REACT_APP_LEANCLOUD_SERVER_URL`

2. **开发环境默认值**: 如果没有设置环境变量，将使用配置文件中的默认值

3. **错误处理**: 包含完整的初始化错误处理和日志记录

### 🚀 使用方式

LeanCloud会在应用启动时自动初始化，无需手动调用。

### 📝 相关功能

- ✅ 用户认证（昵称登录）
- ✅ 用户数据存储
- ✅ 收藏游戏列表管理
- 🔄 后续功能：游戏数据、投票记录、团队信息等

### 🔍 验证配置

应用启动后，控制台会显示：
```
LeanCloud 初始化成功 { appId: "Kdx6AZMd...", serverURL: "https://kdx6azmd.lc-cn-n1-shared.com" }
```

如果出现错误，请检查：
1. 网络连接是否正常
2. LeanCloud服务是否可用
3. 配置信息是否正确

---
*最后更新: 2024年12月* 