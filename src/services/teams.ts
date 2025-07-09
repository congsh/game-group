/**
 * 周末组队服务层
 * 提供组队相关的数据操作接口
 */

import AV from 'leancloud-storage';
import { WeekendTeam, TeamForm, TeamFilters, TeamDetails, JoinTeamForm, MemberTimeInfo } from '../types/team';
import { Game } from '../types/game';
import { initWeekendTeamTable, initSampleGames } from '../utils/initData';

/**
 * 创建周末组队
 * @param teamForm 组队表单数据
 * @param leaderId 队长用户ID
 * @returns 创建的组队记录
 */
export const createWeekendTeam = async (teamForm: TeamForm, leaderId: string): Promise<WeekendTeam> => {
  try {
    console.log('开始创建组队，游戏ID:', teamForm.gameId);
    
    // 验证游戏ID格式
    if (!teamForm.gameId || typeof teamForm.gameId !== 'string') {
      throw new Error('无效的游戏ID');
    }

    // 获取游戏信息以确定最大成员数
    let game: any;
    let maxMembers = 4; // 默认值
    
    try {
      const gameQuery = new AV.Query('Game');
      game = await gameQuery.get(teamForm.gameId);
      maxMembers = game.get('maxPlayers') || 4;
      console.log('获取到游戏信息:', {
        gameId: teamForm.gameId,
        gameName: game.get('name'),
        maxPlayers: maxMembers
      });
    } catch (gameError: any) {
      console.error('获取游戏信息失败:', gameError);
      
      if (gameError.code === 404 || gameError.message?.includes('Object not found')) {
        // 游戏不存在的具体错误处理
        throw new Error(`选择的游戏不存在，可能已被删除。请刷新页面重新选择游戏。`);
      } else if (gameError.code === 403) {
        // 权限问题
        throw new Error('没有权限访问该游戏，请检查游戏权限设置。');
      } else {
        // 其他错误
        throw new Error(`获取游戏信息失败: ${gameError.message || '未知错误'}`);
      }
    }

    // 获取当前用户昵称
    const currentUser = AV.User.current();
    if (!currentUser) {
      throw new Error('用户未登录，无法创建组队');
    }
    
    const leaderName = currentUser.get('username') || currentUser.get('nickname') || `用户${leaderId.slice(-6)}`;
    console.log('创建组队的队长信息:', { leaderId, leaderName });

    // 验证表单数据
    if (!teamForm.eventDate || !teamForm.startTime || !teamForm.endTime) {
      throw new Error('缺少必要的组队信息（日期或时间）');
    }

    // 创建队长的时间信息
    const leaderTimeInfo: MemberTimeInfo = {
      userId: leaderId,
      username: leaderName,
      startTime: teamForm.startTime,
      endTime: teamForm.endTime,
      joinedAt: new Date()
    };

    // 创建组队记录
    const team = new AV.Object('WeekendTeam');
    team.set('game', teamForm.gameId);
    team.set('eventDate', teamForm.eventDate);
    team.set('startTime', teamForm.startTime);
    team.set('endTime', teamForm.endTime);
    team.set('leader', leaderId);
    team.set('leaderName', leaderName); // 保存队长昵称
    team.set('members', [leaderId]); // 队长自动加入成员列表
    team.set('memberNames', [leaderName]); // 保存成员昵称列表
    team.set('memberTimeInfo', [leaderTimeInfo]); // 保存成员时间信息
    team.set('maxMembers', maxMembers);
    team.set('status', 'open');

    console.log('准备保存组队记录:', {
      gameId: teamForm.gameId,
      eventDate: teamForm.eventDate,
      startTime: teamForm.startTime,
      endTime: teamForm.endTime,
      leaderId,
      leaderName,
      maxMembers
    });

    const result = await team.save();
    console.log('组队创建成功:', result.id);

    return {
      objectId: result.id || '',
      game: result.get('game'),
      eventDate: result.get('eventDate'),
      startTime: result.get('startTime'),
      endTime: result.get('endTime'),
      leader: result.get('leader'),
      members: result.get('members') || [],
      memberTimeInfo: result.get('memberTimeInfo') || [leaderTimeInfo],
      maxMembers: result.get('maxMembers'),
      status: result.get('status'),
      createdAt: result.get('createdAt'),
      updatedAt: result.get('updatedAt'),
    };
  } catch (error: any) {
    console.error('创建组队失败:', error);
    
    // 如果是我们自定义的错误，直接抛出
    if (error.message && (
      error.message.includes('游戏不存在') || 
      error.message.includes('用户未登录') ||
      error.message.includes('无效的游戏ID') ||
      error.message.includes('缺少必要的组队信息') ||
      error.message.includes('没有权限访问')
    )) {
      throw error;
    }
    
    // 如果是WeekendTeam表不存在的错误，尝试初始化表
    if (error.code === 404 && error.message?.includes('WeekendTeam')) {
      console.log('WeekendTeam表不存在，尝试自动创建...');
      try {
        await initWeekendTeamTable();
        console.log('WeekendTeam表创建成功，重新尝试创建组队...');
        // 重新调用创建组队函数
        return await createWeekendTeam(teamForm, leaderId);
      } catch (initError) {
        console.error('自动创建WeekendTeam表失败:', initError);
        throw new Error('数据表初始化失败，请联系管理员');
      }
    }
    
    // 其他未知错误
    throw new Error(`创建组队失败: ${error.message || '未知错误，请重试'}`);
  }
};

