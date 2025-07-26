/**
 * 守望先锋聊天代码工具页面
 * 支持搜索图标、选择颜色、手动输入代码
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Input,
  Button,
  Space,
  Typography,
  Tabs,
  Tooltip,
  Divider,
  Collapse,
  List,
  Empty,
  Modal,
  Form,
  ColorPicker,
  Badge,
  message
} from 'antd';
import {
  CopyOutlined,
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  ClearOutlined,
  DownloadOutlined,
  UploadOutlined,
  HistoryOutlined,
  BgColorsOutlined,
  SmileOutlined,
  FormatPainterOutlined,
  SaveOutlined,
  SearchOutlined,
  EyeOutlined,
  CodeOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useMessage } from '../../hooks/useMessage';
import { 
  PREDEFINED_COLORS, 
  PREDEFINED_EMOJIS, 
  PREDEFINED_FORMATS,
  copyToClipboard,
  hexToOwColor,
  owColorToHex,
  validateChatCode
} from '../../utils/overwatch-codes';
import type { ColorCode, EmojiCode, FormatCode } from '../../types/overwatch';
import './OverwatchChatCodes.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const OverwatchChatCodes: React.FC = () => {
  const messageApi = useMessage();
  
  // 状态管理
  const [chatCode, setChatCode] = useState('');
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('colors');
  const [showPreview, setShowPreview] = useState(true);
  const [savedCodes, setSavedCodes] = useState<Array<{id: string, name: string, code: string, createdAt: Date}>>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [customColor, setCustomColor] = useState('#FF0000');

  // 搜索过滤
  const filteredColors = useMemo(() => {
    if (!searchText) return PREDEFINED_COLORS;
    const search = searchText.toLowerCase();
    return PREDEFINED_COLORS.filter(color => 
      color.name.toLowerCase().includes(search) ||
      color.hex.toLowerCase().includes(search) ||
      color.category.toLowerCase().includes(search)
    );
  }, [searchText]);

  const filteredEmojis = useMemo(() => {
    if (!searchText) return PREDEFINED_EMOJIS;
    const search = searchText.toLowerCase();
    return PREDEFINED_EMOJIS.filter(emoji => 
      emoji.name.toLowerCase().includes(search) ||
      emoji.code.toLowerCase().includes(search) ||
      emoji.category.toLowerCase().includes(search)
    );
  }, [searchText]);

  const filteredFormats = useMemo(() => {
    if (!searchText) return PREDEFINED_FORMATS;
    const search = searchText.toLowerCase();
    return PREDEFINED_FORMATS.filter(format => 
      format.name.toLowerCase().includes(search) ||
      format.description.toLowerCase().includes(search)
    );
  }, [searchText]);

  // 预览文本处理
  const previewText = useMemo(() => {
    if (!chatCode) return '';
    
    // 简化的预览处理，移除守望先锋代码显示纯文本
    let preview = chatCode;
    // 移除颜色代码 <FG??????FF>
    preview = preview.replace(/<FG[A-Fa-f0-9]{8}>/g, '');
    // 移除表情/图标代码 <TXC??????????>
    preview = preview.replace(/<TXC[0-9A-Fa-f]+>/g, '[图标]');
    return preview;
  }, [chatCode]);

  // 插入代码到当前光标位置
  const insertCode = useCallback((code: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = chatCode.substring(0, start) + code + chatCode.substring(end);
      setChatCode(newCode);
      
      // 设置新的光标位置
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + code.length, start + code.length);
      }, 0);
      
      messageApi.success(`已插入: ${code}`);
    } else {
      // 如果没有textarea或无法获取光标位置，就追加到末尾
      setChatCode(prev => prev + code);
      messageApi.success(`已添加: ${code}`);
    }
  }, [chatCode, messageApi]);

  // 处理颜色选择
  const handleColorSelect = useCallback((color: ColorCode) => {
    insertCode(color.code);
  }, [insertCode]);

  // 处理表情选择
  const handleEmojiSelect = useCallback((emoji: EmojiCode) => {
    insertCode(emoji.code);
  }, [insertCode]);

  // 处理格式选择
  const handleFormatSelect = useCallback((format: FormatCode) => {
    insertCode(format.code);
  }, [insertCode]);

  // 处理自定义颜色
  const handleCustomColorAdd = useCallback(() => {
    try {
      const owColor = hexToOwColor(customColor);
      insertCode(owColor);
    } catch (error) {
      messageApi.error('无效的颜色格式');
    }
  }, [customColor, insertCode, messageApi]);

  // 复制代码
  const handleCopyCode = useCallback(async () => {
    if (!chatCode.trim()) {
      messageApi.warning('没有代码可复制');
      return;
    }
    
    const success = await copyToClipboard(chatCode);
    if (success) {
      messageApi.success('聊天代码已复制到剪贴板');
    } else {
      messageApi.error('复制失败，请手动复制');
    }
  }, [chatCode, messageApi]);

  // 复制预览文本
  const handleCopyPreview = useCallback(async () => {
    if (!previewText.trim()) {
      messageApi.warning('没有预览文本可复制');
      return;
    }
    
    const success = await copyToClipboard(previewText);
    if (success) {
      messageApi.success('预览文本已复制到剪贴板');
    } else {
      messageApi.error('复制失败，请手动复制');
    }
  }, [previewText, messageApi]);

  // 清空代码
  const handleClear = useCallback(() => {
    setChatCode('');
    messageApi.success('已清空代码');
  }, [messageApi]);

  // 保存代码
  const handleSave = useCallback(() => {
    if (!chatCode.trim()) {
      messageApi.warning('没有代码可保存');
      return;
    }
    setSaveModalVisible(true);
  }, [chatCode, messageApi]);

  const handleSaveConfirm = useCallback(() => {
    if (!saveName.trim()) {
      messageApi.error('请输入保存名称');
      return;
    }
    
    const newSaved = {
      id: Date.now().toString(),
      name: saveName.trim(),
      code: chatCode,
      createdAt: new Date()
    };
    
    setSavedCodes(prev => [newSaved, ...prev]);
    setSaveModalVisible(false);
    setSaveName('');
    messageApi.success('代码已保存');
  }, [saveName, chatCode, messageApi]);

  // 加载保存的代码
  const handleLoadSaved = useCallback((savedCode: string) => {
    setChatCode(savedCode);
    messageApi.success('代码已加载');
  }, [messageApi]);

  // 删除保存的代码
  const handleDeleteSaved = useCallback((id: string) => {
    setSavedCodes(prev => prev.filter(item => item.id !== id));
    messageApi.success('代码已删除');
  }, [messageApi]);

  // 验证代码
  const validation = useMemo(() => {
    if (!chatCode) return { isValid: true };
    return validateChatCode(chatCode);
  }, [chatCode]);

  return (
    <div className="overwatch-chat-codes">
      <div className="page-header">
        <Title level={2}>
          <BgColorsOutlined /> 守望先锋聊天代码工具
        </Title>
        <Text type="secondary">
          搜索并选择元素，直接插入到聊天代码中
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* 左侧：代码编辑器 */}
        <Col xs={24} lg={14}>
          <Card title={<><CodeOutlined /> 聊天代码编辑器</>}>
            {/* 代码输入区 */}
            <div className="code-editor-section">
              <div style={{ marginBottom: 16 }}>
                <Text strong>聊天代码：</Text>
                <Tooltip title="在此输入或编辑聊天代码，选择左侧元素将自动插入到光标位置">
                  <Button type="link" icon={<SearchOutlined />} size="small" />
                </Tooltip>
              </div>
              <TextArea
                value={chatCode}
                onChange={(e) => setChatCode(e.target.value)}
                placeholder="在此输入聊天代码，或从下方选择元素插入..."
                rows={6}
                style={{ 
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '14px'
                }}
              />
              
              {/* 验证信息 */}
              {!validation.isValid && (
                <div style={{ marginTop: 8, padding: 8, background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 4 }}>
                  <Text type="danger">{validation.errorMessage}</Text>
                </div>
              )}
            </div>

            <Divider />

            {/* 预览区域 */}
            {showPreview && (
              <div className="preview-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text strong><EyeOutlined /> 预览效果：</Text>
                </div>
                
                <div className="preview-content">
                  <div className="preview-text">
                    {previewText || <Text type="secondary">预览将在这里显示...</Text>}
                  </div>
                </div>
              </div>
            )}

            <Divider />

            {/* 操作按钮 */}
            <Space wrap>
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={handleCopyCode}
                disabled={!chatCode.trim()}
              >
                复制代码
              </Button>
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopyPreview}
                disabled={!previewText.trim()}
              >
                复制预览
              </Button>
              <Button
                icon={<SaveOutlined />}
                onClick={handleSave}
                disabled={!chatCode.trim()}
              >
                保存代码
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={handleClear}
                disabled={!chatCode.trim()}
              >
                清空
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 右侧：元素选择器和已保存代码 */}
        <Col xs={24} lg={10}>
          <Card title="元素选择器">
            {/* 搜索框 */}
            <Input
              placeholder="搜索颜色、图标、格式..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ marginBottom: 16 }}
            />

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              {/* 颜色标签页 */}
              <TabPane tab={<span><BgColorsOutlined />颜色 ({filteredColors.length})</span>} key="colors">
                {/* 自定义颜色 */}
                <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}>
                  <Text strong style={{ marginBottom: 8, display: 'block' }}>自定义颜色：</Text>
                  <Space>
                    <ColorPicker
                      value={customColor}
                      onChange={(color) => setCustomColor(color.toHexString())}
                    />
                    <Input
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="#FF0000"
                      style={{ width: 100 }}
                    />
                    <Button onClick={handleCustomColorAdd} size="small">
                      插入
                    </Button>
                  </Space>
                </div>

                {/* 颜色分类 */}
                <Collapse size="small" defaultActiveKey={['basic']}>
                  {['basic', 'team', 'special'].map(category => {
                    const categoryColors = filteredColors.filter(c => c.category === category);
                    const categoryNames = {
                      basic: '基础颜色',
                      team: '队伍颜色', 
                      special: '特殊颜色'
                    };
                    
                    return (
                      <Panel 
                        header={`${categoryNames[category as keyof typeof categoryNames]} (${categoryColors.length})`} 
                        key={category}
                      >
                        <div className="color-grid">
                          {categoryColors.map(color => (
                            <Tooltip key={color.id} title={`${color.name} - ${color.code}`}>
                              <Button
                                style={{
                                  backgroundColor: color.hex,
                                  color: color.hex === '#FFFFFF' ? '#000' : '#fff',
                                  border: `2px solid ${color.hex === '#FFFFFF' ? '#d9d9d9' : 'transparent'}`,
                                  height: 36,
                                  fontSize: '12px'
                                }}
                                onClick={() => handleColorSelect(color)}
                              >
                                {color.name}
                              </Button>
                            </Tooltip>
                          ))}
                        </div>
                      </Panel>
                    );
                  })}
                </Collapse>
              </TabPane>

                             {/* 表情标签页 */}
               <TabPane tab={<span><SmileOutlined />图标表情 ({filteredEmojis.length})</span>} key="emojis">
                 <Collapse size="small" defaultActiveKey={['hero']}>
                   {['hero', 'face', 'hand', 'symbol'].map(category => {
                     const categoryEmojis = filteredEmojis.filter(e => e.category === category);
                     const categoryNames = {
                       hero: '英雄图标',
                       face: '面部表情',
                       hand: '手势',
                       symbol: '符号'
                     };
                     
                     return (
                       <Panel 
                         header={`${categoryNames[category as keyof typeof categoryNames]} (${categoryEmojis.length})`}
                         key={category}
                       >
                         <div className="emoji-grid">
                           {categoryEmojis.map(emoji => (
                             <Tooltip key={emoji.id} title={`${emoji.name} - ${emoji.code}`}>
                               <Button
                                 onClick={() => handleEmojiSelect(emoji)}
                                 style={{ height: 36, textAlign: 'left' }}
                               >
                                 {emoji.preview} {emoji.name}
                               </Button>
                             </Tooltip>
                           ))}
                         </div>
                       </Panel>
                     );
                   })}
                 </Collapse>
               </TabPane>

              {/* 格式标签页 */}
              <TabPane tab={<span><FormatPainterOutlined />格式 ({filteredFormats.length})</span>} key="formats">
                <List
                  size="small"
                  dataSource={filteredFormats}
                  renderItem={format => (
                    <List.Item
                      actions={[
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => handleFormatSelect(format)}
                        >
                          插入
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={format.name}
                        description={
                          <div>
                            <div>{format.description}</div>
                            <Text code style={{ fontSize: 11 }}>{format.code}</Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </TabPane>

              {/* 已保存代码 */}
              <TabPane tab={<span><HistoryOutlined />已保存 ({savedCodes.length})</span>} key="saved">
                {savedCodes.length > 0 ? (
                  <List
                    size="small"
                    dataSource={savedCodes}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <Button
                            type="link"
                            size="small"
                            onClick={() => handleLoadSaved(item.code)}
                          >
                            加载
                          </Button>,
                          <Button
                            type="link"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteSaved(item.id)}
                          />
                        ]}
                      >
                        <List.Item.Meta
                          title={item.name}
                          description={
                            <div>
                              <Text code style={{ fontSize: 11 }}>
                                {item.code.length > 50 ? item.code.substring(0, 50) + '...' : item.code}
                              </Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {item.createdAt.toLocaleString()}
                              </Text>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="还没有保存的代码" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* 保存模态框 */}
      <Modal
        title="保存聊天代码"
        open={saveModalVisible}
        onOk={handleSaveConfirm}
        onCancel={() => setSaveModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="名称" required>
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="给这个聊天代码起个名字..."
              maxLength={50}
            />
          </Form.Item>
          <Form.Item label="预览">
            <TextArea
              value={chatCode}
              readOnly
              rows={3}
              style={{ fontSize: 12, fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OverwatchChatCodes; 