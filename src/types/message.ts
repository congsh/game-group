/**
 * 留言板相关类型定义
 */

export interface Message {
  objectId: string;
  content: string;          // 留言内容
  authorId: string;         // 留言作者ID
  authorName: string;       // 留言作者昵称
  mentionedUsers: string[]; // 被@的用户ID列表
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageNotification {
  objectId: string;
  messageId: string;        // 留言ID
  recipientId: string;      // 接收者ID
  senderId: string;         // 发送者ID
  senderName: string;       // 发送者昵称
  messageContent: string;   // 留言内容摘要
  isRead: boolean;          // 是否已读
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageForm {
  content: string;
}

export interface MessageBoardState {
  messages: Message[];
  notifications: MessageNotification[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  unreadCount: number;
}

export interface CreateMessageParams {
  content: string;
  mentionedUsers?: string[];
}

export interface MessageListParams {
  page?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
} 