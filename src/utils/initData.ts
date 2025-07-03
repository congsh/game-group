/**
 * 初始化示例数据
 */

import AV from '../services/leancloud';

/**
 * 初始化示例游戏数据（按需创建）
 * 用于演示和快速体验
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
 * 初始化 UserFavorite 数据表
 */
export const initUserFavoriteTable = async (): Promise<void> => {
  try {
    // 获取当前用户
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    console.log('开始创建UserFavorite表结构...');

    // 直接创建一个临时的 UserFavorite 记录来建立数据表结构
    const UserFavoriteClass = AV.Object.extend('UserFavorite');
    const placeholderFavorite = new UserFavoriteClass();
    
    placeholderFavorite.set('user', currentUser.id);
    placeholderFavorite.set('game', '_PLACEHOLDER_GAME_');
    
    const savedFavorite = await placeholderFavorite.save();
    console.log('UserFavorite表创建成功');
    
    // 立即删除占位符记录
    await savedFavorite.destroy();
    console.log('清理占位符记录完成');
    
    console.log('UserFavorite表初始化完成');
  } catch (error: any) {
    console.error('初始化UserFavorite表失败:', error);
    throw error;
  }
};

/**
 * 检查并初始化所有数据表（包含示例数据）
 */
export const checkAndInitData = async (): Promise<boolean> => {
  try {
    // 按顺序初始化各个数据表
    await initSampleGames(); // 这个函数现在会创建示例游戏
    await initDailyVoteTable();
    await initWeekendTeamTable();
    await initUserFavoriteTable();
    
    console.log('所有数据表和示例数据初始化完成');
    return true;
  } catch (error: any) {
    console.error('数据初始化检查失败:', error);
    return false;
  }
};

/**
 * 快速初始化游戏表结构（创建空表）
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
    
    console.log('游戏表结构初始化完成（空表）');
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
    
    console.log('4. 初始化 UserFavorite 表...');
    await initUserFavoriteTable();
    
    console.log('✅ 所有数据表初始化完成！');
    alert('数据表初始化完成！');
  } catch (error: any) {
    console.error('❌ 手动初始化数据表失败:', error);
    alert(`数据表初始化失败: ${error.message}`);
  }
};

/**
 * 快速修复数据表缺失问题
 * 专门用于解决报表页面和周末组队页面的表不存在错误
 */
export const quickFixMissingTables = async (): Promise<void> => {
  try {
    console.log('🔧 开始快速修复数据表缺失问题...');
    
    const currentUser = AV.User.current();
    if (!currentUser) {
      console.error('❌ 用户未登录，无法修复数据表');
      alert('请先登录再执行修复操作');
      return;
    }

    const fixes: Array<{name: string; fn: () => Promise<void>}> = [
      {
        name: 'UserFavorite表',
        fn: async () => {
          try {
            // 先尝试查询一下是否存在
            const query = new AV.Query('UserFavorite');
            query.limit(1);
            await query.find();
            console.log('✅ UserFavorite表已存在');
          } catch (error: any) {
            if (error.code === 404) {
              console.log('📝 创建UserFavorite表...');
              await initUserFavoriteTable();
              console.log('✅ UserFavorite表创建成功');
            }
          }
        }
      },
      {
        name: 'Game表结构',
        fn: async () => {
          try {
            const query = new AV.Query('Game');
            query.limit(1);
            await query.find();
            console.log('✅ Game表已存在');
          } catch (error: any) {
            if (error.code === 404) {
              console.log('📝 创建Game表结构...');
              await quickInitTable();
              console.log('✅ Game表结构创建成功');
            }
          }
        }
      },
      {
        name: 'WeekendTeam表',
        fn: async () => {
          try {
            const query = new AV.Query('WeekendTeam');
            query.limit(1);
            await query.find();
            console.log('✅ WeekendTeam表已存在');
          } catch (error: any) {
            if (error.code === 404) {
              console.log('📝 创建WeekendTeam表...');
              await initWeekendTeamTable();
              console.log('✅ WeekendTeam表创建成功');
            }
          }
        }
      },
      {
        name: 'DailyVote表',
        fn: async () => {
          try {
            const query = new AV.Query('DailyVote');
            query.limit(1);
            await query.find();
            console.log('✅ DailyVote表已存在');
          } catch (error: any) {
            if (error.code === 404) {
              console.log('📝 创建DailyVote表...');
              await initDailyVoteTable();
              console.log('✅ DailyVote表创建成功');
            }
          }
        }
      }
    ];

    // 逐个执行修复
    for (const fix of fixes) {
      try {
        console.log(`🔍 检查 ${fix.name}...`);
        await fix.fn();
      } catch (error: any) {
        console.error(`❌ 修复 ${fix.name} 失败:`, error);
      }
    }

    console.log('🎉 快速修复完成！');
    alert('数据表修复完成！请刷新页面查看效果。');
  } catch (error: any) {
    console.error('❌ 快速修复失败:', error);
    alert(`修复失败: ${error.message}`);
  }
};

