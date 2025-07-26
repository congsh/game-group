/**
 * 守望先锋聊天代码工具函数和预定义数据
 */

import type { ColorCode, EmojiCode, FormatCode, ChatCodeElement, ChatCodeCombo } from '../types/overwatch';

// 预定义颜色代码 (守望先锋格式)
export const PREDEFINED_COLORS: ColorCode[] = [
  // 基础颜色
  { id: 'white', name: '白色', code: '<FGFFFFFFFF>', hex: '#FFFFFF', preview: '白色文本', category: 'basic' },
  { id: 'black', name: '黑色', code: '<FG000000FF>', hex: '#000000', preview: '黑色文本', category: 'basic' },
  { id: 'red', name: '红色', code: '<FGFF0000FF>', hex: '#FF0000', preview: '红色文本', category: 'basic' },
  { id: 'green', name: '绿色', code: '<FG00FF00FF>', hex: '#00FF00', preview: '绿色文本', category: 'basic' },
  { id: 'blue', name: '蓝色', code: '<FG0000FFFF>', hex: '#0000FF', preview: '蓝色文本', category: 'basic' },
  { id: 'yellow', name: '黄色', code: '<FGFFFF00FF>', hex: '#FFFF00', preview: '黄色文本', category: 'basic' },
  { id: 'orange', name: '橙色', code: '<FGFF8000FF>', hex: '#FF8000', preview: '橙色文本', category: 'basic' },
  { id: 'purple', name: '紫色', code: '<FG8000FFFF>', hex: '#8000FF', preview: '紫色文本', category: 'basic' },
  
  // 队伍颜色
  { id: 'team_blue', name: '蓝队', code: '<FG0099CCFF>', hex: '#0099CC', preview: '蓝队颜色', category: 'team' },
  { id: 'team_red', name: '红队', code: '<FGCC3300FF>', hex: '#CC3300', preview: '红队颜色', category: 'team' },
  { id: 'team_neutral', name: '中性', code: '<FGCCCCCCFF>', hex: '#CCCCCC', preview: '中性颜色', category: 'team' },
  
  // 特殊颜色
  { id: 'legendary', name: '传说橙', code: '<FGFF8C00FF>', hex: '#FF8C00', preview: '传说橙色', category: 'special' },
  { id: 'epic', name: '史诗紫', code: '<FG9966CCFF>', hex: '#9966CC', preview: '史诗紫色', category: 'special' },
  { id: 'rare', name: '稀有蓝', code: '<FG0066CCFF>', hex: '#0066CC', preview: '稀有蓝色', category: 'special' },
  { id: 'common', name: '普通灰', code: '<FG999999FF>', hex: '#999999', preview: '普通灰色', category: 'special' },
];

// 预定义表情符号和英雄图标 (守望先锋格式)
export const PREDEFINED_EMOJIS: EmojiCode[] = [
  // 英雄图标
  { id: 'dva', name: 'D.Va', code: '<TXC00000000038495>', unicode: '🎮', preview: '🎮', category: 'hero' },
  { id: 'winston', name: 'Winston', code: '<TXC00000000038494>', unicode: '🦍', preview: '🦍', category: 'hero' },
  { id: 'tracer', name: 'Tracer', code: '<TXC00000000038496>', unicode: '⚡', preview: '⚡', category: 'hero' },
  { id: 'genji', name: 'Genji', code: '<TXC00000000038497>', unicode: '🗾', preview: '🗾', category: 'hero' },
  { id: 'mercy', name: 'Mercy', code: '<TXC00000000038498>', unicode: '😇', preview: '😇', category: 'hero' },
  { id: 'reinhardt', name: 'Reinhardt', code: '<TXC00000000038499>', unicode: '🛡️', preview: '🛡️', category: 'hero' },
  
  // 表情符号
  { id: 'smile', name: '微笑', code: '<TXC00000000058001>', unicode: '😊', preview: '😊', category: 'face' },
  { id: 'laugh', name: '大笑', code: '<TXC00000000058002>', unicode: '😄', preview: '😄', category: 'face' },
  { id: 'angry', name: '愤怒', code: '<TXC00000000058003>', unicode: '😠', preview: '😠', category: 'face' },
  { id: 'cry', name: '哭泣', code: '<TXC00000000058004>', unicode: '😢', preview: '😢', category: 'face' },
  { id: 'surprised', name: '惊讶', code: '<TXC00000000058005>', unicode: '😮', preview: '😮', category: 'face' },
  { id: 'wink', name: '眨眼', code: '<TXC00000000058006>', unicode: '😉', preview: '😉', category: 'face' },
  
  // 手势
  { id: 'thumbsup', name: '点赞', code: '<TXC00000000068001>', unicode: '👍', preview: '👍', category: 'hand' },
  { id: 'thumbsdown', name: '点踩', code: '<TXC00000000068002>', unicode: '👎', preview: '👎', category: 'hand' },
  { id: 'ok', name: 'OK', code: '<TXC00000000068003>', unicode: '👌', preview: '👌', category: 'hand' },
  { id: 'peace', name: '和平', code: '<TXC00000000068004>', unicode: '✌️', preview: '✌️', category: 'hand' },
  
  // 符号
  { id: 'heart', name: '心形', code: '<TXC00000000078001>', unicode: '❤️', preview: '❤️', category: 'symbol' },
  { id: 'star', name: '星星', code: '<TXC00000000078002>', unicode: '⭐', preview: '⭐', category: 'symbol' },
  { id: 'fire', name: '火焰', code: '<TXC00000000078003>', unicode: '🔥', preview: '🔥', category: 'symbol' },
  { id: 'lightning', name: '闪电', code: '<TXC00000000078004>', unicode: '⚡', preview: '⚡', category: 'symbol' },
];

