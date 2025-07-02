/**
 * 初始化示例数据
 */

import AV from '../services/leancloud';

/**
 * 初始化示例游戏数据
 */
export const initSampleGames = async (): Promise<void> => {
  try {
    // 检查是否已有游戏数据
    let count = 0;
    try {
      const query = new AV.Query('Game');
      count = await query.count();
    } catch (error: any) {
      // 如果数据表不存在，count保持为0，继续创建数据
      if (error.code !== 404) {
        throw error;
      }
      console.log('Game表不存在，将创建示例数据');
    }
    
    if (count > 0) {
      console.log('游戏数据已存在，跳过初始化');
      return;
    }

    // 获取当前用户
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    // 示例游戏数据
    const sampleGames = [
      {
        name: '英雄联盟',
        minPlayers: 2,
        maxPlayers: 10,
        platform: 'PC',
        type: 'MOBA',
        description: '5v5经典对战游戏，考验团队合作和个人操作'
      },
      {
        name: '王者荣耀',
        minPlayers: 2,
        maxPlayers: 10,
        platform: '手机',
        type: 'MOBA',
        description: '手机端MOBA游戏，随时随地开黑'
      },
      {
        name: '和平精英',
        minPlayers: 1,
        maxPlayers: 4,
        platform: '手机',
        type: '射击',
        description: '100人大逃杀，刺激战场体验'
      },
      {
        name: 'CS2',
        minPlayers: 2,
        maxPlayers: 10,
        platform: 'PC',
        type: '射击',
        description: '经典FPS游戏，考验枪法和战术'
      },
      {
        name: '原神',
        minPlayers: 1,
        maxPlayers: 4,
        platform: 'PC/手机',
        type: '角色扮演',
        description: '开放世界冒险游戏，多人联机探索'
      },
      {
        name: '我的世界',
        minPlayers: 1,
        maxPlayers: 20,
        platform: 'PC/手机',
        type: '沙盒',
        description: '自由建造和冒险，创造无限可能'
      },
      {
        name: '糖豆人',
        minPlayers: 1,
        maxPlayers: 60,
        platform: 'PC/手机',
        type: '休闲',
        description: '可爱的派对游戏，轻松愉快的竞技体验'
      }
    ];

    // 创建游戏对象
    const GameClass = AV.Object.extend('Game');
    const promises = sampleGames.map(gameData => {
      const game = new GameClass();
      game.set('name', gameData.name);
      game.set('minPlayers', gameData.minPlayers);
      game.set('maxPlayers', gameData.maxPlayers);
      game.set('platform', gameData.platform);
      game.set('type', gameData.type);
      game.set('description', gameData.description);
      game.set('likeCount', Math.floor(Math.random() * 50)); // 随机点赞数
      game.set('createdBy', currentUser);
      return game.save();
    });

    await Promise.all(promises);
    console.log('示例游戏数据初始化完成');
  } catch (error: any) {
    console.error('初始化示例数据失败:', error);
    throw error;
  }
};

/**
 * 初始化 DailyVote 数据表
 */
export const initDailyVoteTable = async (): Promise<void> => {
  try {
    // 获取当前用户
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    console.log('开始创建DailyVote表结构...');
    
    // 直接创建一个临时的 DailyVote 记录来建立数据表结构
    const DailyVoteClass = AV.Object.extend('DailyVote');
    const placeholderVote = new DailyVoteClass();
    
    const today = new Date().toISOString().split('T')[0];
    placeholderVote.set('date', today);
    placeholderVote.set('user', currentUser.id);
    placeholderVote.set('wantsToPlay', false);
    placeholderVote.set('selectedGames', []);
    
    const savedVote = await placeholderVote.save();
    console.log('DailyVote表创建成功');
    
    // 立即删除占位符记录
    await savedVote.destroy();
    console.log('清理占位符记录完成');
    
    console.log('DailyVote表初始化完成');
  } catch (error: any) {
    console.error('初始化DailyVote表失败:', error);
    throw error;
  }
};

/**
 * 初始化 WeekendTeam 数据表
 */
