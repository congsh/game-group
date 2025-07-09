/**
 * 留言板服务
 */

import AV from './leancloud';
import { Message, MessageNotification, CreateMessageParams, MessageListParams } from '../types/message';

/**
 * 创建留言
 */
export const createMessage = async (params: CreateMessageParams): Promise<Message> => {
  try {
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    const MessageClass = AV.Object.extend('Message');
    const message = new MessageClass();
    
    message.set('content', params.content);
    message.set('authorId', currentUser.id);
    message.set('authorName', currentUser.get('username'));
    message.set('mentionedUsers', params.mentionedUsers || []);
    
    const savedMessage = await message.save();
    
    // 如果有@用户，创建通知
    if (params.mentionedUsers && params.mentionedUsers.length > 0) {
      await createNotifications(savedMessage, params.mentionedUsers);
    }

    if (!savedMessage.id) {
      throw new Error('留言创建失败：ID获取失败');
    }

    return {
      objectId: savedMessage.id,
      content: savedMessage.get('content'),
      authorId: savedMessage.get('authorId'),
      authorName: savedMessage.get('authorName'),
      mentionedUsers: savedMessage.get('mentionedUsers') || [],
      createdAt: savedMessage.get('createdAt'),
      updatedAt: savedMessage.get('updatedAt')
    };
  } catch (error: any) {
    throw new Error(`创建留言失败: ${error.message}`);
  }
};

/**
 * 获取留言列表
 */
export const getMessageList = async (params: MessageListParams = {}): Promise<Message[]> => {
  try {
    const {
      page = 1,
      limit = 20,
      orderBy = 'createdAt',
      order = 'desc'
    } = params;

    const query = new AV.Query('Message');
    
    // 分页
    query.limit(limit);
    query.skip((page - 1) * limit);
    
    // 排序
    if (order === 'desc') {
      query.descending(orderBy);
    } else {
      query.ascending(orderBy);
    }

    const messages = await query.find();
    
    return messages.map(message => ({
      objectId: message.id!,
      content: message.get('content'),
      authorId: message.get('authorId'),
      authorName: message.get('authorName'),
      mentionedUsers: message.get('mentionedUsers') || [],
      createdAt: message.get('createdAt'),
      updatedAt: message.get('updatedAt')
    }));
  } catch (error: any) {
    throw new Error(`获取留言列表失败: ${error.message}`);
  }
};

/**
 * 删除留言
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    const query = new AV.Query('Message');
    const message = await query.get(messageId);
    
    // 检查是否是留言作者
    if (message.get('authorId') !== currentUser.id) {
      throw new Error('只能删除自己的留言');
    }

    await message.destroy();
    
    // 删除相关的通知
    await deleteNotificationsByMessageId(messageId);
  } catch (error: any) {
    throw new Error(`删除留言失败: ${error.message}`);
  }
};

/**
 * 创建通知
 */
const createNotifications = async (message: AV.Object, mentionedUserIds: string[]): Promise<void> => {
  try {
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    const NotificationClass = AV.Object.extend('MessageNotification');
    const notifications = mentionedUserIds.map(userId => {
      const notification = new NotificationClass();
      notification.set('messageId', message.id);
      notification.set('recipientId', userId);
      notification.set('senderId', currentUser.id);
      notification.set('senderName', currentUser.get('username'));
      notification.set('messageContent', message.get('content').substring(0, 100) + '...');
      notification.set('isRead', false);
      return notification;
    });

    await AV.Object.saveAll(notifications);
  } catch (error: any) {
    console.error('创建通知失败:', error);
    // 通知创建失败不影响留言创建
  }
};

/**
 * 获取用户的通知列表
 */