/**
 * 数据迁移：将现有用户的收藏数据同步到UserFavorite表
 */
export const migrateFavoriteData = async (): Promise<void> => {
  try {
    console.log('开始迁移收藏数据...');
    
    // 确保UserFavorite表存在
    await initUserFavoriteTable();
    
    // 获取所有有收藏记录的用户
    const userQuery = new AV.Query(AV.User);
    userQuery.exists('favoriteGames');
    userQuery.limit(1000);
    const users = await userQuery.find();
    
    let migratedCount = 0;
    let totalFavorites = 0;
    
    for (const user of users) {
      const userId = user.id;
      if (!userId) continue;
      
      const favoriteGames = user.get('favoriteGames') || [];
      
      if (favoriteGames.length === 0) continue;
      
      console.log(`迁移用户 ${userId} 的 ${favoriteGames.length} 个收藏...`);
      
      // 检查已存在的UserFavorite记录
      const existingQuery = new AV.Query('UserFavorite');
      existingQuery.equalTo('user', userId);
      const existingFavorites = await existingQuery.find();
      const existingGameIds = existingFavorites.map(fav => fav.get('game'));
      
      // 找出需要创建的收藏记录
      const UserFavoriteClass = AV.Object.extend('UserFavorite');
      const toCreate = [];
      
      for (const gameId of favoriteGames) {
        if (!existingGameIds.includes(gameId)) {
          const userFavorite = new UserFavoriteClass();
          userFavorite.set('user', userId);
          userFavorite.set('game', gameId);
          toCreate.push(userFavorite);
        }
      }
      
      // 批量创建新的收藏记录
      if (toCreate.length > 0) {
        await AV.Object.saveAll(toCreate);
        totalFavorites += toCreate.length;
        migratedCount++;
      }
    }
    
    console.log(`收藏数据迁移完成！共迁移了 ${migratedCount} 个用户的 ${totalFavorites} 条收藏记录。`);
  } catch (error: any) {
    console.error('迁移收藏数据失败:', error);
    throw error;
  }
};

/**
 * 数据一致性检查：检查_User表和UserFavorite表的数据是否一致
 */