/**
 * 获取周末组队列表
 * @param filters 筛选条件
 * @param page 页码
 * @param pageSize 每页数量
 * @returns 组队列表和总数
 */
export const getWeekendTeams = async (
  filters: TeamFilters = {},
  page: number = 1,
  pageSize: number = 20
): Promise<{ teams: TeamDetails[]; total: number }> => {
  try {
    const query = new AV.Query('WeekendTeam');

    // 应用筛选条件
    if (filters.gameId) {
      query.equalTo('game', filters.gameId);
    }
    if (filters.eventDate) {
      query.equalTo('eventDate', filters.eventDate);
    }
    if (filters.status) {
      query.equalTo('status', filters.status);
    }
    
    // 日期范围筛选
    if (filters.startDate && filters.endDate) {
      // 如果有起始和结束日期，使用范围筛选
      query.greaterThanOrEqualTo('eventDate', filters.startDate);
      query.lessThanOrEqualTo('eventDate', filters.endDate);
    } else if (filters.startDate) {
      // 只有起始日期，筛选大于等于起始日期的记录
      query.greaterThanOrEqualTo('eventDate', filters.startDate);
    } else if (filters.endDate) {
      // 只有结束日期，筛选小于等于结束日期的记录
      query.lessThanOrEqualTo('eventDate', filters.endDate);
    }

    // 检查是否是自定义排序（需要在前端处理）
    const needCustomSort = filters.sortBy === 'memberCount';
    
    if (!needCustomSort) {
      // 数据库直接支持的排序
      const sortBy = filters.sortBy || 'eventDate';
      const sortOrder = filters.sortOrder || 'asc';
      if (sortOrder === 'desc') {
        query.descending(sortBy);
      } else {
        query.ascending(sortBy);
      }
      
      // 分页
      query.skip((page - 1) * pageSize);
      query.limit(pageSize);
    } else {
      // 自定义排序需要获取更多数据
      query.limit(1000);
    }

    // 执行查询
    const [teams, total] = await Promise.all([
      query.find(),
      query.count()
    ]);

    // 获取游戏信息和用户信息
    const gameIds = Array.from(new Set(teams.map((team: any) => team.get('game'))));
    const userIds = Array.from(new Set(teams.flatMap((team: any) => [team.get('leader'), ...team.get('members')])));

    const [games, users] = await Promise.all([
      getGamesByIds(gameIds),
      getUsersByIds(userIds)
    ]);

    // 构建映射
    const gameMap = new Map(games.map(game => [game.objectId, game]));
    const userMap = new Map(users.map(user => [user.objectId, user.nickname]));

    // 转换为 TeamDetails
    let teamDetails: TeamDetails[] = teams.map((team: any) => {
      const gameId = team.get('game');
      const leaderId = team.get('leader');
      const memberIds = team.get('members') || [];
      const game = gameMap.get(gameId);

      // 优先使用保存的昵称，如果没有则使用查询结果或占位符
      const savedLeaderName = team.get('leaderName');
      const savedMemberNames = team.get('memberNames') || [];
      
      const leaderName = savedLeaderName || userMap.get(leaderId) || `用户${leaderId.slice(-6)}`;
      const memberNames = memberIds.map((id: string, index: number) => {
        return savedMemberNames[index] || userMap.get(id) || `用户${id.slice(-6)}`;
      });

      // 获取成员时间信息
      const memberTimeInfo = team.get('memberTimeInfo') || [];

      return {
        objectId: team.id || '',
        game: gameId,
        eventDate: team.get('eventDate'),
        startTime: team.get('startTime'),
        endTime: team.get('endTime'),
        leader: leaderId,
        members: memberIds,
        memberTimeInfo: memberTimeInfo,
        maxMembers: team.get('maxMembers'),
        status: team.get('status'),
        createdAt: team.get('createdAt'),
        updatedAt: team.get('updatedAt'),
        gameName: game?.name || '未知游戏',
        leaderName: leaderName,
        memberNames: memberNames,
        isCurrentUserMember: false, // 这个会在组件中计算
        isCurrentUserLeader: false, // 这个会在组件中计算
      };
    });

    // 如果需要自定义排序，进行排序和分页
    if (needCustomSort) {
      // 按成员数量排序
      if (filters.sortBy === 'memberCount') {
        teamDetails.sort((a, b) => {
          const order = filters.sortOrder === 'asc' ? 1 : -1;
          return (a.members.length - b.members.length) * order;
        });
      }
      
      // 手动分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      teamDetails = teamDetails.slice(startIndex, endIndex);
    }

    return { teams: teamDetails, total };
  } catch (error: any) {
    console.error('获取组队列表失败:', error);
    // 如果是404错误（表不存在），尝试初始化表并返回空结果
    if (error.code === 404 || (error instanceof Error && error.message.includes('Class or object doesn\'t exists'))) {
      console.log('WeekendTeam表不存在，尝试自动创建...');
      try {
        await initWeekendTeamTable();
        console.log('WeekendTeam表创建成功，返回空结果');
        return { teams: [], total: 0 };
      } catch (initError) {
        console.error('自动创建WeekendTeam表失败:', initError);
        return { teams: [], total: 0 };
      }
    }
    throw error;
  }
};