// 预定义格式代码 (守望先锋格式)
export const PREDEFINED_FORMATS: FormatCode[] = [
  { 
    id: 'color_end', 
    name: '结束颜色', 
    code: '', 
    description: '注意：在守望先锋中，颜色会持续到消息结束', 
    example: '<FGFF0000FF>红色文本（会持续到消息结束）',
    type: 'style'
  },
  { 
    id: 'space', 
    name: '空格', 
    code: ' ', 
    description: '插入空格', 
    example: '文字 空格 文字',
    type: 'spacing'
  },
  { 
    id: 'separator', 
    name: '分隔符', 
    code: ' | ', 
    description: '插入分隔符', 
    example: '内容一 | 内容二',
    type: 'spacing'
  },
];

/**
 * 生成聊天代码组合的完整代码
 */
export const buildChatCode = (elements: ChatCodeElement[]): string => {
  return elements.map(element => element.code).join('');
};

/**
 * 生成聊天代码的预览文本
 */
export const buildPreview = (elements: ChatCodeElement[]): string => {
  let preview = '';
  let currentColor = '#FFFFFF';
  
  for (const element of elements) {
    switch (element.type) {
      case 'color':
        // 从颜色代码中提取HEX值
        const colorMatch = element.code.match(/\|cFF([A-Fa-f0-9]{6})/);
        if (colorMatch) {
          currentColor = '#' + colorMatch[1];
        }
        break;
      case 'text':
        preview += element.display;
        break;
      case 'emoji':
        preview += element.preview || element.display;
        break;
      case 'format':
        if (element.code === '|r') {
          currentColor = '#FFFFFF';
        } else if (element.code === '\\n') {
          preview += '\n';
        } else if (element.code === '\\t') {
          preview += '\t';
        }
        break;
    }
  }
  
  return preview;
};

/**
 * 验证聊天代码的格式
 */
export const validateChatCode = (code: string): { isValid: boolean; errorMessage?: string } => {
  // 基本格式验证
  if (!code || code.trim() === '') {
    return { isValid: true };  // 空代码是有效的
  }
  
  // 检查守望先锋颜色代码格式 <FG??????FF>
  const colorCodeRegex = /<FG[A-Fa-f0-9]{8}>/g;
  const invalidColorCodes = code.match(/<FG[^A-Fa-f0-9>]/g);
  if (invalidColorCodes) {
    return { isValid: false, errorMessage: '颜色代码格式不正确，应为 <FG??????FF> 格式' };
  }
  
  // 检查表情/图标代码格式 <TXC?????????????>
  const emojiCodeRegex = /<TXC[0-9A-Fa-f]+>/g;
  const invalidEmojiCodes = code.match(/<TXC[^0-9A-Fa-f>]/g);
  if (invalidEmojiCodes) {
    return { isValid: false, errorMessage: '表情代码格式不正确，应为 <TXC?????????> 格式' };
  }
  
  // 检查未闭合的尖括号
  const openBrackets = (code.match(/</g) || []).length;
  const closeBrackets = (code.match(/>/g) || []).length;
  if (openBrackets !== closeBrackets) {
    return { isValid: false, errorMessage: '尖括号未正确配对' };
  }
  
  return { isValid: true };
};

/**
 * 解析现有的聊天代码为元素数组
 */
export const parseChatCode = (code: string): ChatCodeElement[] => {
  const elements: ChatCodeElement[] = [];
  let currentIndex = 0;
  
  // 正则表达式匹配各种代码
  const patterns = {
    color: /\|cFF[A-Fa-f0-9]{6}/g,
    reset: /\|r/g,
    emoji: /:[\w]+:/g,
    newline: /\\n/g,
    tab: /\\t/g,
  };
  
  // 简化解析逻辑，实际应用中可能需要更复杂的解析
  const colorMatches = Array.from(code.matchAll(patterns.color));
  const resetMatches = Array.from(code.matchAll(patterns.reset));
  
  colorMatches.forEach((match, index) => {
    if (match.index !== undefined) {
      const colorCode = match[0];
      const colorInfo = PREDEFINED_COLORS.find(c => c.code === colorCode);
      
      elements.push({
        id: `color_${index}`,
        type: 'color',
        code: colorCode,
        display: colorInfo?.name || '自定义颜色',
        preview: colorCode,
      });
    }
  });
  
  resetMatches.forEach((match, index) => {
    if (match.index !== undefined) {
      elements.push({
        id: `reset_${index}`,
        type: 'format',
        code: '|r',
        display: '重置格式',
      });
    }
  });
  
  return elements;
};

/**
 * 从HEX颜色生成守望先锋颜色代码
 */
export const hexToOwColor = (hex: string): string => {
  const cleanHex = hex.replace('#', '').toUpperCase();
  if (cleanHex.length !== 6) {
    throw new Error('无效的HEX颜色格式');
  }
  return `<FG${cleanHex}FF>`;
};

/**
 * 从守望先锋颜色代码提取HEX颜色
 */
export const owColorToHex = (owColor: string): string => {
  const match = owColor.match(/<FG([A-Fa-f0-9]{6})FF>/);
  return match ? `#${match[1]}` : '#FFFFFF';
};

/**
 * 复制文本到剪贴板
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch (error) {
    console.error('复制到剪贴板失败:', error);
    return false;
  }
};

/**
 * 生成唯一ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * 创建默认的聊天代码组合
 */
export const createDefaultCombo = (name: string, username: string): ChatCodeCombo => {
  return {
    id: generateId(),
    name,
    elements: [],
    fullCode: '',
    preview: '',
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: username,
    tags: [],
    description: '',
  };
}; 