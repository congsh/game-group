/**
 * 应用初始化管理工具
 * 防止重复操作，提供统一的初始化状态管理
 */

interface InitState {
  globalInit: boolean;
  leanCloudInit: boolean;
  cacheWarmup: boolean;
  authCheck: boolean;
  dataInit: boolean;
  schedulerStart: boolean;
}

class AppInitManager {
  private state: InitState = {
    globalInit: false,
    leanCloudInit: false,
    cacheWarmup: false,
    authCheck: false,
    dataInit: false,
    schedulerStart: false
  };

  /**
   * 检查某个初始化状态
   */
  isInitialized(key: keyof InitState): boolean {
    return this.state[key];
  }

  /**
   * 标记某个初始化为完成
   */
  markAsInitialized(key: keyof InitState): void {
    if (this.state[key]) {
      console.log(`⚠️ ${key} 已经初始化过，跳过重复操作`);
      return;
    }
    
    this.state[key] = true;
    console.log(`✅ ${key} 初始化标记已设置`);
  }

  /**
   * 重置某个初始化状态（用于调试）
   */
  reset(key: keyof InitState): void {
    this.state[key] = false;
    console.log(`🔄 ${key} 初始化状态已重置`);
  }

  /**
   * 重置所有初始化状态（用于调试）
   */
  resetAll(): void {
    Object.keys(this.state).forEach(key => {
      this.state[key as keyof InitState] = false;
    });
    console.log('🔄 所有初始化状态已重置');
  }

  /**
   * 获取当前初始化状态
   */
  getState(): InitState {
    return { ...this.state };
  }

  /**
   * 安全执行初始化操作（如果未初始化过）
   */
  async safeInit<T>(
    key: keyof InitState, 
    operation: () => Promise<T> | T,
    description?: string
  ): Promise<T | null> {
    if (this.isInitialized(key)) {
      console.log(`⚠️ ${description || key} 已初始化，跳过执行`);
      return null;
    }

    try {
      console.log(`🚀 开始执行 ${description || key}...`);
      this.markAsInitialized(key);
      
      const result = await operation();
      console.log(`✅ ${description || key} 执行完成`);
      
      return result;
    } catch (error) {
      console.error(`❌ ${description || key} 执行失败:`, error);
      // 失败时重置状态，允许重试
      this.reset(key);
      throw error;
    }
  }
}

// 创建全局单例
export const appInitManager = new AppInitManager();

// 在开发环境中暴露到全局对象，方便调试
if (process.env.NODE_ENV === 'development') {
  (window as any).appInitManager = appInitManager;
  console.log('💡 AppInitManager 已暴露到 window.appInitManager');
  console.log('可用方法:');
  console.log('- appInitManager.getState() // 查看初始化状态');
  console.log('- appInitManager.resetAll() // 重置所有状态');
  console.log('- appInitManager.reset("authCheck") // 重置单个状态');
} 