/**
 * 根据ID获取组队详情
 * @param teamId 组队ID
 * @returns 组队详情
 */
export const getWeekendTeamById = async (teamId: string): Promise<TeamDetails> => {
  try {
    const query = new AV.Query('WeekendTeam');
    const team = await query.get(teamId);

    const gameId = team.get('game');
    const leaderId = team.get('leader');
    const memberIds = team.get('members') || [];

    // 获取游戏和用户信息
    const [game, users] = await Promise.all([
      getGamesByIds([gameId]).then(games => games[0]),
      getUsersByIds([leaderId, ...memberIds])
    ]);

    const userMap = new Map(users.map(user => [user.objectId, user.nickname]));

    // 优先使用保存的昵称
    const savedLeaderName = team.get('leaderName');
    const savedMemberNames = team.get('memberNames') || [];
    
    const leaderName = savedLeaderName || userMap.get(leaderId) || `用户${leaderId.slice(-6)}`;
    const memberNames = memberIds.map((id: string, index: number) => {
      return savedMemberNames[index] || userMap.get(id) || `用户${id.slice(-6)}`;
    });

    return {
      objectId: team.id || '',
      game: gameId,
      eventDate: team.get('eventDate'),
      startTime: team.get('startTime'),
      endTime: team.get('endTime'),
      leader: leaderId,
      members: memberIds,
      memberTimeInfo: team.get('memberTimeInfo') || [],
      maxMembers: team.get('maxMembers'),
      status: team.get('status'),
      createdAt: team.get('createdAt'),
      updatedAt: team.get('updatedAt'),
      gameName: game?.name || '未知游戏',
      leaderName: leaderName,
      memberNames: memberNames,
      isCurrentUserMember: false,
      isCurrentUserLeader: false,
    };
  } catch (error) {
    console.error('获取组队详情失败:', error);
    throw error;
  }
};