export const getUserNotifications = async (userId?: string): Promise<MessageNotification[]> => {
  try {
    const currentUser = AV.User.current();
    if (!currentUser && !userId) {
      throw new Error('用户未登录');
    }

    const targetUserId = userId || currentUser!.id;
    
    const query = new AV.Query('MessageNotification');
    query.equalTo('recipientId', targetUserId);
    query.descending('createdAt');
    query.limit(50); // 限制50条通知

    const notifications = await query.find();
    
    return notifications.map(notification => ({
      objectId: notification.id!,
      messageId: notification.get('messageId'),
      recipientId: notification.get('recipientId'),
      senderId: notification.get('senderId'),
      senderName: notification.get('senderName'),
      messageContent: notification.get('messageContent'),
      isRead: notification.get('isRead'),
      createdAt: notification.get('createdAt'),
      updatedAt: notification.get('updatedAt')
    }));
  } catch (error: any) {
    throw new Error(`获取通知列表失败: ${error.message}`);
  }
};

/**
 * 标记通知为已读
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const query = new AV.Query('MessageNotification');
    const notification = await query.get(notificationId);
    
    notification.set('isRead', true);
    await notification.save();
  } catch (error: any) {
    throw new Error(`标记通知已读失败: ${error.message}`);
  }
};

/**
 * 标记所有通知为已读
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    const query = new AV.Query('MessageNotification');
    query.equalTo('recipientId', currentUser.id);
    query.equalTo('isRead', false);

    const notifications = await query.find();
    
    if (notifications.length === 0) {
      return;
    }

    notifications.forEach(notification => {
      notification.set('isRead', true);
    });

    await AV.Object.saveAll(notifications as AV.Object[]);
  } catch (error: any) {
    throw new Error(`标记所有通知已读失败: ${error.message}`);
  }
};

/**
 * 获取未读通知数量
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const currentUser = AV.User.current();
    if (!currentUser) {
      return 0;
    }

    const query = new AV.Query('MessageNotification');
    query.equalTo('recipientId', currentUser.id);
    query.equalTo('isRead', false);

    return await query.count();
  } catch (error: any) {
    console.error('获取未读通知数量失败:', error);
    return 0;
  }
};

/**
 * 删除消息相关的通知
 */
const deleteNotificationsByMessageId = async (messageId: string): Promise<void> => {
  try {
    const query = new AV.Query('MessageNotification');
    query.equalTo('messageId', messageId);
    
    const notifications = await query.find();
    
    if (notifications.length > 0) {
      await AV.Object.destroyAll(notifications as AV.Object[]);
    }
  } catch (error: any) {
    console.error('删除通知失败:', error);
    // 删除通知失败不影响主要功能
  }
};

/**
 * 获取参与过留言的用户列表（用于@功能）
 * 替代直接查询 _User 表，以避免权限问题
 */
export const getAllUsers = async (): Promise<{ objectId: string; username: string }[]> => {
  try {
    const query = new AV.Query('Message');
    // 只查询需要的作者信息
    query.select(['authorId', 'authorName']);
    // 查询最近的1000条留言，以获取活跃用户
    query.limit(1000);
    query.descending('createdAt');

    const messages = await query.find();

    // 使用 Map 来确保用户的唯一性
    const userMap = new Map<string, string>();
    messages.forEach(message => {
      const authorId = message.get('authorId');
      const authorName = message.get('authorName');
      if (authorId && authorName && !userMap.has(authorId)) {
        userMap.set(authorId, authorName);
      }
    });
    
    // 将 Map 转换为对象数组
    const uniqueUsers = Array.from(userMap, ([objectId, username]) => ({ objectId, username }));

    // 按用户名排序
    uniqueUsers.sort((a, b) => a.username.localeCompare(b.username));

    return uniqueUsers;
  } catch (error: any) {
    // 如果留言板还没有任何消息（Message 表不存在），返回空数组
    if (error.code === 404) {
      return [];
    }
    console.error('获取用户列表失败:', error);
    // 这里不再向上抛出错误，而是返回空数组，避免阻塞UI
    return [];
  }
};

/**
 * 解析留言内容中的@用户
 */
export const parseMentionedUsers = (content: string, allUsers: { objectId: string; username: string }[]): string[] => {
  const mentionRegex = /@([^\s@]+)/g;
  const mentionedUsernames = content.match(mentionRegex)?.map(match => match.substring(1)) || [];
  
  return allUsers
    .filter(user => mentionedUsernames.includes(user.username))
    .map(user => user.objectId);
}; 