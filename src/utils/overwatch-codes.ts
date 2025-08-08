/**
 * 守望先锋聊天代码工具函数和预定义数据
 */

import type { ColorCode, EmojiCode, FormatCode, ChatCodeElement, ChatCodeCombo, PersonalCodeNote } from '../types/overwatch';

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

// 预定义表情符号和英雄图标 (真实守望先锋代码)
export const PREDEFINED_EMOJIS: EmojiCode[] = [
  // 真实英雄图标（基于官方代码）
  { id: 'hero_unknown', name: '未知英雄', code: '<TXC00000000001297>', unicode: '❓', preview: '❓', category: 'hero' },
  { id: 'hero_mei', name: '美', code: '<TXC00000000004F66>', unicode: '❄️', preview: '❄️', category: 'hero' },
  { id: 'hero_reaper', name: '死神', code: '<TXC00000000004F71>', unicode: '💀', preview: '💀', category: 'hero' },
  { id: 'hero_tracer', name: '猎空', code: '<TXC00000000004F91>', unicode: '⚡', preview: '⚡', category: 'hero' },
  { id: 'hero_widowmaker', name: '黑百合', code: '<TXC00000000004F56>', unicode: '🕷️', preview: '🕷️', category: 'hero' },
  { id: 'hero_needs_icon', name: '需要图标', code: '<TXC00000000004F89>', unicode: '📷', preview: '📷', category: 'hero' },
  
  // 游戏控制图标
  { id: 'left_click', name: '鼠标左键', code: '<TXC0000000000447F>', unicode: '🖱️', preview: '🖱️', category: 'misc' },
  { id: 'right_click', name: '鼠标右键', code: '<TXC00000000004480>', unicode: '🖱️', preview: '🖱️', category: 'misc' },
  { id: 'middle_click', name: '鼠标中键', code: '<TXC00000000005DAD>', unicode: '🖱️', preview: '🖱️', category: 'misc' },
  { id: 'scroll_up', name: '上滚', code: '<TXC00000000005DA0>', unicode: '⬆️', preview: '⬆️', category: 'misc' },
  { id: 'scroll_down', name: '下滚', code: '<TXC00000000005DA1>', unicode: '⬇️', preview: '⬇️', category: 'misc' },
  
  // 游戏成就图标
  { id: 'elimination', name: '击杀', code: '<TXC000000000015BB>', unicode: '💀', preview: '💀', category: 'symbol' },
  { id: 'gold_medal', name: '金牌', code: '<TXC0000000000797E>', unicode: '🥇', preview: '🥇', category: 'symbol' },
  { id: 'silver_medal', name: '银牌', code: '<TXC0000000000797C>', unicode: '🥈', preview: '🥈', category: 'symbol' },
  { id: 'bronze_medal', name: '铜牌', code: '<TXC0000000000797D>', unicode: '🥉', preview: '🥉', category: 'symbol' },
  
  // 竞技相关
  { id: 'competitive_points', name: '竞技点数', code: '<TXC0000000000906E>', unicode: '🏆', preview: '🏆', category: 'symbol' },
  { id: 'top500_white', name: 'TOP500', code: '<TXC0000000000A541>', unicode: '👑', preview: '👑', category: 'symbol' },
  { id: 'top500_color', name: 'TOP500彩色', code: '<TXC0000000000A4E5>', unicode: '👑', preview: '👑', category: 'symbol' },
  { id: 'endorsement_green', name: '好队友', code: '<TXC0000000001764D>', unicode: '💚', preview: '💚', category: 'symbol' },
  { id: 'endorsement_purple', name: '优秀领导', code: '<TXC0000000001764E>', unicode: '💜', preview: '💜', category: 'symbol' },
  { id: 'endorsement_yellow', name: '体育精神', code: '<TXC0000000001764F>', unicode: '💛', preview: '💛', category: 'symbol' },
  
  // 游戏功能图标
  { id: 'ready_check', name: '准备检查', code: '<TXC000000000039DB>', unicode: '✅', preview: '✅', category: 'face' },
  { id: 'workshop', name: '工坊', code: '<TXC0000000001FEE9>', unicode: '🔧', preview: '🔧', category: 'symbol' },
  { id: 'microphone', name: '麦克风', code: '<TXC00000000007114>', unicode: '🎤', preview: '🎤', category: 'misc' },
  { id: 'credits', name: '游戏币', code: '<TXC000000000008E02>', unicode: '💰', preview: '💰', category: 'symbol' },
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
 * 支持带透明度的颜色值
 */
export const hexToOwColor = (hex: string): string => {
  let cleanHex = hex.replace('#', '').toUpperCase();
  
  // 处理3位HEX (如 #F00 -> #FF0000)
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  
  // 处理6位HEX (如 #FF0000)
  if (cleanHex.length === 6) {
    return `<FG${cleanHex}FF>`;
  }
  
  // 处理8位HEX (如 #FF0000FF 或 #FF000080)
  if (cleanHex.length === 8) {
    const color = cleanHex.substring(0, 6);
    const alpha = cleanHex.substring(6, 8);
    return `<FG${color}${alpha}>`;
  }
  
  throw new Error('无效的HEX颜色格式，支持格式：#RGB、#RRGGBB、#RRGGBBAA');
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

// === 个人注释和收藏功能 ===

/**
 * 检查代码是否是图标代码
 */
export const isIconCode = (code: string): boolean => {
  return /^<TXC[0-9A-Fa-f]+>$/i.test(code);
};

/**
 * 获取代码的预览信息
 */
export const getCodePreview = (code: string): { preview: string; isIcon: boolean } => {
  if (isIconCode(code)) {
    return { preview: '[图标]', isIcon: true };
  } else if (/^<FG[A-Fa-f0-9]{8}>$/i.test(code)) {
    const color = owColorToHex(code);
    return { preview: `颜色: ${color}`, isIcon: false };
  } else {
    return { preview: code, isIcon: false };
  }
};

/**
 * 从localStorage加载个人注释
 */
export const loadPersonalNotes = (): PersonalCodeNote[] => {
  try {
    const notes = localStorage.getItem('overwatch_personal_notes');
    return notes ? JSON.parse(notes) : [];
  } catch {
    return [];
  }
};

/**
 * 保存个人注释到localStorage
 */
export const savePersonalNotes = (notes: PersonalCodeNote[]): void => {
  try {
    localStorage.setItem('overwatch_personal_notes', JSON.stringify(notes));
  } catch (error) {
    console.error('保存个人注释失败:', error);
  }
};

/**
 * 添加或更新个人注释
 */
export const addOrUpdatePersonalNote = (note: Omit<PersonalCodeNote, 'id' | 'createdAt' | 'updatedAt'>): PersonalCodeNote => {
  const notes = loadPersonalNotes();
  const existingIndex = notes.findIndex(n => n.codeId === note.codeId && n.codeType === note.codeType);
  
  const newNote: PersonalCodeNote = {
    ...note,
    id: existingIndex >= 0 ? notes[existingIndex].id : generateId(),
    createdAt: existingIndex >= 0 ? notes[existingIndex].createdAt : new Date(),
    updatedAt: new Date(),
  };

  if (existingIndex >= 0) {
    notes[existingIndex] = newNote;
  } else {
    notes.push(newNote);
  }

  savePersonalNotes(notes);
  return newNote;
};

/**
 * 获取指定代码的个人注释
 */
export const getPersonalNote = (codeId: string, codeType: string): PersonalCodeNote | undefined => {
  const notes = loadPersonalNotes();
  return notes.find(n => n.codeId === codeId && n.codeType === codeType);
};

/**
 * 删除个人注释
 */
export const deletePersonalNote = (noteId: string): void => {
  const notes = loadPersonalNotes();
  const filteredNotes = notes.filter(n => n.id !== noteId);
  savePersonalNotes(filteredNotes);
};

/**
 * 切换收藏状态
 */
export const toggleFavorite = (codeId: string, codeType: string): boolean => {
  const notes = loadPersonalNotes();
  const existingIndex = notes.findIndex(n => n.codeId === codeId && n.codeType === codeType);
  
  if (existingIndex >= 0) {
    notes[existingIndex].isFavorite = !notes[existingIndex].isFavorite;
    notes[existingIndex].updatedAt = new Date();
  } else {
    const newNote: PersonalCodeNote = {
      id: generateId(),
      codeId,
      codeType: codeType as 'color' | 'emoji' | 'format' | 'custom',
      note: '',
      tags: [],
      isFavorite: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    notes.push(newNote);
  }
  
  savePersonalNotes(notes);
  return notes.find(n => n.codeId === codeId && n.codeType === codeType)?.isFavorite || false;
};

/**
 * 获取收藏的代码
 */
export const getFavoriteNotes = (): PersonalCodeNote[] => {
  const notes = loadPersonalNotes();
  return notes.filter(n => n.isFavorite);
};