/**
 * 加入组队（带个性化时间）
 * @param joinForm 加入表单数据
 * @param userId 用户ID
 * @returns 更新后的组队记录
 */
export const joinWeekendTeamWithTime = async (joinForm: JoinTeamForm, userId: string): Promise<WeekendTeam> => {
  try {
    // 获取当前用户昵称
    const currentUser = AV.User.current();
    const userName = currentUser?.get('username') || `用户${userId.slice(-6)}`;
    
    // 创建用户的时间信息
    const userTimeInfo: MemberTimeInfo = {
      userId: userId,
      username: userName,
      startTime: joinForm.startTime,
      endTime: joinForm.endTime,
      joinedAt: new Date()
    };

    const team = AV.Object.createWithoutData('WeekendTeam', joinForm.teamId);
    
    // 原子操作：添加成员和时间信息
    team.addUnique('members', userId);
    team.addUnique('memberNames', userName);
    team.addUnique('memberTimeInfo', userTimeInfo);
    
    const result = await team.save();

    // 检查是否需要更新状态为满员
    const members = result.get('members') || [];
    const maxMembers = result.get('maxMembers');
    
    if (members.length >= maxMembers) {
      team.set('status', 'full');
      await team.save();
    }

    return {
      objectId: result.id || '',
      game: result.get('game'),
      eventDate: result.get('eventDate'),
      startTime: result.get('startTime'),
      endTime: result.get('endTime'),
      leader: result.get('leader'),
      members: result.get('members') || [],
      memberTimeInfo: result.get('memberTimeInfo') || [],
      maxMembers: result.get('maxMembers'),
      status: result.get('status'),
      createdAt: result.get('createdAt'),
      updatedAt: result.get('updatedAt'),
    };
  } catch (error) {
    console.error('加入组队失败:', error);
    throw error;
  }
};

/**
 * 加入组队（兼容旧版本，使用队长时间）
 * @param teamId 组队ID
 * @param userId 用户ID
 * @returns 更新后的组队记录
 */
export const joinWeekendTeam = async (teamId: string, userId: string): Promise<WeekendTeam> => {
  try {
    // 获取当前用户昵称
    const currentUser = AV.User.current();
    const userName = currentUser?.get('username') || `用户${userId.slice(-6)}`;
    
    const team = AV.Object.createWithoutData('WeekendTeam', teamId);
    
    // 原子操作：添加成员
    team.addUnique('members', userId);
    team.addUnique('memberNames', userName);
    
    const result = await team.save();

    // 检查是否需要更新状态为满员
    const members = result.get('members') || [];
    const maxMembers = result.get('maxMembers');
    
    if (members.length >= maxMembers) {
      team.set('status', 'full');
      await team.save();
    }

    return {
      objectId: result.id || '',
      game: result.get('game'),
      eventDate: result.get('eventDate'),
      startTime: result.get('startTime'),
      endTime: result.get('endTime'),
      leader: result.get('leader'),
      members: result.get('members') || [],
      memberTimeInfo: result.get('memberTimeInfo') || [],
      maxMembers: result.get('maxMembers'),
      status: result.get('status'),
      createdAt: result.get('createdAt'),
      updatedAt: result.get('updatedAt'),
    };
  } catch (error) {
    console.error('加入组队失败:', error);
    throw error;
  }
};

