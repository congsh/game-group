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
 * 初始化 Message 数据表
 */
export const initMessageTable = async (): Promise<void> => {
  try {
    // 获取当前用户
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    console.log('开始创建Message表结构...');

    // 直接创建一个临时的 Message 记录来建立数据表结构
    const MessageClass = AV.Object.extend('Message');
    const placeholderMessage = new MessageClass();
    
    placeholderMessage.set('content', '_PLACEHOLDER_MESSAGE_');
    placeholderMessage.set('authorId', currentUser.id);
    placeholderMessage.set('authorName', currentUser.get('username'));
    placeholderMessage.set('mentionedUsers', []);
    
    const savedMessage = await placeholderMessage.save();
    console.log('Message表创建成功');
    
    // 立即删除占位符记录
    await savedMessage.destroy();
    console.log('清理占位符记录完成');
    
    console.log('Message表初始化完成');
  } catch (error: any) {
    console.error('初始化Message表失败:', error);
    throw error;
  }
};

/**
 * 初始化 MessageNotification 数据表
 */
export const initMessageNotificationTable = async (): Promise<void> => {
  try {
    // 获取当前用户
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    console.log('开始创建MessageNotification表结构...');

    // 直接创建一个临时的 MessageNotification 记录来建立数据表结构
    const MessageNotificationClass = AV.Object.extend('MessageNotification');
    const placeholderNotification = new MessageNotificationClass();
    
    placeholderNotification.set('messageId', '_PLACEHOLDER_MESSAGE_ID_');
    placeholderNotification.set('recipientId', currentUser.id);
    placeholderNotification.set('senderId', currentUser.id);
    placeholderNotification.set('senderName', currentUser.get('username'));
    placeholderNotification.set('messageContent', '_PLACEHOLDER_CONTENT_');
    placeholderNotification.set('isRead', false);
    
    const savedNotification = await placeholderNotification.save();
    console.log('MessageNotification表创建成功');
    
    // 立即删除占位符记录
    await savedNotification.destroy();
    console.log('清理占位符记录完成');
    
    console.log('MessageNotification表初始化完成');
  } catch (error: any) {
    console.error('初始化MessageNotification表失败:', error);
    throw error;
  }
};

/**
 * 初始化 BadgeWallSettings 数据表
 */
export const initBadgeWallSettingsTable = async (): Promise<void> => {
  try {
    // 获取当前用户
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    console.log('开始创建BadgeWallSettings表结构...');

    // 直接创建一个临时的 BadgeWallSettings 记录来建立数据表结构
    const BadgeWallSettingsClass = AV.Object.extend('BadgeWallSettings');
    const placeholderSettings = new BadgeWallSettingsClass();
    
    placeholderSettings.set('userId', currentUser.id);
    placeholderSettings.set('isEnabled', false);
    
    const savedSettings = await placeholderSettings.save();
    console.log('BadgeWallSettings表创建成功');
    
    // 立即删除占位符记录
    await savedSettings.destroy();
    console.log('清理占位符记录完成');
    
    console.log('BadgeWallSettings表初始化完成');
  } catch (error: any) {
    console.error('初始化BadgeWallSettings表失败:', error);
    throw error;
  }
};

/**
 * 初始化 Badge 数据表
 */
