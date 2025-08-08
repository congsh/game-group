import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Tag, Button, Space, Switch, message } from 'antd';
import { HeartOutlined, HeartFilled, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { PersonalCodeNote } from '../../types/overwatch';
import { 
  addOrUpdatePersonalNote, 
  getPersonalNote, 
  deletePersonalNote,
  getCodePreview 
} from '../../utils/overwatch-codes';

const { TextArea } = Input;
const { Option } = Select;

interface PersonalNoteModalProps {
  visible: boolean;
  onCancel: () => void;
  codeId: string;
  codeType: 'color' | 'emoji' | 'format' | 'custom';
  codeName: string;
  codeValue: string;
  onUpdate?: () => void;
}

const PersonalNoteModal: React.FC<PersonalNoteModalProps> = ({
  visible,
  onCancel,
  codeId,
  codeType,
  codeName,
  codeValue,
  onUpdate
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentNote, setCurrentNote] = useState<PersonalCodeNote | null>(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (visible) {
      const note = getPersonalNote(codeId, codeType);
      setCurrentNote(note || null);
      
      if (note) {
        form.setFieldsValue({
          note: note.note,
          tags: note.tags,
          isFavorite: note.isFavorite
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          note: '',
          tags: [],
          isFavorite: false
        });
      }
    }
  }, [visible, codeId, codeType, form]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const noteData = {
        codeId,
        codeType,
        note: values.note || '',
        tags: values.tags || [],
        isFavorite: values.isFavorite || false,
        customCode: codeType === 'custom' ? codeValue : undefined
      };

      addOrUpdatePersonalNote(noteData);
      message.success('保存成功！');
      onUpdate?.();
      onCancel();
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (currentNote) {
      deletePersonalNote(currentNote.id);
      message.success('删除成功！');
      onUpdate?.();
      onCancel();
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const currentTags = form.getFieldValue('tags') || [];
      if (!currentTags.includes(newTag.trim())) {
        form.setFieldsValue({
          tags: [...currentTags, newTag.trim()]
        });
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getFieldValue('tags') || [];
    form.setFieldsValue({
      tags: currentTags.filter((tag: string) => tag !== tagToRemove)
    });
  };

  const { preview, isIcon } = getCodePreview(codeValue);

  return (
    <Modal
      title={
        <Space>
          <span>个人注释 - {codeName}</span>
          {currentNote?.isFavorite && <HeartFilled style={{ color: '#ff4d4f' }} />}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        currentNote && (
          <Button 
            key="delete" 
            danger 
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          >
            删除注释
          </Button>
        ),
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          loading={loading}
          onClick={handleSave}
        >
          保存
        </Button>
      ]}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          note: '',
          tags: [],
          isFavorite: false
        }}
      >
        {/* 代码信息展示 */}
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '6px', 
          marginBottom: '16px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong>代码:</strong>
            <code style={{ 
              padding: '2px 6px', 
              backgroundColor: '#fff', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'Monaco, Consolas, monospace'
            }}>
              {codeValue}
            </code>
            {isIcon && <span style={{ color: '#1890ff' }}>🖼️ 图标代码</span>}
          </div>
          <div style={{ marginTop: '4px', color: '#666' }}>
            预览: {preview}
          </div>
        </div>

        {/* 收藏开关 */}
        <Form.Item name="isFavorite" valuePropName="checked">
          <Space>
            <Switch 
              checkedChildren={<HeartFilled />}
              unCheckedChildren={<HeartOutlined />}
            />
            <span>添加到收藏</span>
          </Space>
        </Form.Item>

        {/* 个人注释 */}
        <Form.Item 
          name="note" 
          label="个人注释"
          extra="记录这个代码的用途、效果或者个人想法"
        >
          <TextArea 
            rows={4} 
            placeholder="在这里添加你的个人注释..." 
            showCount
            maxLength={500}
          />
        </Form.Item>

        {/* 标签管理 */}
        <Form.Item 
          name="tags" 
          label="标签"
          extra="用标签来分类和整理你的代码"
        >
          <div>
            <Form.Item name="tags" noStyle>
              <Select
                mode="multiple"
                style={{ width: '100%', marginBottom: '8px' }}
                placeholder="选择或创建标签"
                open={false}
              >
                {(form.getFieldValue('tags') || []).map((tag: string) => (
                  <Option key={tag} value={tag}>{tag}</Option>
                ))}
              </Select>
            </Form.Item>
            
            {/* 标签显示和删除 */}
            <div style={{ marginBottom: '8px' }}>
              {(form.getFieldValue('tags') || []).map((tag: string) => (
                <Tag
                  key={tag}
                  closable
                  onClose={() => handleRemoveTag(tag)}
                  style={{ marginBottom: '4px' }}
                >
                  {tag}
                </Tag>
              ))}
            </div>

            {/* 添加新标签 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="输入新标签"
                onPressEnter={handleAddTag}
                style={{ flex: 1 }}
              />
              <Button 
                type="dashed" 
                icon={<PlusOutlined />}
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                添加
              </Button>
            </div>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PersonalNoteModal; 