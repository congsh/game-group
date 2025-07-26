/**
 * 守望先锋图标浏览器组件
 * 使用官方API获取和展示所有可用图标
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Input,
  Button,
  Space,
  Typography,
  Spin,
  Select,
  Switch,
  Tooltip,
  Badge,
  Alert,
  Image,
  Empty,
  Pagination,
  message,
  Modal,
  Form
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  CopyOutlined,
  StarOutlined,
  StarFilled,
  EyeOutlined,
  InfoCircleOutlined,
  ClearOutlined,
  DeleteOutlined,
  PlusOutlined,
  HeartOutlined,
  ExportOutlined,
  ImportOutlined,
  FileTextOutlined
} from '@ant-design/icons';

import { 
  fetchTextureData, 
  filterTextures, 
  generateChatCode,
  getCacheInfo,
  clearTextureCache
} from '../../services/overwatch-icons';
import type { TextureInfo, VersionInfo, IconFilterOptions } from '../../types/overwatch';
import { toggleFavorite, getPersonalNote, addOrUpdatePersonalNote, loadPersonalNotes } from '../../utils/overwatch-codes';
import './IconBrowser.css';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 收藏内容展示组件
 */
interface ViewFavoritesContentProps {
  favorites: any[];
  onRemoveFavorite: (id: string, type: string) => void;
}

const ViewFavoritesContent: React.FC<ViewFavoritesContentProps> = ({ favorites, onRemoveFavorite }) => {
  
  // 解析代码获取图标信息
  const parseCodeForIcon = (code: string): { isIcon: boolean; iconId?: string; iconUrl?: string } => {
    // 匹配官方图标代码格式 <TXCxxxxxxxxxxxxxx> (支持11-14位)
    const iconMatch = code.match(/<TXC([A-Fa-f0-9]{11,14})>/);
    if (iconMatch) {
      let iconId = iconMatch[1].toUpperCase();
      // 如果是14位ID，去掉前2位变成12位用于图片URL
      if (iconId.length === 14) {
        iconId = iconId.substring(2);
      } else if (iconId.length < 12) {
        iconId = iconId.padStart(12, '0');
      }
      const iconUrl = `https://assets.overwatchitemtracker.com/textures/${iconId}.png`;
      return { isIcon: true, iconId, iconUrl };
    }
    return { isIcon: false };
  };

  if (favorites.length === 0) {
    return (
      <Empty 
        description="暂无收藏"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">共 {favorites.length} 项收藏</Text>
      </div>
      
      {favorites.map((fav, index) => {
        const iconInfo = parseCodeForIcon(fav.codeId);
        return (
        <Card 
          key={`${fav.codeId}-${fav.codeType}-${index}`}
          size="small" 
          style={{ marginBottom: 8 }}
          extra={
            <Button 
              type="text" 
              danger 
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onRemoveFavorite(fav.codeId, fav.codeType)}
            >
              取消收藏
            </Button>
          }
        >
          <Row gutter={16} align="middle">
            {/* 图标预览 */}
            <Col span={3}>
              {iconInfo.isIcon ? (
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  background: '#000', 
                  borderRadius: 4, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <img
                    src={iconInfo.iconUrl}
                    alt={iconInfo.iconId}
                    width={32}
                    height={32}
                    style={{ objectFit: 'contain' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const placeholder = document.createElement('div');
                      placeholder.textContent = '🎮';
                      placeholder.style.cssText = `
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                      `;
                      target.parentNode?.replaceChild(placeholder, target);
                    }}
                  />
                </div>
              ) : (
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  background: '#f5f5f5', 
                  borderRadius: 4, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px solid #d9d9d9'
                }}>
                  <span style={{ fontSize: 16 }}>📝</span>
                </div>
              )}
            </Col>
            
            {/* 代码信息 */}
            <Col span={13}>
              <div>
                <Text strong style={{ fontSize: 14 }}>{fav.codeId}</Text>
                <Badge 
                  count={fav.codeType} 
                  style={{ 
                    backgroundColor: fav.codeType === 'custom' ? '#87d068' : '#108ee9',
                    marginLeft: 8 
                  }} 
                />
              </div>
              {fav.note ? (
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#f6f8fa', borderRadius: 4, border: '1px solid #e1e4e8' }}>
                  <Text style={{ fontSize: 13, color: '#24292e' }}>
                    📝 {fav.note}
                  </Text>
                </div>
              ) : (
                <div style={{ marginTop: 6 }}>
                  <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                    无备注
                  </Text>
                </div>
              )}
              <div style={{ marginTop: 6 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  创建: {new Date(fav.createdAt).toLocaleString()}
                </Text>
              </div>
            </Col>
            <Col span={8} style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    // 统一复制格式：确保所有图标代码都是 <TXC...> 格式（14位）
                    let code = '';
                    
                    // 如果是自定义收藏，检查是否有customCode字段
                    if (fav.codeType === 'custom' && (fav as any).customCode) {
                      // 使用原始保存的完整代码
                      code = (fav as any).customCode;
                    } else {
                      // 从codeId构建14位格式的代码
                      let iconId = fav.codeId;
                      // 确保ID是14位格式
                      if (iconId.length < 14) {
                        iconId = iconId.padStart(14, '0');
                      } else if (iconId.length > 14) {
                        iconId = iconId.substring(iconId.length - 14);
                      }
                      code = `<TXC${iconId}>`;
                    }
                    
                    navigator.clipboard.writeText(code).then(() => {
                      message.success(`代码已复制: ${code}`);
                    });
                  }}
                >
                  复制
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
        );
      })}
    </div>
  );
};