/**
 * 离开组队
 * @param teamId 组队ID
 * @param userId 用户ID
 * @returns 更新后的组队记录，如果是队长离开则返回null（表示队伍已删除）
 */
export const leaveWeekendTeam = async (teamId: string, userId: string): Promise<WeekendTeam | null> => {
  try {
    // 先获取组队信息
    const query = new AV.Query('WeekendTeam');
    const teamInfo = await query.get(teamId);
    const leader = teamInfo.get('leader');
    const members = teamInfo.get('members') || [];
    const memberNames = teamInfo.get('memberNames') || [];
    
    // 检查是否是队长离开
    if (leader === userId) {
      // 队长离开，直接删除整个队伍
      await teamInfo.destroy();
      return null; // 返回null表示队伍已删除
    }
    
    // 普通成员离开的逻辑
    // 找到用户在成员列表中的索引
    const userIndex = members.indexOf(userId);
    let userNameToRemove = '';
    if (userIndex !== -1 && userIndex < memberNames.length) {
      userNameToRemove = memberNames[userIndex];
    } else {
      // 如果找不到对应昵称，使用当前用户的昵称或占位符
      const currentUser = AV.User.current();
      userNameToRemove = currentUser?.get('username') || `用户${userId.slice(-6)}`;
    }
    
    const team = AV.Object.createWithoutData('WeekendTeam', teamId);
    
    // 原子操作：移除成员和对应昵称
    team.remove('members', userId);
    if (userNameToRemove) {
      team.remove('memberNames', userNameToRemove);
    }
    
    const result = await team.save();

    // 检查是否需要更新状态
    const updatedMembers = result.get('members') || [];
    const maxMembers = result.get('maxMembers');
    const status = result.get('status');
    
    if (status === 'full' && updatedMembers.length < maxMembers) {
      team.set('status', 'open');
      await team.save();
    }

    return {
      objectId: result.id || '',
      game: result.get('game'),
      eventDate: result.get('eventDate'),
      startTime: result.get('startTime'),
      endTime: result.get('endTime'),
      leader: result.get('leader'),
      members: result.get('members') || [],
      memberTimeInfo: result.get('memberTimeInfo') || [],
      maxMembers: result.get('maxMembers'),
      status: result.get('status'),
      createdAt: result.get('createdAt'),
      updatedAt: result.get('updatedAt'),
    };
  } catch (error) {
    console.error('离开组队失败:', error);
    throw error;
  }
};

/**
 * 解散组队（仅队长可操作）
 * @param teamId 组队ID
 * @param userId 操作用户ID
 */
export const dissolveWeekendTeam = async (teamId: string, userId: string): Promise<void> => {
  try {
    // 验证操作权限
    const query = new AV.Query('WeekendTeam');
    const team = await query.get(teamId);
    
    if (team.get('leader') !== userId) {
      throw new Error('只有队长可以解散队伍');
    }

    await team.destroy();
  } catch (error) {
    console.error('解散组队失败:', error);
    throw error;
  }
};

/**
 * 获取推荐组队（基于用户偏好的智能匹配）
 * @param userId 用户ID
 * @returns 推荐的组队列表
 */
