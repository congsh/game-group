/**
 * 游戏批量导入组件
 */

import React, { useState } from 'react';
import {
  Modal,
  Tabs,
  Upload,
  Button,
  message,
  Table,
  Typography,
  Alert,
  Input,
  Form,
  Space,
  Divider
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { GameForm, BatchImportResult } from '../../types/game';

const { TabPane } = Tabs;
const { Dragger } = Upload;
const { TextArea } = Input;
const { Text, Title } = Typography;

interface BatchImportModalProps {
  visible: boolean;
  onCancel: () => void;
  onImport: (games: GameForm[]) => Promise<BatchImportResult>;
  loading: boolean;
}

/**
 * 解析CSV文件内容
 * @param content CSV文件内容
 * @returns 游戏数据数组
 */
const parseCSV = (content: string): GameForm[] => {
  // 规范化换行符，处理不同操作系统的换行符差异
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedContent.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV文件格式不正确，至少需要标题行和数据行');
  }

  // 更智能的CSV解析，支持带逗号的引用字段
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // 处理双引号转义
          current += '"';
          i++; // 跳过下一个引号
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));
  const games: GameForm[] = [];

  // 验证必需的列
  const requiredColumns = ['name', 'minPlayers', 'maxPlayers'];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`CSV文件缺少必需的列: ${missingColumns.join(', ')}`);
  }

  for (let i = 1; i < lines.length; i++) {
    // 跳过空行
    if (!lines[i].trim()) {
      continue;
    }
    
    const values = parseCSVLine(lines[i]).map(v => v.replace(/"/g, ''));
    if (values.length !== headers.length) {
      console.warn(`第${i + 1}行字段数量不匹配，跳过该行: ${lines[i]}`);
      continue; // 跳过格式不正确的行
    }

    const game: any = {};
    headers.forEach((header, index) => {
      const value = values[index];
      
      if (header === 'minPlayers' || header === 'maxPlayers') {
        game[header] = parseInt(value) || 1;
      } else {
        game[header] = value;
      }
    });

    // 验证必需字段
    if (game.name && game.minPlayers && game.maxPlayers) {
      games.push({
        name: game.name,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        platform: game.platform || '',
        type: game.type || '',
        description: game.description || ''
      });
    }
  }

  return games;
};

/**
 * 解析JSON文件内容
 * @param content JSON文件内容
 * @returns 游戏数据数组
 */
const parseJSON = (content: string): GameForm[] => {
  try {
    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
      throw new Error('JSON文件应该包含游戏数组');
    }

    return data.map((item: any, index: number) => {
      if (!item.name || !item.minPlayers || !item.maxPlayers) {
        throw new Error(`第${index + 1}个游戏缺少必需字段 (name, minPlayers, maxPlayers)`);
      }

      return {
        name: String(item.name),
        minPlayers: Number(item.minPlayers) || 1,
        maxPlayers: Number(item.maxPlayers) || 1,
        platform: String(item.platform || ''),
        type: String(item.type || ''),
        description: String(item.description || '')
      };
    });
  } catch (error: any) {
    throw new Error(`JSON格式错误: ${error.message}`);
  }
};

/**
 * 解析文本格式内容
 * @param content 文本内容
 * @returns 游戏数据数组
 */
