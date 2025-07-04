import CryptoJS from 'crypto-js';
import { User } from '../types/user';

const AUTH_KEY = 'game_group_auth';
const SECRET_KEY = process.env.REACT_APP_SECRET_KEY || 'game_group_default_secret_2025';

interface AuthData {
  user: User;
  timestamp: number;
  rememberMe: boolean;
}

export const authStorage = {
  /**
   * 保存登录信息
   * @param user 用户信息
   * @param rememberMe 是否记住登录
   */
  saveAuth: (user: User, rememberMe: boolean = false) => {
    try {
      const data: AuthData = {
        user,
        timestamp: Date.now(),
        rememberMe
      };
      
      console.log('💾 准备保存登录信息:', {
        username: user.username,
        rememberMe,
        timestamp: data.timestamp
      });
      
      // 加密数据
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data), 
        SECRET_KEY
      ).toString();
      
      console.log('🔐 数据已加密，长度:', encrypted.length);
      
      // 根据记住我选项决定存储位置
      if (rememberMe) {
        localStorage.setItem(AUTH_KEY, encrypted);
        sessionStorage.removeItem(AUTH_KEY); // 清除session中的数据
        console.log('✅ 数据已保存到 localStorage');
      } else {
        sessionStorage.setItem(AUTH_KEY, encrypted);
        localStorage.removeItem(AUTH_KEY); // 清除localStorage中的数据
        console.log('✅ 数据已保存到 sessionStorage');
      }
      
      console.log('✅ 登录信息已保存', rememberMe ? '(长期存储)' : '(会话存储)');
    } catch (error) {
      console.error('❌ 保存登录信息失败:', error);
    }
  },
  
  /**
   * 获取登录信息
   * @returns 用户信息或null
   */
  getAuth: (): User | null => {
    try {
      console.log('🔍 开始获取登录信息...');
      
      // 优先从localStorage获取，然后从sessionStorage获取
      const encrypted = localStorage.getItem(AUTH_KEY) || 
                       sessionStorage.getItem(AUTH_KEY);
      
      if (!encrypted) {
        console.log('📭 没有找到存储的登录信息');
        return null;
      }
      
      console.log('📦 找到加密数据，长度:', encrypted.length);
      
      // 解密数据
      const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      const dataStr = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!dataStr) {
        console.error('❌ 解密失败：数据为空');
        authStorage.clearAuth();
        return null;
      }
      
      console.log('🔓 数据解密成功');
      
      const data: AuthData = JSON.parse(dataStr);
      
      console.log('📋 解析的用户数据:', {
        username: data.user.username,
        rememberMe: data.rememberMe,
        timestamp: new Date(data.timestamp).toLocaleString()
      });
      
      // 检查是否过期（记住我状态下7天过期）
      if (data.rememberMe) {
        const expireTime = 7 * 24 * 60 * 60 * 1000; // 7天
        const timeDiff = Date.now() - data.timestamp;
        const daysLeft = Math.ceil((expireTime - timeDiff) / (24 * 60 * 60 * 1000));
        
        if (timeDiff > expireTime) {
          console.log('⏰ 登录信息已过期 (超过7天)');
          authStorage.clearAuth();
          return null;
        } else {
          console.log(`⏰ 登录信息有效，还有 ${daysLeft} 天过期`);
        }
      }
      
      console.log('✅ 登录信息获取成功');
      return data.user;
    } catch (error) {
      console.error('❌ 获取登录信息失败:', error);
      authStorage.clearAuth();
      return null;
    }
  },
  
  /**
   * 清除登录信息
   */
  clearAuth: () => {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    console.log('登录信息已清除');
  },
  
  /**
   * 更新登录时间戳（用于活跃用户保持登录）
   */
  refreshTimestamp: () => {
    try {
      const encrypted = localStorage.getItem(AUTH_KEY) || 
                       sessionStorage.getItem(AUTH_KEY);
      
      if (!encrypted) {
        return;
      }
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      const dataStr = decrypted.toString(CryptoJS.enc.Utf8);
      const data: AuthData = JSON.parse(dataStr);
      
      // 更新时间戳
      data.timestamp = Date.now();
      
      // 重新加密并保存
      const newEncrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data), 
        SECRET_KEY
      ).toString();
      
      if (data.rememberMe) {
        localStorage.setItem(AUTH_KEY, newEncrypted);
      } else {
        sessionStorage.setItem(AUTH_KEY, newEncrypted);
      }
    } catch (error) {
      console.error('更新时间戳失败:', error);
    }
  }
}; 