export const getRecommendedTeams = async (userId: string): Promise<TeamDetails[]> => {
  try {
    // 获取用户最近的投票记录，了解偏好
    const voteQuery = new AV.Query('DailyVote');
    voteQuery.equalTo('user', userId);
    voteQuery.descending('createdAt');
    voteQuery.limit(15); // 增加获取数量以获得更多倾向度数据
    
    const recentVotes = await voteQuery.find();
    
    // 分析用户偏好的游戏和倾向度
    const gamePreferences = new Map<string, { count: number; totalTendency: number; averageTendency: number }>();
    
    recentVotes.forEach((vote) => {
      const selectedGames = vote.get('selectedGames') || [];
      const gamePreferencesData = vote.get('gamePreferences') || [];
      
      // 处理有倾向度数据的游戏
      gamePreferencesData.forEach((pref: { gameId: string; tendency: number }) => {
        if (!gamePreferences.has(pref.gameId)) {
          gamePreferences.set(pref.gameId, { count: 0, totalTendency: 0, averageTendency: 0 });
        }
        const current = gamePreferences.get(pref.gameId)!;
        current.count += 1;
        current.totalTendency += pref.tendency;
        current.averageTendency = current.totalTendency / current.count;
      });
      
      // 处理只有选择但没有倾向度的游戏（向后兼容）
      selectedGames.forEach((gameId: string) => {
        if (!gamePreferences.has(gameId)) {
          gamePreferences.set(gameId, { count: 1, totalTendency: 3, averageTendency: 3 }); // 默认倾向度3
        } else if (!gamePreferencesData.find((pref: any) => pref.gameId === gameId)) {
          // 如果该游戏在选择中但没有倾向度数据，补充默认值
          const current = gamePreferences.get(gameId)!;
          current.count += 1;
          current.totalTendency += 3; // 默认倾向度3
          current.averageTendency = current.totalTendency / current.count;
        }
      });
    });

    // 如果没有偏好记录，返回最近创建的开放组队
    if (gamePreferences.size === 0) {
      const { teams } = await getWeekendTeams(
        { status: 'open', sortBy: 'createdAt', sortOrder: 'desc' },
        1,
        5
      );
      return teams;
    }

    // 根据倾向度对游戏进行排序，优先推荐高倾向度的游戏
    const sortedPreferences = Array.from(gamePreferences.entries())
      .sort(([, a], [, b]) => {
        // 优先考虑平均倾向度，然后考虑频次
        const scoreA = a.averageTendency * 0.7 + (a.count / 15) * 0.3 * 5; // 归一化频次到5分制
        const scoreB = b.averageTendency * 0.7 + (b.count / 15) * 0.3 * 5;
        return scoreB - scoreA;
      })
      .slice(0, 8); // 取前8个最偏好的游戏

    const preferredGameIds = sortedPreferences.map(([gameId]) => gameId);

    // 获取基于偏好的推荐组队
    const teamQuery = new AV.Query('WeekendTeam');
    teamQuery.containedIn('game', preferredGameIds);
    teamQuery.equalTo('status', 'open');
    teamQuery.notEqualTo('leader', userId); // 排除自己创建的队伍
    teamQuery.descending('createdAt');
    teamQuery.limit(20); // 增加查询数量以便后续排序

    const teams = await teamQuery.find();

    // 为每个推荐的组队计算推荐分数
    const teamsWithScores = await Promise.all(
      teams.map(async (team) => {
        const gameId = team.get('game');
        const preference = gamePreferences.get(gameId);
        const game = await getGamesByIds([gameId]).then(games => games[0]);
        
        // 计算推荐分数
        let score = 0;
        if (preference) {
          // 倾向度权重（40%）
          score += preference.averageTendency * 0.4;
          
          // 频次权重（20%）
          score += (preference.count / 15) * 5 * 0.2;
        }
        
        // 时间新鲜度权重（20%）- 越新的组队分数越高
        const hoursSinceCreated = (Date.now() - team.get('createdAt').getTime()) / (1000 * 60 * 60);
        const freshnesScore = Math.max(0, 5 - hoursSinceCreated / 24); // 24小时内为满分
        score += freshnesScore * 0.2;
        
        // 队伍空缺度权重（20%）- 空缺越多分数越高（更容易加入）
        const members = team.get('members') || [];
        const maxMembers = team.get('maxMembers') || 4;
        const vacancyRate = (maxMembers - members.length) / maxMembers;
        score += vacancyRate * 5 * 0.2;
        
        return {
          team,
          game,
          score,
          preference
        };
      })
    );

    // 按推荐分数排序，取前5个
    const topRecommendations = teamsWithScores
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5);

    // 转换为 TeamDetails
    return topRecommendations.map(({ team, game, preference }: any) => {
      return {
        objectId: team.id || '',
        game: team.get('game'),
        eventDate: team.get('eventDate'),
        startTime: team.get('startTime'),
        endTime: team.get('endTime'),
        leader: team.get('leader'),
        members: team.get('members') || [],
        memberTimeInfo: team.get('memberTimeInfo') || [],
        maxMembers: team.get('maxMembers'),
        status: team.get('status'),
        createdAt: team.get('createdAt'),
        updatedAt: team.get('updatedAt'),
        gameName: game?.name || '未知游戏',
        leaderName: `推荐队伍${preference ? ` (倾向度: ${preference.averageTendency.toFixed(1)}分)` : ''}`,
        memberNames: [],
        isCurrentUserMember: false,
        isCurrentUserLeader: false,
      } as TeamDetails;
    });
  } catch (error) {
    console.error('获取推荐组队失败:', error);
    // 如果推荐失败，返回空数组
    return [];
  }
};

