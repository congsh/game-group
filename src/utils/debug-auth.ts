import { authStorage } from './auth-storage';

/**
 * 调试工具：检查本地存储中的认证信息
 */
export const debugAuth = {
  /**
   * 检查本地存储状态
   */
  checkStorage: () => {
    console.log('=== 认证存储调试信息 ===');
    
    // 检查 localStorage
    const localAuth = localStorage.getItem('game_group_auth');
    console.log('localStorage 中的认证数据:', localAuth ? '存在' : '不存在');
    if (localAuth) {
      console.log('localStorage 原始数据:', localAuth);
    }
    
    // 检查 sessionStorage
    const sessionAuth = sessionStorage.getItem('game_group_auth');
    console.log('sessionStorage 中的认证数据:', sessionAuth ? '存在' : '不存在');
    if (sessionAuth) {
      console.log('sessionStorage 原始数据:', sessionAuth);
    }
    
    // 尝试解析存储的用户信息
    try {
      const user = authStorage.getAuth();
      console.log('解析的用户信息:', user);
      if (user) {
        console.log('用户名:', user.username);
        console.log('用户ID:', user.objectId);
      }
    } catch (error) {
      console.error('解析用户信息失败:', error);
    }
    
    console.log('=== 调试结束 ===');
  },
  
  /**
   * 清理所有存储
   */
  clearAll: () => {
    localStorage.removeItem('game_group_auth');
    sessionStorage.removeItem('game_group_auth');
    console.log('已清理所有认证存储');
  },
  
  /**
   * 手动测试存储功能
   */
  testStorage: () => {
    console.log('=== 测试存储功能 ===');
    
    const testUser = {
      objectId: 'test123',
      username: '测试用户',
      favoriteGames: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 测试保存
    authStorage.saveAuth(testUser, true);
    console.log('✅ 测试数据已保存');
    
    // 测试读取
    const retrievedUser = authStorage.getAuth();
    console.log('📖 读取的数据:', retrievedUser);
    
    if (retrievedUser && retrievedUser.username === testUser.username) {
      console.log('✅ 存储功能正常');
    } else {
      console.log('❌ 存储功能异常');
    }
    
    console.log('=== 测试结束 ===');
  },
  
  /**
   * 调试路由状态
   */
  debugRoutes: () => {
    console.log('=== 路由状态调试 ===');
    
    // 检查当前路径
    console.log('📍 当前路径:', window.location.pathname);
    console.log('🔗 完整URL:', window.location.href);
    
    // 检查本地存储
    const localAuth = localStorage.getItem('game_group_auth');
    const sessionAuth = sessionStorage.getItem('game_group_auth');
    console.log('💾 localStorage认证:', localAuth ? '存在' : '不存在');
    console.log('💾 sessionStorage认证:', sessionAuth ? '存在' : '不存在');
    
    // 检查用户状态（如果可用）
    if ((window as any).authStore) {
      const state = (window as any).authStore.getState();
      console.log('👤 用户状态:', {
        user: state.user ? state.user.username : null,
        isLoading: state.isLoading,
        error: state.error
      });
    }
    
    console.log('=== 路由调试结束 ===');
  },
  
  /**
   * 模拟自动登录
   */
  simulateAutoLogin: async () => {
    console.log('=== 模拟自动登录 ===');
    
    // 检查是否有存储的用户信息
    const savedUser = authStorage.getAuth();
    if (!savedUser) {
      console.log('❌ 没有保存的用户信息');
      return;
    }
    
    console.log('✅ 找到用户信息:', savedUser.username);
    
    // 模拟登录过程
    if ((window as any).authStore) {
      try {
        const store = (window as any).authStore;
        console.log('🔐 开始模拟登录...');
        
        await store.getState().login(savedUser.username);
        console.log('✅ 模拟登录成功');
        
        // 检查状态
        const newState = store.getState();
        console.log('📋 新状态:', {
          user: newState.user ? newState.user.username : null,
          isLoading: newState.isLoading
        });
        
      } catch (error) {
        console.error('❌ 模拟登录失败:', error);
      }
    }
    
    console.log('=== 模拟登录结束 ===');
  },
  
  /**
   * 调试初始化状态
   */
  debugInitStates: () => {
    console.log('=== 初始化状态调试 ===');
    
    if ((window as any).appInitManager) {
      const initManager = (window as any).appInitManager;
      const state = initManager.getState();
      
      console.log('📋 当前初始化状态:');
      Object.entries(state).forEach(([key, value]) => {
        const icon = value ? '✅' : '❌';
        console.log(`  ${icon} ${key}: ${value}`);
      });
      
      console.log('\n💡 重置命令:');
      console.log('- appInitManager.resetAll() // 重置所有状态');
      console.log('- appInitManager.reset("authCheck") // 重置单个状态');
    } else {
      console.log('❌ AppInitManager 未找到');
    }
    
    console.log('=== 初始化状态调试结束 ===');
  },
  
  /**
   * 强制重新初始化
   */
  forceReinit: async () => {
    console.log('=== 强制重新初始化 ===');
    
    if ((window as any).appInitManager) {
      const initManager = (window as any).appInitManager;
      
      // 重置所有状态
      initManager.resetAll();
      console.log('🔄 所有初始化状态已重置');
      
      // 重新加载页面触发重新初始化
      console.log('🔃 即将重新加载页面...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      console.log('❌ AppInitManager 未找到，直接重新加载页面');
      window.location.reload();
    }
    
    console.log('=== 强制重新初始化结束 ===');
  }
};

// 在开发环境下将调试工具添加到全局
if (process.env.NODE_ENV === 'development') {
  (window as any).debugAuth = debugAuth;
  console.log('💡 调试工具已添加到 window.debugAuth');
  console.log('可用命令:');
  console.log('- debugAuth.checkStorage() // 检查存储状态');
  console.log('- debugAuth.clearAll() // 清理所有存储');
  console.log('- debugAuth.testStorage() // 测试存储功能');
  console.log('- debugAuth.debugRoutes() // 调试路由状态');
  console.log('- debugAuth.simulateAutoLogin() // 模拟自动登录');
  console.log('- debugAuth.debugInitStates() // 调试初始化状态');
  console.log('- debugAuth.forceReinit() // 强制重新初始化');
} 