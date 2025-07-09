/**
 * 留言编辑器组件
 */

import React, { useState, useEffect } from 'react';
import { 
  Input, 
  Button, 
  Space, 
  Typography, 
  AutoComplete, 
  message,
  Card,
  Mentions
} from 'antd';
import { 
  SendOutlined, 
  UserOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useMessageBoardStore } from '../../store/messages';
import { getAllUsers, parseMentionedUsers } from '../../services/messages';

const { TextArea } = Input;
const { Text } = Typography;

interface UserOption {
  value: string;
  label: string;
}

const MessageEditor: React.FC = () => {
  const { addMessage } = useMessageBoardStore();
  const [messageApi, contextHolder] = message.useMessage();
  
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<{ objectId: string; username: string }[]>([]);

  // 加载用户列表
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userList = await getAllUsers();
        setUsers(userList);
      } catch (error) {
        console.error('加载用户列表失败:', error);
      }
    };
    loadUsers();
  }, []);

  // 将用户列表转换为 Mentions 组件需要的格式
  const mentionOptions: UserOption[] = users.map(user => ({
    value: user.username,
    label: user.username
  }));

  // 提交留言
  const handleSubmit = async () => {
    if (!content.trim()) {
      messageApi.warning('请输入留言内容');
      return;
    }

    if (content.length > 500) {
      messageApi.warning('留言内容不能超过500字');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 解析@用户
      const mentionedUsers = parseMentionedUsers(content, users);
      
      await addMessage({
        content: content.trim(),
        mentionedUsers
      });
      
      setContent('');
      messageApi.success('留言发布成功');
    } catch (error) {
      messageApi.error('发布留言失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="message-editor">
      {contextHolder}
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <div className="editor-header">
          <Space>
            <EditOutlined />
            <Text strong>发表留言</Text>
            <Text type="secondary">支持 @用户名 来提及其他用户</Text>
          </Space>
        </div>

        <Mentions
          placeholder="写点什么吧... 支持 @用户名 提及其他用户"
          value={content}
          onChange={setContent}
          onKeyDown={handleKeyDown}
          options={mentionOptions}
          rows={4}
          autoSize={{ minRows: 4, maxRows: 8 }}
          maxLength={500}
        />

        <div className="editor-footer">
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text type="secondary">
              {content.length}/500 字符 | 按 Ctrl+Enter 快速发送
            </Text>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!content.trim()}
            >
              发布留言
            </Button>
          </Space>
        </div>
      </Space>
    </div>
  );
};

export default MessageEditor; 