export const checkFavoriteDataConsistency = async (): Promise<{
  consistent: boolean;
  issues: string[];
  statistics: {
    totalUsers: number;
    totalUserFavorites: number;
    totalGameReferences: number;
    inconsistentUsers: number;
  };
}> => {
  try {
    console.log('开始检查收藏数据一致性...');
    
    const issues: string[] = [];
    let inconsistentUsers = 0;
    
    // 获取所有有收藏记录的用户
    const userQuery = new AV.Query(AV.User);
    userQuery.exists('favoriteGames');
    userQuery.limit(1000);
    const users = await userQuery.find();
    
    // 获取所有UserFavorite记录
    const favoriteQuery = new AV.Query('UserFavorite');
    favoriteQuery.limit(10000);
    const userFavorites = await favoriteQuery.find();
    
    // 按用户分组UserFavorite记录
    const userFavoriteMap = new Map<string, string[]>();
    userFavorites.forEach(fav => {
      const userId = fav.get('user');
      const gameId = fav.get('game');
      if (!userFavoriteMap.has(userId)) {
        userFavoriteMap.set(userId, []);
      }
      userFavoriteMap.get(userId)!.push(gameId);
    });
    
    // 检查每个用户的数据一致性
    for (const user of users) {
      const userId = user.id;
      if (!userId) continue;
      
      const userFavoriteGames = user.get('favoriteGames') || [];
      const userFavoriteRecords = userFavoriteMap.get(userId) || [];
      
      // 检查数量是否一致
      if (userFavoriteGames.length !== userFavoriteRecords.length) {
        issues.push(`用户 ${userId}: _User表有${userFavoriteGames.length}个收藏，UserFavorite表有${userFavoriteRecords.length}个记录`);
        inconsistentUsers++;
        continue;
      }
      
      // 检查内容是否一致
      const missingInUserFavorite = userFavoriteGames.filter((gameId: string) => !userFavoriteRecords.includes(gameId));
      const extraInUserFavorite = userFavoriteRecords.filter((gameId: string) => !userFavoriteGames.includes(gameId));
      
      if (missingInUserFavorite.length > 0 || extraInUserFavorite.length > 0) {
        if (missingInUserFavorite.length > 0) {
          issues.push(`用户 ${userId}: UserFavorite表缺少游戏 ${missingInUserFavorite.join(', ')}`);
        }
        if (extraInUserFavorite.length > 0) {
          issues.push(`用户 ${userId}: UserFavorite表多余游戏 ${extraInUserFavorite.join(', ')}`);
        }
        inconsistentUsers++;
      }
    }
    
    const statistics = {
      totalUsers: users.length,
      totalUserFavorites: userFavorites.length,
      totalGameReferences: users.reduce((sum, user) => sum + (user.get('favoriteGames') || []).length, 0),
      inconsistentUsers
    };
    
    const consistent = issues.length === 0;
    
    console.log('一致性检查完成：', {
      consistent,
      issuesCount: issues.length,
      statistics
    });
    
    return { consistent, issues, statistics };
  } catch (error: any) {
    console.error('检查数据一致性失败:', error);
    throw error;
  }
};

/**
 * 全局修复函数：检查并修复收藏数据
 */
export const fixFavoriteDataConsistency = async (): Promise<void> => {
  try {
    console.log('开始修复收藏数据一致性...');
    
    // 先检查一致性
    const { consistent, issues, statistics } = await checkFavoriteDataConsistency();
    
    if (consistent) {
      console.log('收藏数据一致性良好，无需修复。');
      return;
    }
    
    console.log(`发现 ${issues.length} 个不一致问题，开始修复...`);
    
    // 执行数据迁移
    await migrateFavoriteData();
    
    // 再次检查
    const { consistent: isConsistentAfter, issues: remainingIssues } = await checkFavoriteDataConsistency();
    
    if (isConsistentAfter) {
      console.log('收藏数据修复成功！');
    } else {
      console.warn(`修复后仍有 ${remainingIssues.length} 个问题：`, remainingIssues);
    }
  } catch (error: any) {
    console.error('修复收藏数据失败:', error);
    throw error;
  }
};

// 暴露到全局作用域，方便开发调试
declare global {
  interface Window {
    manualInitTables: typeof manualInitTables;
    quickFixMissingTables: typeof quickFixMissingTables;
    migrateFavoriteData: typeof migrateFavoriteData;
    checkFavoriteDataConsistency: typeof checkFavoriteDataConsistency;
    fixFavoriteDataConsistency: typeof fixFavoriteDataConsistency;
  }
}

if (typeof window !== 'undefined') {
  window.manualInitTables = manualInitTables;
  window.quickFixMissingTables = quickFixMissingTables;
  window.migrateFavoriteData = migrateFavoriteData;
  window.checkFavoriteDataConsistency = checkFavoriteDataConsistency;
  window.fixFavoriteDataConsistency = fixFavoriteDataConsistency;
} 