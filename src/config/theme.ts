/**
 * 应用主题配置
 * 统一的设计令牌和样式变量
 */

export const theme = {
  // 主色系
  colors: {
    primary: '#1890ff',
    primaryHover: '#40a9ff',
    primaryActive: '#096dd9',
    secondary: '#722ed1',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff',
    
    // 渐变色
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      success: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      sunset: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      ocean: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      forest: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    },
    
    // 中性色
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#f0f0f0',
      300: '#d9d9d9',
      400: '#bfbfbf',
      500: '#8c8c8c',
      600: '#595959',
      700: '#434343',
      800: '#262626',
      900: '#1f1f1f',
    },
    
    // 语义颜色
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
      secondary: '#fafafa',
    },
    
    text: {
      primary: 'rgba(0, 0, 0, 0.88)',
      secondary: 'rgba(0, 0, 0, 0.65)',
      disabled: 'rgba(0, 0, 0, 0.25)',
      inverse: '#ffffff',
    },
  },
  
  // 间距系统
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px',
  },
  
  // 圆角
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    round: '50%',
  },
  
  // 阴影
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.02)',
    md: '0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 8px -1px rgba(0, 0, 0, 0.05), 0 4px 8px rgba(0, 0, 0, 0.05)',
    lg: '0 1px 2px rgba(0, 0, 0, 0.03), 0 4px 16px -4px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)',
    xl: '0 1px 2px rgba(0, 0, 0, 0.03), 0 8px 32px -8px rgba(0, 0, 0, 0.12), 0 16px 32px rgba(0, 0, 0, 0.12)',
    hover: '0 4px 16px rgba(0, 0, 0, 0.15)',
    active: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  
  // 字体
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
      mono: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // 动画
  animations: {
    duration: {
      fast: '0.15s',
      normal: '0.3s',
      slow: '0.45s',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // 断点
  breakpoints: {
    xs: '480px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1600px',
  },
};

// Ant Design 主题配置
export const antdTheme = {
  token: {
    colorPrimary: theme.colors.primary,
    colorSuccess: theme.colors.success,
    colorWarning: theme.colors.warning,
    colorError: theme.colors.error,
    colorInfo: theme.colors.info,
    
    // 圆角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    
    // 字体
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    
    // 间距
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    
    // 阴影
    boxShadow: theme.shadows.md,
    boxShadowSecondary: theme.shadows.sm,
    
    // 动画
    motionDurationMid: theme.animations.duration.normal,
    motionDurationSlow: theme.animations.duration.slow,
    motionDurationFast: theme.animations.duration.fast,
  },
  
  components: {
    // 按钮组件
    Button: {
      borderRadius: 6,
      paddingInline: 20,
      fontWeight: 500,
    },
    
    // 卡片组件
    Card: {
      borderRadius: 8,
      padding: 24,
      boxShadow: theme.shadows.md,
    },
    
    // 输入组件
    Input: {
      borderRadius: 6,
      padding: 8,
    },
    
    // 标签页组件
    Tabs: {
      titleFontSize: 16,
      titleFontSizeLG: 18,
    },
    
    // 模态框组件
    Modal: {
      borderRadius: 8,
      padding: 24,
    },
    
    // 消息组件
    Message: {
      borderRadius: 6,
    },
    
    // 通知组件
    Notification: {
      borderRadius: 6,
    },
  },
};

export default theme; 