interface IconBrowserProps {
  onIconSelect?: (iconCode: string, iconInfo: TextureInfo) => void;
  showFavoritesOnly?: boolean;
}

const IconBrowser: React.FC<IconBrowserProps> = ({ 
  onIconSelect,
  showFavoritesOnly = false 
}) => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [textures, setTextures] = useState<TextureInfo[]>([]);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // 筛选选项
  const [searchText, setSearchText] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<number>(0);
  const [showRemoved, setShowRemoved] = useState(false);
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [showUpdatedOnly, setShowUpdatedOnly] = useState(false);
  
  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // 缓存信息
  const [cacheInfo, setCacheInfo] = useState(getCacheInfo());

  // 收藏管理状态
  const [favoriteModalVisible, setFavoriteModalVisible] = useState(false);
  const [addCodeModalVisible, setAddCodeModalVisible] = useState(false);
  const [viewFavoritesModalVisible, setViewFavoritesModalVisible] = useState(false);
  const [selectedTextureForFavorite, setSelectedTextureForFavorite] = useState<TextureInfo | null>(null);
  const [favoriteForm] = Form.useForm();
  const [addCodeForm] = Form.useForm();

  /**
   * 加载图标数据
   */
  const loadTextureData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      if (forceRefresh) {
        clearTextureCache();
      }
      
      const data = await fetchTextureData();
      setTextures(data.textures);
      setVersions(data.versions);
      setCacheInfo(getCacheInfo());
      
      console.log(`加载了 ${data.textures.length} 个图标`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '加载图标数据失败';
      setError(errorMsg);
      console.error('加载图标数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    loadTextureData();
  }, [loadTextureData]);

  /**
   * 筛选后的图标数据
   */
  const filteredTextures = useMemo(() => {
    const filterOptions: IconFilterOptions = {
      search: searchText,
      version: selectedVersion,
      showRemoved,
      showNewOnly,
      showUpdatedOnly
    };
    
    let filtered = filterTextures(textures, filterOptions);
    
    // 收藏筛选
    if (showFavoritesOnly) {
      // 获取所有收藏的个人代码
      const allFavorites = loadPersonalNotes().filter(note => note.isFavorite);
      
      // 首先筛选出收藏的官方图标
      const favoriteOfficialTextures = filtered.filter(texture => {
        // 查找使用图标ID作为codeId的收藏记录
        const note = getPersonalNote(texture.id, 'custom');
        // 确保是直接收藏的图标（不是通过<TXC...>代码收藏的）
        return note?.isFavorite && note.codeId === texture.id;
      });
      
      // 然后添加自定义收藏的图标代码（解析为虚拟texture对象）
      const customIconTextures: TextureInfo[] = [];
      
      allFavorites.forEach(fav => {
        if (fav.codeType === 'custom') {
          let iconId = '';
          let isIconCode = false;
          
          // 检查是否有customCode字段（批量导入的数据）
          if ((fav as any).customCode) {
            const iconMatch = (fav as any).customCode.match(/<TXC([A-Fa-f0-9]{11,14})>/);
            if (iconMatch) {
              iconId = iconMatch[1].toUpperCase();
              isIconCode = true;
            }
          } else {
            // 检查旧格式：codeId直接包含<TXC...>格式
            const iconMatch = fav.codeId.match(/<TXC([A-Fa-f0-9]{11,14})>/);
            if (iconMatch) {
              iconId = iconMatch[1].toUpperCase();
              isIconCode = true;
            } else {
              // 检查是否codeId就是图标ID（没有<TXC>包装）
              if (fav.codeId.match(/^[A-Fa-f0-9]{11,14}$/)) {
                iconId = fav.codeId.toUpperCase();
                isIconCode = true;
              }
            }
          }
          
          if (isIconCode && iconId) {
            // 转换为12位用于图片URL
            let displayId = iconId;
            if (iconId.length === 14) {
              displayId = iconId.substring(2);
            } else if (iconId.length < 12) {
              displayId = iconId.padStart(12, '0');
            }
            
            const iconUrl = `https://assets.overwatchitemtracker.com/textures/${displayId}.png`;
            
            // 创建虚拟texture对象，保留原始收藏信息
            const virtualTexture: TextureInfo = {
              id: displayId,
              id_raw: parseInt(displayId, 16),
              version_added_id: 0,
              version_removed_id: 0,
              version_updated_id: 0,
              version_added: '自定义',
              is_removed: false,
              is_new: false,
              is_updated: false,
              url: iconUrl,
              // 添加自定义属性以保存原始收藏信息
              originalFavorite: fav
            } as TextureInfo & { originalFavorite: any };
            
            // 检查这个图标是否已经在官方图标中了
            const existsInOfficial = favoriteOfficialTextures.some(t => t.id === displayId);
            if (!existsInOfficial) {
              customIconTextures.push(virtualTexture);
            }
          }
        }
      });
      
      filtered = [...favoriteOfficialTextures, ...customIconTextures];
    }
    
    return filtered;
  }, [textures, searchText, selectedVersion, showRemoved, showNewOnly, showUpdatedOnly, showFavoritesOnly]);

  /**
   * 分页数据
   */
  const paginatedTextures = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTextures.slice(startIndex, startIndex + pageSize);
  }, [filteredTextures, currentPage, pageSize]);

  /**
   * 处理图标选择
   */
  const handleIconSelect = useCallback((texture: TextureInfo) => {
    let chatCode: string;
    
    // 检查是否是虚拟texture对象（来自自定义收藏）
    const virtualTexture = texture as TextureInfo & { originalFavorite?: any };
    if (virtualTexture.originalFavorite) {
      // 优先使用customCode，否则使用codeId
      const fav = virtualTexture.originalFavorite;
      if (fav.customCode) {
        chatCode = fav.customCode;
      } else if (fav.codeId.startsWith('<TXC')) {
        chatCode = fav.codeId;
      } else {
        // 从codeId构建14位格式的代码
        let iconId = fav.codeId;
        if (iconId.length < 14) {
          iconId = iconId.padStart(14, '0');
        } else if (iconId.length > 14) {
          iconId = iconId.substring(iconId.length - 14);
        }
        chatCode = `<TXC${iconId}>`;
      }
    } else {
      // 生成标准聊天代码（14位）
      chatCode = generateChatCode(texture.id);
    }
    
    if (onIconSelect) {
      onIconSelect(chatCode, texture);
    }
    
    // 复制到剪贴板
    navigator.clipboard.writeText(chatCode).then(() => {
      message.success(`图标代码已复制: ${chatCode}`);
    }).catch(() => {
      message.error('复制失败，请手动复制');
    });
  }, [onIconSelect]);

  /**
   * 打开收藏模态框
   */
  const handleOpenFavoriteModal = useCallback((texture: TextureInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTextureForFavorite(texture);
    
    // 查找现有的收藏记录
    const note = getPersonalNote(texture.id, 'custom');
    const existingNote = note && note.codeId === texture.id ? note : null;
    
    favoriteForm.setFieldsValue({
      note: existingNote?.note || ''
    });
    setFavoriteModalVisible(true);
  }, [favoriteForm]);

  /**
   * 确认收藏操作
   */
  const handleConfirmFavorite = useCallback(async () => {
    if (!selectedTextureForFavorite) return;
    
    try {
      const values = await favoriteForm.validateFields();
      // 所有图标都使用'custom'类型，通过其他方式区分来源
      const codeType = 'custom';
      
      addOrUpdatePersonalNote({
        codeId: selectedTextureForFavorite.id,
        codeType: codeType,
        note: values.note || '',
        tags: [],
        isFavorite: true // 直接设为true，因为打开模态框就是要收藏
      });
      
      setFavoriteModalVisible(false);
      setSelectedTextureForFavorite(null);
      favoriteForm.resetFields();
      message.success('已添加到收藏');
    } catch (error) {
      console.error('收藏操作失败:', error);
    }
  }, [selectedTextureForFavorite, favoriteForm]);

  /**
   * 检查是否收藏
   */
  const isFavorite = useCallback((texture: TextureInfo) => {
    // 检查直接收藏的官方图标（codeId就是图标ID）
    const directNote = getPersonalNote(texture.id, 'custom');
    if (directNote?.isFavorite && directNote.codeId === texture.id) {
      return true;
    }
    
    // 检查是否是自定义收藏的图标代码
    const allFavorites = loadPersonalNotes().filter(n => n.isFavorite && n.codeType === 'custom');
    return allFavorites.some(fav => {
      let iconId = '';
      
      // 检查是否有customCode字段（批量导入的数据）
      if ((fav as any).customCode) {
        const iconMatch = (fav as any).customCode.match(/<TXC([A-Fa-f0-9]{11,14})>/);
        if (iconMatch) {
          iconId = iconMatch[1].toUpperCase();
        }
      } else {
        // 检查旧格式：codeId直接包含<TXC...>格式
        const iconMatch = fav.codeId.match(/<TXC([A-Fa-f0-9]{11,14})>/);
        if (iconMatch) {
          iconId = iconMatch[1].toUpperCase();
        } else if (fav.codeId.match(/^[A-Fa-f0-9]{11,14}$/)) {
          // codeId就是图标ID
          iconId = fav.codeId.toUpperCase();
        }
      }
      
      if (iconId) {
        // 转换为12位用于比较
        let compareId = iconId;
        if (iconId.length === 14) {
          compareId = iconId.substring(2);
        } else if (iconId.length < 12) {
          compareId = iconId.padStart(12, '0');
        }
        return compareId === texture.id;
      }
      
      return false;
    });
  }, []);

  /**
   * 重置筛选条件
   */
  const resetFilters = useCallback(() => {
    setSearchText('');
    setSelectedVersion(0);
    setShowRemoved(false);
    setShowNewOnly(false);
    setShowUpdatedOnly(false);
    setCurrentPage(1);
  }, []);

  /**
   * 清除所有收藏
   */
  const handleClearAllFavorites = useCallback(() => {
    Modal.confirm({
      title: '确认清除所有收藏？',
      content: '此操作将清除所有收藏的图标，不可恢复。',
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        const notes = loadPersonalNotes();
        const textureNotes = notes.filter(note => note.codeType === 'custom');
        textureNotes.forEach(note => {
          if (note.isFavorite) {
            addOrUpdatePersonalNote({
              ...note,
              isFavorite: false
            });
          }
        });
        message.success('已清除所有收藏');
      }
    });
  }, []);

  /**
   * 添加自定义代码收藏
   */
  const handleAddCustomCode = useCallback(async () => {
    try {
      const values = await addCodeForm.validateFields();
      addOrUpdatePersonalNote({
        codeId: values.code,
        codeType: 'custom',
        note: values.note || '',
        tags: [],
        isFavorite: true
      });
      
      setAddCodeModalVisible(false);
      addCodeForm.resetFields();
      message.success('代码已添加到收藏');
    } catch (error) {
      console.error('添加代码失败:', error);
    }
  }, [addCodeForm]);

  /**
   * 获取所有收藏数据
   */
  const getAllFavorites = useCallback(() => {
    const notes = loadPersonalNotes();
    return notes.filter(note => note.isFavorite);
  }, []);

  /**
   * 导出收藏数据
   */
  const handleExportFavorites = useCallback(() => {
    try {
      const favorites = getAllFavorites();
      const exportData = {
        exportTime: new Date().toISOString(),
        totalCount: favorites.length,
        favorites: favorites.map(fav => ({
          id: fav.codeId,
          type: fav.codeType,
          note: fav.note,
          tags: fav.tags,
          createdAt: fav.createdAt,
          updatedAt: fav.updatedAt
        }))
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `守望先锋收藏数据_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success(`已导出 ${favorites.length} 条收藏数据`);
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    }
  }, [getAllFavorites]);

  /**
   * 批量导入文本格式的收藏数据
   */
  const [batchImportModalVisible, setBatchImportModalVisible] = useState(false);
  const [batchImportText, setBatchImportText] = useState('');

  const handleBatchImport = useCallback(() => {
    setBatchImportModalVisible(true);
  }, []);

  const handleConfirmBatchImport = useCallback(() => {
    if (!batchImportText.trim()) {
      message.warning('请输入要导入的代码和备注');
      return;
    }

    try {
      const lines = batchImportText.split('\n').filter(line => line.trim());
      let importedCount = 0;

      lines.forEach(line => {
        // 匹配格式：<TXC...> 备注 或 <TXC...> 备注 <TXC...> 备注
        const codeRegex = /<TXC([0-9A-Fa-f]{11,14})>/g;
        let match;
        let lastIndex = 0;

        while ((match = codeRegex.exec(line)) !== null) {
          const code = match[0];
          const codeId = match[1].toUpperCase();
          
          // 查找这个代码后面的备注（到下一个代码或行尾）
          const nextCodeIndex = line.indexOf('<TXC', match.index + match[0].length);
          const noteEndIndex = nextCodeIndex === -1 ? line.length : nextCodeIndex;
          const noteText = line.substring(match.index + match[0].length, noteEndIndex).trim();

          if (code && codeId) {
            // 直接使用解析出的聊天代码ID作为codeId
            addOrUpdatePersonalNote({
              codeId: codeId, // 使用真实的聊天代码ID
              codeType: 'custom',
              customCode: code, // 保存完整的<TXC...>格式用于显示
              note: noteText || '',
              tags: [],
              isFavorite: true
            });
            importedCount++;
          }
        }
      });

      if (importedCount > 0) {
        message.success(`成功导入 ${importedCount} 条收藏数据`);
        setBatchImportText('');
        setBatchImportModalVisible(false);
      } else {
        message.warning('未找到有效的代码格式，请检查输入');
      }
    } catch (error) {
      console.error('批量导入失败:', error);
      message.error('导入失败，请检查输入格式');
    }
  }, [batchImportText]);

  /**
   * 导入收藏数据（JSON文件）
   */
  const handleImportFavorites = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string);
          if (!importData.favorites || !Array.isArray(importData.favorites)) {
            throw new Error('无效的数据格式');
          }

          let importedCount = 0;
          importData.favorites.forEach((fav: any) => {
            if (fav.id && fav.type) {
              addOrUpdatePersonalNote({
                codeId: fav.id,
                codeType: fav.type,
                note: fav.note || '',
                tags: fav.tags || [],
                isFavorite: true
              });
              importedCount++;
            }
          });

          message.success(`成功导入 ${importedCount} 条收藏数据`);
        } catch (error) {
          console.error('导入失败:', error);
          message.error('导入失败，请检查文件格式');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  return (
    <div className="icon-browser">
      {/* 头部工具栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索图标ID或版本..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择版本"
              value={selectedVersion}
              onChange={setSelectedVersion}
              style={{ width: '100%' }}
            >
              {versions.map(version => (
                <Option key={version.id} value={version.id}>
                  {version.name}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} md={10}>
            <Space wrap>
              <Switch
                size="small"
                checked={showRemoved}
                onChange={setShowRemoved}
                checkedChildren="显示已移除"
                unCheckedChildren="隐藏已移除"
              />
              <Switch
                size="small"
                checked={showNewOnly}
                onChange={setShowNewOnly}
                checkedChildren="仅新增"
                unCheckedChildren="全部"
              />
              <Switch
                size="small"
                checked={showUpdatedOnly}
                onChange={setShowUpdatedOnly}
                checkedChildren="仅更新"
                unCheckedChildren="全部"
              />
              
              <Button 
                size="small" 
                icon={<ClearOutlined />} 
                onClick={resetFilters}
              >
                重置
              </Button>
              
              <Button 
                size="small" 
                icon={<ReloadOutlined />} 
                onClick={() => loadTextureData(true)}
                loading={loading}
              >
                刷新
              </Button>
              
              <Button 
                size="small" 
                icon={<PlusOutlined />} 
                onClick={() => setAddCodeModalVisible(true)}
                type="primary"
              >
                自定义收藏
              </Button>
              
              <Button 
                size="small" 
                icon={<DeleteOutlined />} 
                onClick={handleClearAllFavorites}
                danger
              >
                清除收藏
              </Button>
              
              <Button 
                size="small" 
                icon={<FileTextOutlined />} 
                onClick={() => setViewFavoritesModalVisible(true)}
              >
                查看收藏
              </Button>
              
              <Button 
                size="small" 
                icon={<ExportOutlined />} 
                onClick={handleExportFavorites}
              >
                导出
              </Button>
              
              <Button 
                size="small" 
                icon={<ImportOutlined />} 
                onClick={handleImportFavorites}
              >
                导入JSON
              </Button>
              
              <Button 
                size="small" 
                icon={<PlusOutlined />} 
                onClick={handleBatchImport}
              >
                批量导入
              </Button>
            </Space>
          </Col>
        </Row>
        
        {/* 统计信息 */}
        <div style={{ marginTop: 8 }}>
          <Space>
            <Text type="secondary">
              共 {filteredTextures.length} 个图标
            </Text>
            {cacheInfo.lastUpdated && (
              <Text type="secondary">
                缓存更新时间: {cacheInfo.lastUpdated.toLocaleString()}
              </Text>
            )}
          </Space>
        </div>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => loadTextureData()}>
              重试
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 加载状态 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>正在加载图标数据...</Text>
          </div>
        </div>
      )}

      {/* 图标网格 */}
      {!loading && !error && (
        <>
          {filteredTextures.length === 0 ? (
            <Empty description="没有找到匹配的图标" />
          ) : (
            <>
              <Row gutter={[12, 12]}>
                {paginatedTextures.map((texture) => (
                  <Col key={texture.id} span={4} style={{ minWidth: '200px' }}>
                    <Card
                      size="small"
                      hoverable
                      cover={
                        <div style={{ 
                          height: 80, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: '#000', // 黑色背景，方便看白色图标
                          position: 'relative'
                        }}>
                          <img
                            src={texture.url}
                            alt={texture.id}
                            width={60}
                            height={60}
                            style={{ 
                              objectFit: 'contain',
                              background: 'transparent'
                            }}
                            onLoad={() => {
                              console.log('图片加载成功:', texture.url);
                            }}
                            onError={(e) => {
                              console.error('图片加载失败:', texture.url, '原始ID:', texture.id_raw);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              // 创建一个文本占位符
                              const placeholder = document.createElement('div');
                              placeholder.textContent = `${texture.id_raw}`;
                              placeholder.className = 'icon-placeholder';
                              placeholder.style.cssText = `
                                width: 60px;
                                height: 60px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                background: linear-gradient(135deg, #f0f0f0, #e8e8e8);
                                color: #666;
                                font-size: 10px;
                                font-family: monospace;
                                border-radius: 4px;
                                border: 1px solid #ddd;
                                text-align: center;
                                line-height: 1;
                              `;
                              target.parentNode?.replaceChild(placeholder, target);
                            }}
                          />
                          
                          {/* 收藏按钮 */}
                          <Button
                            type="text"
                            size="small"
                            icon={isFavorite(texture) ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                            onClick={(e) => handleOpenFavoriteModal(texture, e)}
                            style={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              padding: 0,
                              width: 20,
                              height: 20
                            }}
                          />
                          
                          {/* 状态标识 */}
                          {texture.is_new && (
                            <Badge 
                              text="新" 
                              color="green" 
                              style={{ position: 'absolute', top: 4, left: 4 }}
                            />
                          )}
                          {texture.is_updated && (
                            <Badge 
                              text="更新" 
                              color="blue" 
                              style={{ position: 'absolute', top: 4, left: 4 }}
                            />
                          )}
                          {texture.is_removed && (
                            <Badge 
                              text="已移除" 
                              color="red" 
                              style={{ position: 'absolute', top: 4, left: 4 }}
                            />
                          )}
                        </div>
                      }
                      actions={[
                        <Tooltip title="使用此图标" key="use">
                          <Button 
                            type="link" 
                            size="small" 
                            icon={<CopyOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIconSelect(texture);
                            }}
                          />
                        </Tooltip>,
                        <Tooltip title="预览" key="preview">
                          <Button 
                            type="link" 
                            size="small" 
                            icon={<EyeOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              // 创建预览模态框
                              const modal = document.createElement('div');
                              modal.style.cssText = `
                                position: fixed;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 100%;
                                background: rgba(0, 0, 0, 0.8);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                z-index: 9999;
                                cursor: pointer;
                              `;
                              
                              const img = document.createElement('img');
                              img.src = texture.url;
                              img.style.cssText = `
                                max-width: 90%;
                                max-height: 90%;
                                object-fit: contain;
                                border-radius: 8px;
                              `;
                              
                              const info = document.createElement('div');
                              info.textContent = `图标ID: ${texture.id} | 版本: ${texture.version_added}`;
                              info.style.cssText = `
                                position: absolute;
                                bottom: 20px;
                                left: 50%;
                                transform: translateX(-50%);
                                color: white;
                                background: rgba(0, 0, 0, 0.7);
                                padding: 8px 16px;
                                border-radius: 4px;
                                font-size: 14px;
                              `;
                              
                              modal.appendChild(img);
                              modal.appendChild(info);
                              document.body.appendChild(modal);
                              
                              // 点击关闭
                              modal.addEventListener('click', () => {
                                document.body.removeChild(modal);
                              });
                              
                              // ESC键关闭
                              const handleEsc = (e: KeyboardEvent) => {
                                if (e.key === 'Escape') {
                                  document.body.removeChild(modal);
                                  document.removeEventListener('keydown', handleEsc);
                                }
                              };
                              document.addEventListener('keydown', handleEsc);
                            }}
                          />
                        </Tooltip>,
                        <Tooltip title="收藏" key="favorite">
                          <Button 
                            type="link" 
                            size="small" 
                            icon={isFavorite(texture) ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFavoriteModal(texture, e);
                            }}
                          />
                        </Tooltip>
                      ]}
                    >
                      <div style={{ textAlign: 'center', padding: '4px 0' }}>
                        <Text 
                          ellipsis={{ tooltip: texture.id }} 
                          style={{ fontSize: '11px', lineHeight: 1, display: 'block', marginBottom: '2px' }}
                        >
                          {texture.id}
                        </Text>
                        <Text 
                          type="secondary" 
                          style={{ fontSize: '9px', lineHeight: 1 }}
                        >
                          {texture.version_added}
                        </Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
              
              {/* 分页 */}
                             {filteredTextures.length > 0 && (
                 <div style={{ textAlign: 'center', marginTop: 24 }}>
                   <Pagination
                     current={currentPage}
                     total={filteredTextures.length}
                     pageSize={pageSize}
                     onChange={(page) => setCurrentPage(page)}
                     showSizeChanger={true}
                     showQuickJumper
                     pageSizeOptions={['20', '50', '100']}
                     onShowSizeChange={(current, size) => {
                       setPageSize(size);
                       setCurrentPage(1); // 重置到第一页
                     }}
                     showTotal={(total, range) => 
                       `第 ${range[0]}-${range[1]} 项，共 ${total} 项`
                     }
                   />
                 </div>
               )}
            </>
          )}
        </>
      )}

      {/* 收藏管理模态框 */}
      <Modal
        title="管理收藏"
        open={favoriteModalVisible}
        onOk={handleConfirmFavorite}
        onCancel={() => {
          setFavoriteModalVisible(false);
          setSelectedTextureForFavorite(null);
          favoriteForm.resetFields();
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={favoriteForm} layout="vertical">
          <Form.Item label="图标信息">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: 12, 
              background: '#f5f5f5', 
              borderRadius: 6 
            }}>
              {selectedTextureForFavorite && (
                <>
                  <img
                    src={selectedTextureForFavorite.url}
                    alt={selectedTextureForFavorite.id}
                    width={32}
                    height={32}
                    style={{ marginRight: 12 }}
                  />
                  <div>
                    <div><strong>ID:</strong> {selectedTextureForFavorite.id}</div>
                    <div><strong>版本:</strong> {selectedTextureForFavorite.version_added}</div>
                  </div>
                </>
              )}
            </div>
          </Form.Item>
          
          <Form.Item 
            name="note" 
            label="备注"
          >
            <TextArea 
              rows={3} 
              placeholder="为这个图标添加备注..." 
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加自定义代码模态框 */}
      <Modal
        title="自定义收藏"
        open={addCodeModalVisible}
        onOk={handleAddCustomCode}
        onCancel={() => {
          setAddCodeModalVisible(false);
          addCodeForm.resetFields();
        }}
        okText="收藏"
        cancelText="取消"
      >
        <Form form={addCodeForm} layout="vertical">
          <Form.Item 
            name="code" 
            label="聊天代码"
            rules={[{ required: true, message: '请输入聊天代码' }]}
          >
            <Input 
              placeholder="例如: <TXC000000005DAD>" 
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
          
          <Form.Item 
            name="note" 
            label="备注"
          >
            <TextArea 
              rows={3} 
              placeholder="为这个代码添加备注..." 
              maxLength={200}
              showCount
            />
          </Form.Item>
                  </Form>
        </Modal>

        {/* 查看收藏模态框 */}
        <Modal
          title="我的收藏"
          open={viewFavoritesModalVisible}
          onCancel={() => setViewFavoritesModalVisible(false)}
          footer={[
            <Button key="export" icon={<ExportOutlined />} onClick={handleExportFavorites}>
              导出收藏
            </Button>,
            <Button key="close" onClick={() => setViewFavoritesModalVisible(false)}>
              关闭
            </Button>
          ]}
          width={800}
        >
          <ViewFavoritesContent 
            favorites={getAllFavorites()} 
            onRemoveFavorite={(id, type) => {
              const note = getPersonalNote(id, type);
              if (note) {
                addOrUpdatePersonalNote({
                  ...note,
                  isFavorite: false
                });
                message.success('已取消收藏');
              }
            }}
          />
        </Modal>

        {/* 批量导入模态框 */}
        <Modal
          title="批量导入收藏代码"
          open={batchImportModalVisible}
          onOk={handleConfirmBatchImport}
          onCancel={() => {
            setBatchImportModalVisible(false);
            setBatchImportText('');
          }}
          okText="导入"
          cancelText="取消"
          width={600}
        >
          <div style={{ marginBottom: 16 }}>
            <Typography.Text strong>支持的格式：</Typography.Text>
            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
              • 每行一个或多个代码+备注：<code>&lt;TXC000000000402CE&gt; 花男</code><br/>
              • 多个代码可在同一行：<code>&lt;TXC...&gt; 备注1 &lt;TXC...&gt; 备注2</code><br/>
              • 支持换行分隔多组代码
            </div>
          </div>
          <Input.TextArea
            value={batchImportText}
            onChange={(e) => setBatchImportText(e.target.value)}
            placeholder="请输入要导入的代码和备注，例如：
<TXC000000000402CE> 花男
<TXC0000000002A9FE> sad face
<TXC000000000207B9> 补给箱"
            rows={8}
            maxLength={10000}
            showCount
          />
        </Modal>
      </div>
    );
  };

export default IconBrowser; 