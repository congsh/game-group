/**
 * 周末组队服务层
 * 提供组队相关的数据操作接口
 */

import AV from 'leancloud-storage';
import { WeekendTeam, TeamForm, TeamFilters, TeamDetails } from '../types/team';
import { Game } from '../types/game';
import { initWeekendTeamTable } from '../utils/initData';

/**
 * 创建周末组队
 * @param teamForm 组队表单数据
 * @param leaderId 队长用户ID
 * @returns 创建的组队记录
 */
export const createWeekendTeam = async (teamForm: TeamForm, leaderId: string): Promise<WeekendTeam> => {
  try {
    // 获取游戏信息以确定最大成员数
    const gameQuery = new AV.Query('Game');
    const game = await gameQuery.get(teamForm.gameId);
    const maxMembers = game.get('maxPlayers') || 4;

    const team = new AV.Object('WeekendTeam');
    team.set('game', teamForm.gameId);
    team.set('eventDate', teamForm.eventDate);
    team.set('startTime', teamForm.startTime);
    team.set('endTime', teamForm.endTime);
    team.set('leader', leaderId);
    team.set('members', [leaderId]); // 队长自动加入成员列表
    team.set('maxMembers', maxMembers);
    team.set('status', 'open');

    const result = await team.save();

    return {
      objectId: result.id || '',
      game: result.get('game'),
      eventDate: result.get('eventDate'),
      startTime: result.get('startTime'),
      endTime: result.get('endTime'),
      leader: result.get('leader'),
      members: result.get('members') || [],
      maxMembers: result.get('maxMembers'),
      status: result.get('status'),
      createdAt: result.get('createdAt'),
      updatedAt: result.get('updatedAt'),
    };
  } catch (error) {
    console.error('创建组队失败:', error);
    throw error;
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

    // 排序
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

    // 执行查询
    const [teams, total] = await Promise.all([
      query.find(),
      query.count()
    ]);

    // 获取游戏信息和用户信息
    const gameIds = Array.from(new Set(teams.map(team => team.get('game'))));
    const userIds = Array.from(new Set(teams.flatMap(team => [team.get('leader'), ...team.get('members')])));

    const [games, users] = await Promise.all([
      getGamesByIds(gameIds),
      getUsersByIds(userIds)
    ]);

    // 构建映射
    const gameMap = new Map(games.map(game => [game.objectId, game]));
    const userMap = new Map(users.map(user => [user.objectId, user.nickname]));

    // 转换为 TeamDetails
    const teamDetails: TeamDetails[] = teams.map(team => {
      const gameId = team.get('game');
      const leaderId = team.get('leader');
      const memberIds = team.get('members') || [];
      const game = gameMap.get(gameId);

      return {
        objectId: team.id || '',
        game: gameId,
        eventDate: team.get('eventDate'),
        startTime: team.get('startTime'),
        endTime: team.get('endTime'),
        leader: leaderId,
        members: memberIds,
        maxMembers: team.get('maxMembers'),
        status: team.get('status'),
        createdAt: team.get('createdAt'),
        updatedAt: team.get('updatedAt'),
        gameName: game?.name || '未知游戏',
        leaderName: userMap.get(leaderId) || '未知用户',
        memberNames: memberIds.map((id: string) => userMap.get(id) || '未知用户'),
        isCurrentUserMember: false, // 这个会在组件中计算
        isCurrentUserLeader: false, // 这个会在组件中计算
      };
    });

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

    return {
      objectId: team.id || '',
      game: gameId,
      eventDate: team.get('eventDate'),
      startTime: team.get('startTime'),
      endTime: team.get('endTime'),
      leader: leaderId,
      members: memberIds,
      maxMembers: team.get('maxMembers'),
      status: team.get('status'),
      createdAt: team.get('createdAt'),
      updatedAt: team.get('updatedAt'),
      gameName: game?.name || '未知游戏',
      leaderName: userMap.get(leaderId) || '未知用户',
      memberNames: memberIds.map((id: string) => userMap.get(id) || '未知用户'),
      isCurrentUserMember: false,
      isCurrentUserLeader: false,
    };
  } catch (error) {
    console.error('获取组队详情失败:', error);
    throw error;
  }
};

/**
 * 加入组队
 * @param teamId 组队ID
 * @param userId 用户ID
 * @returns 更新后的组队记录
 */
export const joinWeekendTeam = async (teamId: string, userId: string): Promise<WeekendTeam> => {
  try {
    const team = AV.Object.createWithoutData('WeekendTeam', teamId);
    
    // 原子操作：添加成员
    team.addUnique('members', userId);
    
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
 * @returns 更新后的组队记录
 */
export const leaveWeekendTeam = async (teamId: string, userId: string): Promise<WeekendTeam> => {
  try {
    const team = AV.Object.createWithoutData('WeekendTeam', teamId);
    
    // 原子操作：移除成员
    team.remove('members', userId);
    
    const result = await team.save();

    // 检查是否需要更新状态
    const members = result.get('members') || [];
    const maxMembers = result.get('maxMembers');
    const status = result.get('status');
    
    if (status === 'full' && members.length < maxMembers) {
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
    voteQuery.limit(10);
    
    const recentVotes = await voteQuery.find();
    
    // 分析用户偏好的游戏
    const preferredGameIds = new Set<string>();
    recentVotes.forEach(vote => {
      const selectedGames = vote.get('selectedGames') || [];
      selectedGames.forEach((gameId: string) => preferredGameIds.add(gameId));
    });

    // 如果没有偏好记录，返回最近创建的开放组队
    if (preferredGameIds.size === 0) {
      const { teams } = await getWeekendTeams(
        { status: 'open', sortBy: 'createdAt', sortOrder: 'desc' },
        1,
        5
      );
      return teams;
    }

    // 获取基于偏好的推荐组队
    const teamQuery = new AV.Query('WeekendTeam');
    teamQuery.containedIn('game', Array.from(preferredGameIds));
    teamQuery.equalTo('status', 'open');
    teamQuery.notEqualTo('leader', userId); // 排除自己创建的队伍
    teamQuery.descending('createdAt');
    teamQuery.limit(5);

    const teams = await teamQuery.find();

    // 转换为 TeamDetails（简化版，因为是推荐列表）
    return Promise.all(
      teams.map(async team => {
        const gameId = team.get('game');
        const game = await getGamesByIds([gameId]).then(games => games[0]);
        
        return {
          objectId: team.id || '',
          game: gameId,
          eventDate: team.get('eventDate'),
          startTime: team.get('startTime'),
          endTime: team.get('endTime'),
          leader: team.get('leader'),
          members: team.get('members') || [],
          maxMembers: team.get('maxMembers'),
          status: team.get('status'),
          createdAt: team.get('createdAt'),
          updatedAt: team.get('updatedAt'),
          gameName: game?.name || '未知游戏',
          leaderName: '推荐队伍',
          memberNames: [],
          isCurrentUserMember: false,
          isCurrentUserLeader: false,
        } as TeamDetails;
      })
    );
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
  } catch (error) {
    console.error('获取游戏信息失败:', error);
    return [];
  }
};

/**
 * 辅助函数：根据ID列表获取用户信息
 */
const getUsersByIds = async (userIds: string[]): Promise<Array<{ objectId: string; nickname: string }>> => {
  if (userIds.length === 0) return [];
  
  try {
    const query = new AV.Query('_User');
    query.containedIn('objectId', userIds);
    query.limit(1000);
    const users = await query.find();
    
    return users.map(user => ({
      objectId: user.id || '',
      nickname: user.get('nickname') || '未知用户'
    }));
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return [];
  }
}; 