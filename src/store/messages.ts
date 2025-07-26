/**
 * 留言板状态管理
 */

import { create } from 'zustand';
import { Message, MessageNotification, MessageBoardState, CreateMessageParams } from '../types/message';
import { 
  createMessage, 
  getMessageList, 
  deleteMessage, 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationCount
} from '../services/messages';

interface MessageBoardStore extends MessageBoardState {
  // 留言相关方法
  loadMessages: (page?: number, limit?: number) => Promise<void>;
  addMessage: (params: CreateMessageParams) => Promise<void>;
  removeMessage: (messageId: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
  
  // 通知相关方法
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updateUnreadCount: () => Promise<void>;
  
  // 重置状态
  reset: () => void;
}

export const useMessageBoardStore = create<MessageBoardStore>((set, get) => ({
  // 初始状态
  messages: [],
  notifications: [],
  isLoading: false,
  hasMore: true,
  error: null,
  unreadCount: 0,

  // 加载留言列表
  loadMessages: async (page = 1, limit = 20) => {
    try {
      set({ isLoading: true, error: null });
      
      const messages = await getMessageList({ page, limit });
      
      set(state => ({
        messages: page === 1 ? messages : [...state.messages, ...messages],
        hasMore: messages.length === limit,
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // 发布留言
  addMessage: async (params: CreateMessageParams) => {
    try {
      set({ isLoading: true, error: null });
      
      const newMessage = await createMessage(params);
      
      set(state => ({
        messages: [newMessage, ...state.messages],
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // 删除留言
  removeMessage: async (messageId: string) => {
    try {
      set({ error: null });
      
      await deleteMessage(messageId);
      
      set(state => ({
        messages: state.messages.filter(msg => msg.objectId !== messageId)
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // 刷新留言列表
  refreshMessages: async () => {
    const { loadMessages } = get();
    await loadMessages(1);
  },

  // 加载通知列表
  loadNotifications: async () => {
    try {
      const notifications = await getUserNotifications();
      set({ notifications });
    } catch (error: any) {
      console.error('加载通知失败:', error);
    }
  },

  // 标记通知为已读
  markAsRead: async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      
      set(state => ({
        notifications: state.notifications.map(notification => 
          notification.objectId === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      }));
      
      // 更新未读数量
      const { updateUnreadCount } = get();
      await updateUnreadCount();
    } catch (error: any) {
      console.error('标记通知已读失败:', error);
    }
  },

  // 标记所有通知为已读
  markAllAsRead: async () => {
    try {
      await markAllNotificationsAsRead();
      
      set(state => ({
        notifications: state.notifications.map(notification => 
          ({ ...notification, isRead: true })
        ),
        unreadCount: 0
      }));
    } catch (error: any) {
      console.error('标记所有通知已读失败:', error);
    }
  },

  // 更新未读通知数量
  updateUnreadCount: async () => {
    try {
      const count = await getUnreadNotificationCount();
      set({ unreadCount: count });
    } catch (error: any) {
      console.error('更新未读通知数量失败:', error);
    }
  },

  // 重置状态
  reset: () => {
    set({
      messages: [],
      notifications: [],
      isLoading: false,
      hasMore: true,
      error: null,
      unreadCount: 0
    });
  }
})); 