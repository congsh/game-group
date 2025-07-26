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
  message,
  Select
} from 'antd';
import {
  CopyOutlined,
  StarOutlined,
  StarFilled,
  HeartOutlined,
  HeartFilled,
  CommentOutlined,
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
  validateChatCode,
  getPersonalNote,
  toggleFavorite,
  loadPersonalNotes,
  getCodePreview
} from '../../utils/overwatch-codes';
import type { ColorCode, EmojiCode, FormatCode, PersonalCodeNote, TextureInfo } from '../../types/overwatch';
import PersonalNoteModal from '../../components/ui/PersonalNoteModal';
import IconBrowser from '../../components/ui/IconBrowser';
import './OverwatchChatCodes.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;
const { Panel } = Collapse;

const OverwatchChatCodes: React.FC = () => {
  const messageApi = useMessage();
  
  // 状态管理
  const [chatCode, setChatCode] = useState('');
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('colors');
  const [showPreview, setShowPreview] = useState(true);
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light' | 'game'>('dark');
  const [savedCodes, setSavedCodes] = useState<Array<{id: string, name: string, code: string, createdAt: Date}>>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [customColor, setCustomColor] = useState('#FF0000FF');
  
  // 个人注释和收藏相关状态
  const [personalNotes, setPersonalNotes] = useState<PersonalCodeNote[]>([]);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedCodeForNote, setSelectedCodeForNote] = useState<{
    id: string;
    type: 'color' | 'emoji' | 'format' | 'custom';
    name: string;
    value: string;
  } | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // 加载个人注释
  React.useEffect(() => {
    const notes = loadPersonalNotes();
    setPersonalNotes(notes);
  }, []);

  // 刷新个人注释
  const refreshPersonalNotes = useCallback(() => {
    const notes = loadPersonalNotes();
    setPersonalNotes(notes);
  }, []);

  // 打开个人注释模态框
  const openNoteModal = useCallback((id: string, type: 'color' | 'emoji' | 'format' | 'custom', name: string, value: string) => {
    setSelectedCodeForNote({ id, type, name, value });
    setNoteModalVisible(true);
  }, []);

  // 关闭个人注释模态框
  const closeNoteModal = useCallback(() => {
    setNoteModalVisible(false);
    setSelectedCodeForNote(null);
  }, []);

  // 切换收藏状态
  const handleToggleFavorite = useCallback((codeId: string, codeType: string) => {
    const isFavorite = toggleFavorite(codeId, codeType);
    refreshPersonalNotes();
    messageApi.success(isFavorite ? '已添加到收藏' : '已取消收藏');
  }, [messageApi, refreshPersonalNotes]);

  // 检查是否收藏
  const isFavorited = useCallback((codeId: string, codeType: string) => {
    return personalNotes.some(note => note.codeId === codeId && note.codeType === codeType && note.isFavorite);
  }, [personalNotes]);

  // 获取个人注释
  const getNote = useCallback((codeId: string, codeType: string) => {
    return personalNotes.find(note => note.codeId === codeId && note.codeType === codeType);
  }, [personalNotes]);

  // 搜索过滤
  const filteredColors = useMemo(() => {
    let colors = PREDEFINED_COLORS;
    
    // 收藏过滤
    if (showFavoritesOnly) {
      colors = colors.filter(color => isFavorited(color.id, 'color'));
    }
    
    // 搜索过滤
    if (searchText) {
      const search = searchText.toLowerCase();
      colors = colors.filter(color => 
        color.name.toLowerCase().includes(search) ||
        color.hex.toLowerCase().includes(search) ||
        color.category.toLowerCase().includes(search)
      );
    }
    
    return colors;
  }, [searchText, showFavoritesOnly, isFavorited]);

  const filteredEmojis = useMemo(() => {
    let emojis = PREDEFINED_EMOJIS;
    
    // 收藏过滤
    if (showFavoritesOnly) {
      emojis = emojis.filter(emoji => isFavorited(emoji.id, 'emoji'));
    }
    
    // 搜索过滤
    if (searchText) {
      const search = searchText.toLowerCase();
      emojis = emojis.filter(emoji => 
        emoji.name.toLowerCase().includes(search) ||
        emoji.code.toLowerCase().includes(search) ||
        emoji.category.toLowerCase().includes(search)
      );
    }
    
    return emojis;
  }, [searchText, showFavoritesOnly, isFavorited]);

  const filteredFormats = useMemo(() => {
    let formats = PREDEFINED_FORMATS;
    
    // 收藏过滤
    if (showFavoritesOnly) {
      formats = formats.filter(format => isFavorited(format.id, 'format'));
    }
    
    // 搜索过滤
    if (searchText) {
      const search = searchText.toLowerCase();
      formats = formats.filter(format => 
        format.name.toLowerCase().includes(search) ||
        format.description.toLowerCase().includes(search)
      );
    }
    
    return formats;
  }, [searchText, showFavoritesOnly, isFavorited]);

  // 预览组件数据处理
  const previewElements = useMemo(() => {
    if (!chatCode) return [];
    
    const elements: Array<{
      type: 'text' | 'color' | 'icon';
      content: string;
      color?: string;
      iconUrl?: string;
    }> = [];
    
    let currentText = '';
    let currentColor = '#FFFFFF';
    let index = 0;
    
    while (index < chatCode.length) {
      // 查找颜色代码 <FG??????FF>
      const colorMatch = chatCode.slice(index).match(/^<FG([A-Fa-f0-9]{6})([A-Fa-f0-9]{2})>/);
      if (colorMatch) {
        // 保存当前文本
        if (currentText) {
          elements.push({ type: 'text', content: currentText, color: currentColor });
          currentText = '';
        }
        // 设置新颜色
        const colorHex = `#${colorMatch[1]}`;
        currentColor = colorHex;
        elements.push({ type: 'color', content: colorMatch[0], color: colorHex });
        index += colorMatch[0].length;
        continue;
      }
      
      // 查找图标代码 <TXC??????????????> (支持11-14位ID)
      const iconMatch = chatCode.slice(index).match(/^<TXC([0-9A-Fa-f]{11,14})>/);
      if (iconMatch) {
        // 保存当前文本
        if (currentText) {
          elements.push({ type: 'text', content: currentText, color: currentColor });
          currentText = '';
        }
        // 添加图标 (图片URL使用12位格式，去掉14位ID的前导零)
        let iconId = iconMatch[1].toUpperCase();
        // 如果是14位ID，去掉前2位变成12位用于图片URL
        if (iconId.length === 14) {
          iconId = iconId.substring(2);
        } else if (iconId.length < 12) {
          iconId = iconId.padStart(12, '0');
        }
        const iconUrl = `https://assets.overwatchitemtracker.com/textures/${iconId}.png`;
        elements.push({ 
          type: 'icon', 
          content: iconMatch[0], 
          iconUrl,
          color: currentColor 
        });
        index += iconMatch[0].length;
        continue;
      }
      
      // 普通字符
      currentText += chatCode[index];
      index++;
    }
    
    // 保存剩余文本
    if (currentText) {
      elements.push({ type: 'text', content: currentText, color: currentColor });
    }
    
    return elements;
  }, [chatCode]);

  // 简化的预览文本（用于复制）
  const previewText = useMemo(() => {
    return previewElements.map(el => {
      if (el.type === 'text') return el.content;
      if (el.type === 'icon') return '[图标]';
      return '';
    }).join('');
  }, [previewElements]);

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

  // 处理图标选择
  const handleIconSelect = useCallback((iconCode: string, iconInfo: TextureInfo) => {
    insertCode(iconCode);
    messageApi.success(`已插入图标: ${iconInfo.id}`);
  }, [insertCode, messageApi]);

  // 处理自定义颜色
  const handleCustomColorAdd = useCallback(() => {
    try {
      const owColor = hexToOwColor(customColor);
      insertCode(owColor);
      messageApi.success(`已插入颜色: ${customColor}`);
    } catch (error) {
      console.error('颜色转换错误:', error, '输入颜色:', customColor);
      messageApi.error(`无效的颜色格式: ${error instanceof Error ? error.message : '未知错误'}`);
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
        <div style={{ marginTop: 12 }}>
          <Text type="secondary">
            💡 更多工具：
            <a 
              href="https://ow.mapleqaq.top/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ marginLeft: 4 }}
            >
              守望先锋聊天编辑器
            </a>
            （可视化编辑、渐变文字、纹理图案）
          </Text>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* 左侧：代码编辑器 */}
        <Col xs={24} lg={12}>
          <Card title={<><CodeOutlined /> 聊天代码编辑器</>} bodyStyle={{ padding: '20px' }}>
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
                  <Space>
                    <Select
                      size="small"
                      value={previewTheme}
                      onChange={setPreviewTheme}
                      style={{ width: 80 }}
                    >
                      <Option value="dark">暗色</Option>
                      <Option value="light">亮色</Option>
                      <Option value="game">游戏</Option>
                    </Select>
                    <Button 
                      size="small" 
                      type="text"
                      onClick={() => setShowPreview(!showPreview)}
                      icon={showPreview ? <EyeOutlined /> : <EyeOutlined />}
                    >
                      {showPreview ? '隐藏预览' : '显示预览'}
                    </Button>
                  </Space>
                </div>
                
                <div className="preview-content">
                  <div 
                    className={`preview-text ${previewTheme === 'game' ? 'game-theme' : ''}`}
                    style={{
                      background: previewTheme === 'dark' ? '#1e1e1e' : 
                                  previewTheme === 'light' ? '#ffffff' : 
                                  `
                                    radial-gradient(ellipse at center, rgba(249, 168, 37, 0.15) 0%, transparent 50%),
                                    linear-gradient(135deg, #0a0e13 0%, #1a1f2e 30%, #0f1419 70%, #243447 100%),
                                    repeating-linear-gradient(90deg, transparent 0px, rgba(249, 168, 37, 0.02) 1px, transparent 2px, transparent 40px)
                                  `,
                      color: previewTheme === 'light' ? '#000000' : '#ffffff',
                      padding: '16px',
                      borderRadius: '8px',
                      border: previewTheme === 'light' ? '1px solid #d9d9d9' : 
                              previewTheme === 'game' ? '2px solid #f9a825' : 'none',
                      boxShadow: previewTheme === 'game' ? 
                                 `
                                   inset 0 0 20px rgba(249, 168, 37, 0.1),
                                   inset 0 2px 4px rgba(0,0,0,0.4),
                                   0 0 20px rgba(249, 168, 37, 0.2),
                                   0 4px 8px rgba(0,0,0,0.3)
                                 ` : 'none',
                      fontFamily: previewTheme === 'game' ? 
                                  '"Overwatch", "Orbitron", "Microsoft YaHei", monospace' : 
                                  '"Microsoft YaHei", sans-serif',
                      fontSize: '16px',
                      fontWeight: previewTheme === 'game' ? '600' : 'normal',
                      lineHeight: '1.5',
                      minHeight: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* 游戏主题装饰元素 */}
                    {previewTheme === 'game' && (
                      <>
                        {/* 顶部扫描线 */}
                        <div style={{
                          position: 'absolute',
                          top: '-2px',
                          left: '-2px',
                          right: '-2px',
                          height: '4px',
                          background: 'linear-gradient(90deg, transparent 0%, #f9a825 50%, transparent 100%)',
                          animation: 'pulse 2s infinite'
                        }} />
                        
                        {/* 网格覆盖层 */}
                        <div className="game-grid-overlay" />
                        
                        {/* 边框扫描效果 */}
                        <div className="game-border-scan" />
                        
                        {/* 左上角HUD指示器 */}
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          fontSize: '8px',
                          color: '#f9a825',
                          opacity: 0.7,
                          fontWeight: 'bold',
                          letterSpacing: '1px',
                          fontFamily: 'monospace'
                        }}>
                          [ CHAT PREVIEW ]
                        </div>
                        
                        {/* 右上角OVERWATCH标识 */}
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          fontSize: '10px',
                          color: '#f9a825',
                          opacity: 0.6,
                          fontWeight: 'bold',
                          letterSpacing: '1px'
                        }}>
                          OVERWATCH
                        </div>
                        
                        {/* 右下角状态指示器 */}
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '8px',
                          color: '#f9a825',
                          opacity: 0.5,
                          fontFamily: 'monospace'
                        }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: '#00ff00',
                            borderRadius: '50%',
                            animation: 'pulse 1s infinite'
                          }} />
                          ONLINE
                        </div>
                      </>
                    )}
                    
                    {previewElements.length > 0 ? (
                      previewElements.map((element, index) => {
                        if (element.type === 'text') {
                          return (
                            <span 
                              key={index}
                              style={{ 
                                color: element.color,
                                whiteSpace: 'pre-wrap',
                                textShadow: previewTheme === 'game' ? 
                                  `0 0 8px ${element.color}40, 0 0 16px ${element.color}20` : 'none',
                                filter: previewTheme === 'game' ? 
                                  'drop-shadow(0 0 2px rgba(249, 168, 37, 0.3))' : 'none'
                              }}
                            >
                              {element.content}
                            </span>
                          );
                        } else if (element.type === 'icon') {
                          return (
                            <img
                              key={index}
                              src={element.iconUrl}
                              alt="图标"
                              style={{
                                width: '20px',
                                height: '20px',
                                margin: '0 2px',
                                verticalAlign: 'middle',
                                display: 'inline-block',
                                filter: previewTheme === 'game' ? 
                                  `drop-shadow(0 0 4px rgba(249, 168, 37, 0.6)) 
                                   drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))` : 'none',
                                borderRadius: previewTheme === 'game' ? '2px' : '0'
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const placeholder = document.createElement('span');
                                placeholder.textContent = '🎮';
                                placeholder.style.cssText = `
                                  color: ${element.color};
                                  margin: 0 2px;
                                  font-size: 16px;
                                `;
                                target.parentNode?.replaceChild(placeholder, target);
                              }}
                            />
                          );
                        } else if (element.type === 'color') {
                          return (
                            <span
                              key={index}
                              style={{
                                display: 'inline-block',
                                width: '12px',
                                height: '12px',
                                backgroundColor: element.color,
                                border: '1px solid #666',
                                borderRadius: '2px',
                                margin: '0 4px',
                                verticalAlign: 'middle'
                              }}
                              title={`颜色: ${element.color}`}
                            />
                          );
                        }
                        return null;
                      })
                                         ) : (
                       <div style={{ color: '#999', textAlign: 'center', width: '100%' }}>
                         <div style={{ marginBottom: '8px' }}>预览将在这里显示...</div>
                         <div style={{ fontSize: '12px', opacity: 0.7 }}>
                           支持：<span style={{ color: '#ff6b6b' }}>颜色代码</span>、
                           <span style={{ margin: '0 2px' }}>🎮</span>图标代码、
                           普通文本
                         </div>
                       </div>
                     )}
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
        <Col xs={24} lg={12}>
          <Card title="元素选择器" bodyStyle={{ padding: '20px' }}>
            {/* 搜索框 */}
            <div style={{ marginBottom: 16 }}>
              <Input
                placeholder="搜索颜色、图标、格式..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ marginBottom: 8 }}
              />
              
              {/* 收藏过滤开关 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Badge count={personalNotes.filter(n => n.isFavorite).length} showZero={false}>
                  <Button
                    type={showFavoritesOnly ? 'primary' : 'default'}
                    icon={showFavoritesOnly ? <HeartFilled /> : <HeartOutlined />}
                    size="small"
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  >
                    只看收藏
                  </Button>
                </Badge>
                
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {showFavoritesOnly ? '仅显示收藏项目' : '显示全部项目'}
                </Text>
              </div>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              {/* 颜色标签页 */}
              <TabPane tab={<span><BgColorsOutlined />颜色 ({filteredColors.length})</span>} key="colors">
                {/* 自定义颜色 */}
                <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}>
                  <Text strong style={{ marginBottom: 8, display: 'block' }}>自定义颜色：</Text>
                  <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
                    透明度说明：FF=完全不透明，80=半透明，00=完全透明
                  </div>
                  <Space>
                    <ColorPicker
                      value={customColor}
                      onChange={(color) => {
                        try {
                          // 获取RGB颜色值
                          const rgba = color.toRgb();
                          
                          // 手动构建HEX颜色，避免toHexString的格式问题
                          const r = Math.round(rgba.r).toString(16).padStart(2, '0').toUpperCase();
                          const g = Math.round(rgba.g).toString(16).padStart(2, '0').toUpperCase();
                          const b = Math.round(rgba.b).toString(16).padStart(2, '0').toUpperCase();
                          
                          // 计算透明度：0-1 范围转换为 00-FF 十六进制
                          const alphaValue = Math.round(rgba.a * 255);
                          const alpha = alphaValue.toString(16).padStart(2, '0').toUpperCase();
                          
                          // 组合最终的颜色值：#RRGGBBAA
                          const colorWithAlpha = `#${r}${g}${b}${alpha}`;
                          setCustomColor(colorWithAlpha);
                        } catch (error) {
                          console.error('ColorPicker onChange error:', error);
                        }
                      }}
                      showText
                      format="hex"
                      allowClear
                      disabledAlpha={false}
                      placement="bottomLeft"
                    />
                    <Input
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value.toUpperCase())}
                      placeholder="#RRGGBBAA (FF=不透明,00=透明)"
                      style={{ width: 180 }}
                    />
                    <Button onClick={handleCustomColorAdd} size="small" type="primary">
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
                          {categoryColors.map(color => {
                            const note = getNote(color.id, 'color');
                            const isFav = isFavorited(color.id, 'color');
                            
                            return (
                              <div key={color.id} className="color-item-wrapper">
                                <Tooltip title={`${color.name} - ${color.code}${note?.note ? '\n注释: ' + note.note : ''}`}>
                                  <Button
                                    style={{
                                      backgroundColor: color.hex,
                                      color: color.hex === '#FFFFFF' ? '#000' : '#fff',
                                      border: `2px solid ${color.hex === '#FFFFFF' ? '#d9d9d9' : 'transparent'}`,
                                      height: 36,
                                      fontSize: '12px',
                                      position: 'relative',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    onClick={() => handleColorSelect(color)}
                                  >
                                    {color.name}
                                    {isFav && <HeartFilled style={{ position: 'absolute', top: 2, right: 2, fontSize: '10px' }} />}
                                    {note?.note && <CommentOutlined style={{ position: 'absolute', top: 2, left: 2, fontSize: '10px' }} />}
                                  </Button>
                                </Tooltip>
                                <div className="item-actions">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={isFav ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFavorite(color.id, 'color');
                                    }}
                                  />
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<CommentOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openNoteModal(color.id, 'color', color.name, color.code);
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Panel>
                    );
                  })}
                </Collapse>
              </TabPane>



              {/* 官方图标标签页 */}
              <TabPane tab={<span><EyeOutlined />官方图标</span>} key="icons">
                <IconBrowser onIconSelect={handleIconSelect} showFavoritesOnly={showFavoritesOnly} />
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

      {/* 个人注释模态框 */}
      {selectedCodeForNote && (
        <PersonalNoteModal
          visible={noteModalVisible}
          onCancel={closeNoteModal}
          codeId={selectedCodeForNote.id}
          codeType={selectedCodeForNote.type}
          codeName={selectedCodeForNote.name}
          codeValue={selectedCodeForNote.value}
          onUpdate={refreshPersonalNotes}
        />
      )}
    </div>
  );
};

export default OverwatchChatCodes; 