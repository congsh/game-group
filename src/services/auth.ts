/**
 * 用户认证服务
 */

import AV from './leancloud';
import { User } from '../types/user';

/**
 * 昵称登录逻辑
 * 1. 先尝试登录，如果用户存在则直接登录成功
 * 2. 如果登录失败（用户不存在），则创建新用户并登录
 */
export const loginWithNickname = async (nickname: string): Promise<User> => {
  try {
    // 先尝试登录已存在的用户
    try {
      const user = await AV.User.logIn(nickname, 'default_password');
      if (!user.id) {
        throw new Error('用户ID获取失败');
      }
      return {
        objectId: user.id,
        username: user.get('username'),
        favoriteGames: user.get('favoriteGames') || [],
        createdAt: user.get('createdAt'),
        updatedAt: user.get('updatedAt')
      };
    } catch (loginError: any) {
      // 登录失败，说明用户不存在，创建新用户
      if (loginError.code === 210 || loginError.code === 211) {
        // 210: 用户名/密码不匹配, 211: 用户不存在
        const user = new AV.User();
        user.setUsername(nickname);
        user.setPassword('default_password'); // 使用默认密码
        user.set('favoriteGames', []); // 初始化收藏游戏列表
        await user.signUp();
        
        if (!user.id) {
          throw new Error('用户创建失败：ID获取失败');
        }
        
        return {
          objectId: user.id,
          username: user.get('username'),
          favoriteGames: user.get('favoriteGames') || [],
          createdAt: user.get('createdAt'),
          updatedAt: user.get('updatedAt')
        };
      } else {
        // 其他登录错误，直接抛出
        throw loginError;
      }
    }
  } catch (error: any) {
    throw new Error(`登录失败: ${error.message}`);
  }
};

/**
 * 退出登录
 */
export const logout = async (): Promise<void> => {
  try {
    await AV.User.logOut();
  } catch (error: any) {
    throw new Error(`退出登录失败: ${error.message}`);
  }
};

/**
 * 获取当前登录用户
 */
export const getCurrentUser = (): User | null => {
  const currentUser = AV.User.current();
  if (!currentUser) {
    return null;
  }
  
  if (!currentUser.id) {
    return null; // 如果ID不存在，返回null表示用户无效
  }
  
  return {
    objectId: currentUser.id,
    username: currentUser.get('username'),
    favoriteGames: currentUser.get('favoriteGames') || [],
    createdAt: currentUser.get('createdAt'),
    updatedAt: currentUser.get('updatedAt')
  };
};

/**
 * 检查用户是否已登录
 */
export const isLoggedIn = (): boolean => {
  return AV.User.current() !== null;
};

/**
 * 更新用户收藏游戏列表
 */
export const updateFavoriteGames = async (gameIds: string[]): Promise<void> => {
  try {
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }
    
    currentUser.set('favoriteGames', gameIds);
    await currentUser.save();
  } catch (error: any) {
    throw new Error(`更新收藏失败: ${error.message}`);
  }
}; 