export const initWeekendTeamTable = async (): Promise<void> => {
  try {
    // 获取当前用户
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    console.log('开始创建WeekendTeam表结构...');

    // 直接创建一个临时的 WeekendTeam 记录来建立数据表结构
    const WeekendTeamClass = AV.Object.extend('WeekendTeam');
    const placeholderTeam = new WeekendTeamClass();
    
    placeholderTeam.set('game', '_PLACEHOLDER_GAME_');
    placeholderTeam.set('eventDate', new Date().toISOString().split('T')[0]);
    placeholderTeam.set('startTime', '14:00');
    placeholderTeam.set('endTime', '18:00');
    placeholderTeam.set('leader', currentUser.id);
    placeholderTeam.set('members', [currentUser.id]);
    placeholderTeam.set('maxMembers', 4);
    placeholderTeam.set('status', 'open');
    
    const savedTeam = await placeholderTeam.save();
    console.log('WeekendTeam表创建成功');
    
    // 立即删除占位符记录
    await savedTeam.destroy();
    console.log('清理占位符记录完成');
    
    console.log('WeekendTeam表初始化完成');
  } catch (error: any) {
    console.error('初始化WeekendTeam表失败:', error);
    throw error;
  }
};

/**
 * 检查并初始化所有数据表
 */
export const checkAndInitData = async (): Promise<boolean> => {
  try {
    // 按顺序初始化各个数据表
    await initSampleGames();
    await initDailyVoteTable();
    await initWeekendTeamTable();
    
    console.log('所有数据表初始化完成');
    return true;
  } catch (error: any) {
    console.error('数据初始化检查失败:', error);
    return false;
  }
};

/**
 * 快速初始化数据表（创建一个隐藏的占位符）
 */
export const quickInitTable = async (): Promise<void> => {
  try {
    const currentUser = AV.User.current();
    if (!currentUser) {
      return;
    }

    // 尝试查询，如果失败说明表不存在
    try {
      const query = new AV.Query('Game');
      query.limit(1);
      await query.find();
      // 如果成功，说明表已存在
      return;
    } catch (error: any) {
      if (error.code !== 404) {
        return; // 其他错误，不处理
      }
    }

    // 创建一个临时占位符游戏来建立数据表
    const GameClass = AV.Object.extend('Game');
    const placeholderGame = new GameClass();
    
    placeholderGame.set('name', '_PLACEHOLDER_');
    placeholderGame.set('minPlayers', 1);
    placeholderGame.set('maxPlayers', 1);
    placeholderGame.set('platform', 'SYSTEM');
    placeholderGame.set('type', 'PLACEHOLDER');
    placeholderGame.set('description', '系统占位符，用于初始化数据表');
    placeholderGame.set('likeCount', 0);
    placeholderGame.set('createdBy', currentUser);
    
    await placeholderGame.save();
    
    // 立即删除占位符
    await placeholderGame.destroy();
    
    console.log('数据表初始化完成');
  } catch (error: any) {
    console.error('快速初始化失败:', error);
  }
};

/**
 * 手动运行数据表初始化（用于调试和修复）
 * 可以在控制台中调用：window.manualInitTables()
 */
export const manualInitTables = async (): Promise<void> => {
  try {
    console.log('开始手动初始化数据表...');
    
    const currentUser = AV.User.current();
    if (!currentUser) {
      console.error('用户未登录，无法初始化数据表');
      alert('请先登录再初始化数据表');
      return;
    }

    // 逐一初始化各个数据表
    console.log('1. 初始化 Game 表...');
    await initSampleGames();
    
    console.log('2. 初始化 DailyVote 表...');
    await initDailyVoteTable();
    
    console.log('3. 初始化 WeekendTeam 表...');
    await initWeekendTeamTable();
    
    console.log('✅ 所有数据表初始化完成！');
    alert('数据表初始化完成！');
  } catch (error: any) {
    console.error('❌ 手动初始化数据表失败:', error);
    alert(`数据表初始化失败: ${error.message}`);
  }
};

// 将函数暴露到全局作用域，方便调试
if (typeof window !== 'undefined') {
  (window as any).manualInitTables = manualInitTables;
} 