/**
 * 辅助函数：根据ID列表获取游戏信息
 */
const getGamesByIds = async (gameIds: string[]): Promise<Game[]> => {
  if (gameIds.length === 0) return [];
  
  try {
    const query = new AV.Query('Game');
    query.containedIn('objectId', gameIds);
    query.limit(1000);
    const games = await query.find();
    
    return games.map(game => ({
      objectId: game.id || '',
      name: game.get('name'),
      minPlayers: game.get('minPlayers'),
      maxPlayers: game.get('maxPlayers'),
      platform: game.get('platform'),
      description: game.get('description'),
      type: game.get('type'),
      likeCount: game.get('likeCount'),
      createdBy: game.get('createdBy'),
      createdAt: game.get('createdAt'),
      updatedAt: game.get('updatedAt'),
    }));
  } catch (error: any) {
    console.error('获取游戏信息失败:', error);
    
    // 如果是404错误（表不存在），尝试初始化游戏表
    if (error.code === 404 || (error instanceof Error && error.message.includes('Class or object doesn\'t exists'))) {
      console.warn('Game表不存在，尝试自动创建...');
      try {
        await initSampleGames();
        console.log('Game表创建成功，重新查询...');
        const query = new AV.Query('Game');
        query.containedIn('objectId', gameIds);
        query.limit(1000);
        const games = await query.find();
        
        return games.map(game => ({
          objectId: game.id || '',
          name: game.get('name'),
          minPlayers: game.get('minPlayers'),
          maxPlayers: game.get('maxPlayers'),
          platform: game.get('platform'),
          description: game.get('description'),
          type: game.get('type'),
          likeCount: game.get('likeCount'),
          createdBy: game.get('createdBy'),
          createdAt: game.get('createdAt'),
          updatedAt: game.get('updatedAt'),
        }));
      } catch (initError) {
        console.warn('Game表创建失败，返回空数组:', initError);
        return [];
      }
    }
    
    return [];
  }
};

/**
 * 辅助函数：根据ID列表获取用户信息
 * 由于LeanCloud _User表的权限限制，直接返回用户昵称占位符
 */
const getUsersByIds = async (userIds: string[]): Promise<Array<{ objectId: string; nickname: string }>> => {
  if (userIds.length === 0) return [];
  
  // 由于LeanCloud的_User表权限限制（403 Forbidden），
  // 我们无法直接查询其他用户信息
  // 返回基于用户ID的友好昵称，避免显示"未知用户"
  return userIds.map(userId => {
    // 生成基于用户ID的友好昵称
    const shortId = userId.slice(-6); // 取用户ID的后6位
    return {
      objectId: userId,
      nickname: `用户${shortId}`
    };
  });
}; 