export const initBadgeTable = async (): Promise<void> => {
  try {
    // 获取当前用户
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    console.log('开始创建Badge表结构...');

    // 直接创建一个临时的 Badge 记录来建立数据表结构
    const BadgeClass = AV.Object.extend('Badge');
    const placeholderBadge = new BadgeClass();
    
    placeholderBadge.set('title', '_PLACEHOLDER_BADGE_');
    placeholderBadge.set('description', '_PLACEHOLDER_DESCRIPTION_');
    placeholderBadge.set('icon', 'trophy');
    placeholderBadge.set('color', '#1890ff');
    placeholderBadge.set('giverUserId', currentUser.id);
    placeholderBadge.set('giverUsername', currentUser.get('username'));
    placeholderBadge.set('receiverUserId', currentUser.id);
    placeholderBadge.set('receiverUsername', currentUser.get('username'));
    placeholderBadge.set('likes', 0);
    placeholderBadge.set('likedBy', []);
    placeholderBadge.set('isDisplayed', false);
    
    const savedBadge = await placeholderBadge.save();
    console.log('Badge表创建成功');
    
    // 立即删除占位符记录
    await savedBadge.destroy();
    console.log('清理占位符记录完成');
    
    console.log('Badge表初始化完成');
  } catch (error: any) {
    console.error('初始化Badge表失败:', error);
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
    await initMessageTable();
    await initMessageNotificationTable();
    await initBadgeWallSettingsTable();
    await initBadgeTable();
    
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
    
    console.log('5. 初始化 Message 表...');
    await initMessageTable();
    
    console.log('6. 初始化 MessageNotification 表...');
    await initMessageNotificationTable();
    
    console.log('7. 初始化 BadgeWallSettings 表...');
    await initBadgeWallSettingsTable();
    
    console.log('8. 初始化 Badge 表...');
    await initBadgeTable();
    
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
      },
      {
        name: 'Message表',
        fn: async () => {
          try {
            const query = new AV.Query('Message');
            query.limit(1);
            await query.find();
            console.log('✅ Message表已存在');
          } catch (error: any) {
            if (error.code === 404) {
              console.log('📝 创建Message表...');
              await initMessageTable();
              console.log('✅ Message表创建成功');
            }
          }
        }
      },
      {
        name: 'MessageNotification表',
        fn: async () => {
          try {
            const query = new AV.Query('MessageNotification');
            query.limit(1);
            await query.find();
            console.log('✅ MessageNotification表已存在');
          } catch (error: any) {
            if (error.code === 404) {
              console.log('📝 创建MessageNotification表...');
              await initMessageNotificationTable();
              console.log('✅ MessageNotification表创建成功');
            }
          }
        }
      },
      {
        name: 'BadgeWallSettings表',
        fn: async () => {
          try {
            const query = new AV.Query('BadgeWallSettings');
            query.limit(1);
            await query.find();
            console.log('✅ BadgeWallSettings表已存在');
          } catch (error: any) {
            if (error.code === 404) {
              console.log('📝 创建BadgeWallSettings表...');
              await initBadgeWallSettingsTable();
              console.log('✅ BadgeWallSettings表创建成功');
            }
          }
        }
      },
      {
        name: 'Badge表',
        fn: async () => {
          try {
            const query = new AV.Query('Badge');
            query.limit(1);
            await query.find();
            console.log('✅ Badge表已存在');
          } catch (error: any) {
            if (error.code === 404) {
              console.log('📝 创建Badge表...');
              await initBadgeTable();
              console.log('✅ Badge表创建成功');
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
    alert('数据表修复完成！请刷新页面重试。');
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

/**
 * 403错误诊断和自动修复工具
 * 用于快速解决LeanCloud权限问题
 */
export const diagnose403Error = async (): Promise<void> => {
  console.log('🔍 开始403错误诊断...');
  
  try {
    // 1. 检查LeanCloud初始化状态
    console.log('1. 检查LeanCloud配置:');
    const config = {
      appId: process.env.REACT_APP_LEANCLOUD_APP_ID || 'Kdx6AZMdQRwQXsAIa45L8wb5-gzGzoHsz',
      appKey: process.env.REACT_APP_LEANCLOUD_APP_KEY || 'T5SUIFGSeWjK1H7yrsULt79j',
      serverURL: process.env.REACT_APP_LEANCLOUD_SERVER_URL || 'https://kdx6azmd.lc-cn-n1-shared.com'
    };
    console.log('   配置信息:', {
      appId: config.appId.substring(0, 8) + '...',
      hasAppKey: !!config.appKey,
      serverURL: config.serverURL
    });

    // 2. 测试网络连接
    console.log('2. 测试网络连接:');
    try {
      const response = await fetch(`${config.serverURL}/1.1/ping`);
      console.log(`   ✅ 网络连接正常 (状态码: ${response.status})`);
    } catch (error: any) {
      console.error(`   ❌ 网络连接失败: ${error.message}`);
      throw new Error('网络连接问题：请检查网络或LeanCloud服务状态');
    }

    // 3. 检查用户登录状态
    console.log('3. 检查用户状态:');
    const currentUser = AV.User.current();
    if (currentUser) {
      console.log(`   ✅ 用户已登录: ${currentUser.get('username') || currentUser.id}`);
    } else {
      console.log('   ⚠️ 用户未登录，某些操作可能受限');
    }

    // 4. 测试基础API访问
    console.log('4. 测试API访问权限:');
    
    try {
      // 测试查询_User表（需要特殊权限）
      const userQuery = new AV.Query('_User');
      userQuery.limit(1);
      await userQuery.find();
      console.log('   ✅ _User表访问正常');
    } catch (error: any) {
      if (error.code === 403) {
        console.log('   ⚠️ _User表访问受限（这是正常的安全设置）');
      } else {
        console.error('   ❌ _User表访问异常:', error.message);
      }
    }

    try {
      // 测试Game表访问
      const gameQuery = new AV.Query('Game');
      gameQuery.limit(1);
      await gameQuery.find();
      console.log('   ✅ Game表访问正常');
    } catch (error: any) {
      if (error.code === 404) {
        console.log('   ⚠️ Game表不存在（将尝试创建）');
        try {
          await quickInitTable();
          console.log('   ✅ Game表已创建');
        } catch (initError: any) {
          console.error('   ❌ Game表创建失败:', initError.message);
        }
      } else if (error.code === 403) {
        console.error('   ❌ Game表访问被拒绝 - 这需要在LeanCloud控制台配置权限');
        throw new Error('Game表访问权限不足，请检查LeanCloud控制台的数据表权限设置');
      } else {
        console.error('   ❌ Game表访问异常:', error.message);
      }
    }

    // 5. 检查域名白名单
    console.log('5. 检查域名配置:');
    const currentDomain = window.location.origin;
    console.log(`   当前域名: ${currentDomain}`);
    
    if (currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1')) {
      console.log('   ⚠️ 开发环境域名，请确保在LeanCloud控制台添加到安全域名白名单:');
      console.log('      - http://localhost:3000');
      console.log('      - http://127.0.0.1:3000');
    }

    console.log('✅ 403错误诊断完成！');
    
  } catch (error: any) {
    console.error('❌ 诊断过程中出现错误:', error.message);
    console.log('\n📋 建议的解决步骤:');
    console.log('1. 检查LeanCloud控制台的安全域名设置');
    console.log('2. 确认数据表权限配置正确');
    console.log('3. 验证AppId和AppKey是否正确');
    console.log('4. 检查网络连接和防火墙设置');
  }
};

/**
 * 快速修复403权限问题
 */
export const quickFix403 = async (): Promise<void> => {
  console.log('🔧 开始快速修复403权限问题...');
  
  try {
    // 1. 重新初始化LeanCloud
    console.log('1. 重新初始化LeanCloud连接...');
    const { initLeanCloud } = await import('../services/leancloud');
    initLeanCloud();
    console.log('   ✅ LeanCloud重新初始化完成');

    // 2. 检查并创建缺失的数据表
    console.log('2. 检查数据表结构...');
    await quickFixMissingTables();
    console.log('   ✅ 数据表检查完成');

    // 3. 清除可能存在的缓存问题
    console.log('3. 清除缓存数据...');
    const { clearAllCaches } = await import('../services/dataCache');
    clearAllCaches();
    console.log('   ✅ 缓存已清除');

    // 4. 测试修复结果
    console.log('4. 测试修复结果...');
    try {
      const testQuery = new AV.Query('Game');
      testQuery.limit(1);
      await testQuery.find();
      console.log('   ✅ 数据表访问测试通过');
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error('权限问题依然存在，需要手动配置LeanCloud控制台权限');
      } else if (error.code === 404) {
        console.log('   ⚠️ 数据表仍不存在，但这不影响基本功能');
      }
    }

    console.log('✅ 快速修复完成！');
    console.log('💡 建议刷新页面以确保所有更改生效');
    
  } catch (error: any) {
    console.error('❌ 快速修复失败:', error.message);
    console.log('\n📋 请尝试手动解决:');
    console.log('1. 访问LeanCloud控制台检查权限设置');
    console.log('2. 确认域名白名单配置');
    console.log('3. 联系技术支持获取帮助');
    throw error;
  }
};

// 在开发环境中暴露调试函数到 window 对象
if (process.env.NODE_ENV === 'development') {
  (window as any).manualInitTables = manualInitTables;
  (window as any).quickFixMissingTables = quickFixMissingTables;
  (window as any).migrateFavoriteData = migrateFavoriteData;
  (window as any).checkFavoriteDataConsistency = checkFavoriteDataConsistency;
  (window as any).fixFavoriteDataConsistency = fixFavoriteDataConsistency;
  (window as any).diagnose403Error = diagnose403Error;
  (window as any).quickFix403 = quickFix403;
  (window as any).initBadgeWallSettingsTable = initBadgeWallSettingsTable;
  (window as any).initBadgeTable = initBadgeTable;
  
  // TypeScript 接口声明
  interface Window {
    manualInitTables: typeof manualInitTables;
    quickFixMissingTables: typeof quickFixMissingTables;
    migrateFavoriteData: typeof migrateFavoriteData;
    checkFavoriteDataConsistency: typeof checkFavoriteDataConsistency;
    fixFavoriteDataConsistency: typeof fixFavoriteDataConsistency;
    diagnose403Error: typeof diagnose403Error;
    quickFix403: typeof quickFix403;
    initBadgeWallSettingsTable: typeof initBadgeWallSettingsTable;
    initBadgeTable: typeof initBadgeTable;
  }
} 