const parseText = (content: string): GameForm[] => {
  const lines = content.trim().split('\n').filter(line => line.trim());
  const games: GameForm[] = [];

  for (const line of lines) {
    // 支持格式: 游戏名称|最少人数|最多人数|平台|类型|描述
    // 或简化格式: 游戏名称|最少人数|最多人数
    const parts = line.split('|').map(p => p.trim());
    
    if (parts.length < 3) {
      continue; // 跳过格式不正确的行
    }

    const [name, minPlayersStr, maxPlayersStr, platform = '', type = '', description = ''] = parts;
    const minPlayers = parseInt(minPlayersStr) || 1;
    const maxPlayers = parseInt(maxPlayersStr) || 1;

    if (name && minPlayers && maxPlayers) {
      games.push({
        name,
        minPlayers,
        maxPlayers,
        platform,
        type,
        description
      });
    }
  }

  return games;
};

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  visible,
  onCancel,
  onImport,
  loading
}) => {
  const [activeTab, setActiveTab] = useState('file');
  const [previewGames, setPreviewGames] = useState<GameForm[]>([]);
  const [importResult, setImportResult] = useState<BatchImportResult | null>(null);
  const [textContent, setTextContent] = useState('');
  const [form] = Form.useForm();

  /**
   * 处理文件上传
   */
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let content = e.target?.result as string;
        
        // 处理可能存在的BOM头，避免解析错误
        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.slice(1);
        }
        let games: GameForm[] = [];

        if (file.name.toLowerCase().endsWith('.csv')) {
          games = parseCSV(content);
        } else if (file.name.toLowerCase().endsWith('.json')) {
          games = parseJSON(content);
        } else {
          message.error('只支持 CSV 和 JSON 文件格式');
          return;
        }

        if (games.length === 0) {
          message.warning('文件中没有找到有效的游戏数据');
          return;
        }

        setPreviewGames(games);
        message.success(`成功解析 ${games.length} 个游戏`);
      } catch (error: any) {
        message.error(error.message);
      }
    };

    // 指定UTF-8编码读取文件，解决中文乱码问题
    reader.readAsText(file, 'UTF-8');
    return false; // 阻止自动上传
  };

  /**
   * 处理文本内容解析
   */
  const handleTextParse = () => {
    try {
      if (!textContent.trim()) {
        message.warning('请输入游戏数据');
        return;
      }

      const games = parseText(textContent);
      
      if (games.length === 0) {
        message.warning('没有找到有效的游戏数据');
        return;
      }

      setPreviewGames(games);
      message.success(`成功解析 ${games.length} 个游戏`);
    } catch (error: any) {
      message.error(error.message);
    }
  };

  /**
   * 执行批量导入
   */
  const handleImport = async () => {
    if (previewGames.length === 0) {
      message.warning('没有可导入的游戏数据');
      return;
    }

    try {
      const result = await onImport(previewGames);
      setImportResult(result);
      
      if (result.success > 0) {
        message.success(`成功导入 ${result.success} 个游戏`);
      }
      
      if (result.failed > 0) {
        message.warning(`${result.failed} 个游戏导入失败`);
      }
    } catch (error: any) {
      message.error(error.message);
    }
  };

  /**
   * 重置状态
   */
  const handleReset = () => {
    setPreviewGames([]);
    setImportResult(null);
    setTextContent('');
    form.resetFields();
  };

  /**
   * 关闭模态框
   */
  const handleCancel = () => {
    handleReset();
    onCancel();
  };

  // 预览表格列定义
  const columns = [
    {
      title: '游戏名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '人数',
      key: 'players',
      width: 100,
      render: (_: any, record: GameForm) => (
        <span>
          {record.minPlayers === record.maxPlayers 
            ? `${record.minPlayers}人` 
            : `${record.minPlayers}-${record.maxPlayers}人`}
        </span>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  return (
    <Modal
      title="批量导入游戏"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={
        importResult ? (
          <Space>
            <Button onClick={handleReset}>重新导入</Button>
            <Button type="primary" onClick={handleCancel}>
              完成
            </Button>
          </Space>
        ) : (
          <Space>
            <Button onClick={handleCancel}>取消</Button>
            <Button onClick={handleReset}>重置</Button>
            <Button 
              type="primary" 
              onClick={handleImport}
              loading={loading}
              disabled={previewGames.length === 0}
            >
              导入 {previewGames.length > 0 && `(${previewGames.length}个)`}
            </Button>
          </Space>
        )
      }
    >
      {importResult ? (
        // 导入结果展示
        <div>
          <Alert
            message="导入完成"
            description={
              <div>
                <p>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> 
                  成功导入: {importResult.success} 个游戏
                </p>
                {importResult.failed > 0 && (
                  <p>
                    <ExclamationCircleOutlined style={{ color: '#faad14' }} /> 
                    导入失败: {importResult.failed} 个游戏
                  </p>
                )}
              </div>
            }
            type={importResult.failed > 0 ? 'warning' : 'success'}
            showIcon
          />
          
          {importResult.errors.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Title level={5}>错误详情：</Title>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {importResult.errors.map((error, index) => (
                  <Text key={index} type="danger" style={{ display: 'block' }}>
                    {error}
                  </Text>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // 导入界面
        <div>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* 文件上传标签页 */}
            <TabPane 
              tab={
                <span>
                  <UploadOutlined />
                  文件导入
                </span>
              } 
              key="file"
            >
                             <div style={{ marginBottom: 16 }}>
                 <Alert
                   message="支持文件格式"
                   description={
                     <div>
                       <p><strong>CSV格式:</strong> 需包含 name, minPlayers, maxPlayers 列</p>
                       <p><strong>JSON格式:</strong> 数组格式，每个对象包含 name, minPlayers, maxPlayers 字段</p>
                       <p><strong>编码要求:</strong> 文件请保存为 UTF-8 编码，确保中文内容正常显示</p>
                       <p>
                         <strong>示例文件:</strong> 
                         <a href="/sample-games.csv" download style={{ marginLeft: 8, marginRight: 8 }}>
                           下载CSV示例
                         </a>
                         |
                         <a href="/sample-games.json" download style={{ marginLeft: 8 }}>
                           下载JSON示例
                         </a>
                       </p>
                     </div>
                   }
                   type="info"
                   showIcon
                 />
               </div>
              
              <Dragger
                accept=".csv,.json"
                beforeUpload={handleFileUpload}
                showUploadList={false}
                multiple={false}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                <p className="ant-upload-hint">
                  支持 CSV 和 JSON 格式文件
                </p>
              </Dragger>
            </TabPane>

            {/* 文本输入标签页 */}
            <TabPane 
              tab={
                <span>
                  <FileTextOutlined />
                  文本导入
                </span>
              } 
              key="text"
            >
              <div style={{ marginBottom: 16 }}>
                <Alert
                  message="文本格式说明"
                  description={
                    <div>
                      <p>每行一个游戏，使用 | 分隔字段：</p>
                      <p><code>游戏名称|最少人数|最多人数|平台|类型|描述</code></p>
                      <p>示例：<code>王者荣耀|5|5|移动端|MOBA|经典5V5竞技游戏</code></p>
                    </div>
                  }
                  type="info"
                  showIcon
                />
              </div>
              
              <TextArea
                rows={8}
                placeholder="请输入游戏数据，每行一个游戏&#10;格式：游戏名称|最少人数|最多人数|平台|类型|描述&#10;&#10;示例：&#10;王者荣耀|5|5|移动端|MOBA|经典5V5竞技游戏&#10;英雄联盟|5|5|PC|MOBA|全球最受欢迎的MOBA游戏&#10;Among Us|4|10|PC|推理|太空狼人杀游戏"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
              
              <div style={{ marginTop: 16 }}>
                <Button type="primary" onClick={handleTextParse}>
                  解析文本
                </Button>
              </div>
            </TabPane>
          </Tabs>

          {/* 预览表格 */}
          {previewGames.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Divider>预览数据 ({previewGames.length} 个游戏)</Divider>
              <Table
                columns={columns}
                dataSource={previewGames}
                rowKey={(record, index) => `${record.name}-${index}`}
                pagination={{ pageSize: 5, showSizeChanger: false }}
                size="small"
                scroll={{ y: 200 }}
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}; 