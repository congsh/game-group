/**
 * 勋章墙服务层
 * 提供勋章的创建、查询、点赞等功能
 */

import AV from 'leancloud-storage';
import { Badge, BadgeWallSettings, CreateBadgeRequest, BadgeWallData, BadgeLikeRequest } from '../types/badge';

class BadgeService {
  /**
   * 获取用户的勋章墙设置
   */
  async getBadgeWallSettings(userId: string): Promise<BadgeWallSettings> {
    try {
      const query = new AV.Query('BadgeWallSettings');
      query.equalTo('userId', userId);
      const settings = await query.first();

      if (settings) {
        return {
          objectId: settings.id || '',
          userId: settings.get('userId'),
          isEnabled: settings.get('isEnabled'),
          createdAt: settings.get('createdAt'),
          updatedAt: settings.get('updatedAt'),
        };
      } else {
        // 如果没有设置，创建默认设置（关闭状态）
        return {
          userId,
          isEnabled: false,
        };
      }
    } catch (error) {
      console.error('获取勋章墙设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户的勋章墙设置
   */
  async updateBadgeWallSettings(userId: string, isEnabled: boolean): Promise<BadgeWallSettings> {
    try {
      const query = new AV.Query('BadgeWallSettings');
      query.equalTo('userId', userId);
      let settings = await query.first();

      if (settings) {
        settings.set('isEnabled', isEnabled);
        await settings.save();
      } else {
        settings = new AV.Object('BadgeWallSettings');
        settings.set('userId', userId);
        settings.set('isEnabled', isEnabled);
        await settings.save();
      }

      return {
        objectId: settings.id || '',
        userId: settings.get('userId'),
        isEnabled: settings.get('isEnabled'),
        createdAt: settings.get('createdAt'),
        updatedAt: settings.get('updatedAt'),
      };
    } catch (error) {
      console.error('更新勋章墙设置失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的勋章墙数据
   */
  async getUserBadgeWall(userId: string): Promise<BadgeWallData> {
    try {
      const [settings, allBadges] = await Promise.all([
        this.getBadgeWallSettings(userId),
        this.getUserBadges(userId)
      ]);

      // 如果勋章墙未开启，返回基本数据
      if (!settings.isEnabled) {
        return {
          settings,
          displayedBadges: [],
          allBadges: [],
          totalCount: 0
        };
      }

      // 获取用户选择展示的勋章（isDisplayed为true的勋章）
      const displayedBadges = allBadges
        .filter(badge => badge.isDisplayed)
        .sort((a, b) => b.likes - a.likes); // 展示的勋章按点赞数排序

      return {
        settings,
        displayedBadges,
        allBadges,
        totalCount: allBadges.length
      };
    } catch (error) {
      console.error('获取用户勋章墙数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的所有勋章
   */
  async getUserBadges(userId: string): Promise<Badge[]> {
    try {
      const query = new AV.Query('Badge');
      query.equalTo('receiverUserId', userId);
      query.descending('createdAt');
      const badges = await query.find();

      return badges.map(badge => ({
        objectId: badge.id || '',
        title: badge.get('title'),
        description: badge.get('description'),
        icon: badge.get('icon'),
        color: badge.get('color'),
        giverUserId: badge.get('giverUserId'),
        giverUsername: badge.get('giverUsername'),
        receiverUserId: badge.get('receiverUserId'),
        receiverUsername: badge.get('receiverUsername'),
        likes: badge.get('likes') || 0,
        likedBy: badge.get('likedBy') || [],
        isDisplayed: badge.get('isDisplayed') || false,
        createdAt: badge.get('createdAt'),
        updatedAt: badge.get('updatedAt'),
      }));
    } catch (error) {
      console.error('获取用户勋章失败:', error);
      throw error;
    }
  }

  /**
   * 创建新勋章
   */
  async createBadge(request: CreateBadgeRequest, giverUserId: string): Promise<Badge> {
    try {
      // 获取给予者和接受者的用户信息
      const [giverUser, receiverUser] = await Promise.all([
        this.getUserById(giverUserId),
        this.getUserById(request.receiverUserId)
      ]);

      const badge = new AV.Object('Badge');
      badge.set('title', request.title);
      badge.set('description', request.description);
      badge.set('icon', request.icon || 'trophy');
      badge.set('color', request.color);
      badge.set('giverUserId', giverUserId);
      badge.set('giverUsername', giverUser?.username || '未知用户');
      badge.set('receiverUserId', request.receiverUserId);
      badge.set('receiverUsername', receiverUser?.username || '未知用户');
      badge.set('likes', 0);
      badge.set('likedBy', []);
      badge.set('isDisplayed', false);

      await badge.save();

      return {
        objectId: badge.id || '',
        title: badge.get('title'),
        description: badge.get('description'),
        icon: badge.get('icon'),
        color: badge.get('color'),
        giverUserId: badge.get('giverUserId'),
        giverUsername: badge.get('giverUsername'),
        receiverUserId: badge.get('receiverUserId'),
        receiverUsername: badge.get('receiverUsername'),
        likes: badge.get('likes'),
        likedBy: badge.get('likedBy'),
        isDisplayed: badge.get('isDisplayed'),
        createdAt: badge.get('createdAt'),
        updatedAt: badge.get('updatedAt'),
      };
    } catch (error) {
      console.error('创建勋章失败:', error);
      throw error;
    }
  }

  /**
   * 勋章点赞/取消点赞
   */
  async toggleBadgeLike(request: BadgeLikeRequest, userId: string): Promise<Badge> {
    try {
      const query = new AV.Query('Badge');
      const badge = await query.get(request.badgeId);

      if (!badge) {
        throw new Error('勋章不存在');
      }

      const likedBy = badge.get('likedBy') || [];
      let likes = badge.get('likes') || 0;

      if (request.action === 'like') {
        if (!likedBy.includes(userId)) {
          likedBy.push(userId);
          likes += 1;
        }
      } else {
        const index = likedBy.indexOf(userId);
        if (index > -1) {
          likedBy.splice(index, 1);
          likes -= 1;
        }
      }

      badge.set('likedBy', likedBy);
      badge.set('likes', Math.max(0, likes));
      await badge.save();

      return {
        objectId: badge.id || '',
        title: badge.get('title'),
        description: badge.get('description'),
        icon: badge.get('icon'),
        color: badge.get('color'),
        giverUserId: badge.get('giverUserId'),
        giverUsername: badge.get('giverUsername'),
        receiverUserId: badge.get('receiverUserId'),
        receiverUsername: badge.get('receiverUsername'),
        likes: badge.get('likes'),
        likedBy: badge.get('likedBy'),
        isDisplayed: badge.get('isDisplayed'),
        createdAt: badge.get('createdAt'),
        updatedAt: badge.get('updatedAt'),
      };
    } catch (error) {
      console.error('勋章点赞操作失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有开启勋章墙的用户
   */
  async getEnabledBadgeWallUsers(): Promise<Array<{ userId: string; username: string; badgeCount: number }>> {
    try {
      const query = new AV.Query('BadgeWallSettings');
      query.equalTo('isEnabled', true);
      const settings = await query.find();

      const userIds = settings.map(setting => setting.get('userId'));
      
      // 获取用户信息和勋章数量
      const results = await Promise.all(
        userIds.map(async (userId) => {
          const [user, badges] = await Promise.all([
            this.getUserById(userId),
            this.getUserBadges(userId)
          ]);

          return {
            userId,
            username: user?.username || '未知用户',
            badgeCount: badges.length
          };
        })
      );

      return results.filter(result => result.username !== '未知用户');
    } catch (error) {
      console.error('获取开启勋章墙的用户失败:', error);
      throw error;
    }
  }

  /**
   * 删除勋章
   */
  async deleteBadge(badgeId: string): Promise<void> {
    try {
      const badge = await AV.Object.createWithoutData('Badge', badgeId);
      await badge.destroy();
    } catch (error) {
      console.error('删除勋章失败:', error);
      throw error;
    }
  }

  /**
   * 切换勋章展示状态
   */
  async toggleBadgeDisplay(badgeId: string, isDisplayed: boolean): Promise<Badge> {
    try {
      const query = new AV.Query('Badge');
      const badge = await query.get(badgeId);

      if (!badge) {
        throw new Error('勋章不存在');
      }

      badge.set('isDisplayed', isDisplayed);
      await badge.save();

      return {
        objectId: badge.id || '',
        title: badge.get('title'),
        description: badge.get('description'),
        icon: badge.get('icon'),
        color: badge.get('color'),
        giverUserId: badge.get('giverUserId'),
        giverUsername: badge.get('giverUsername'),
        receiverUserId: badge.get('receiverUserId'),
        receiverUsername: badge.get('receiverUsername'),
        likes: badge.get('likes'),
        likedBy: badge.get('likedBy'),
        isDisplayed: badge.get('isDisplayed'),
        createdAt: badge.get('createdAt'),
        updatedAt: badge.get('updatedAt'),
      };
    } catch (error) {
      console.error('切换勋章展示状态失败:', error);
      throw error;
    }
  }

  /**
   * 根据用户ID获取用户信息
   */
  private async getUserById(userId: string): Promise<{ username: string } | null> {
    try {
      const query = new AV.Query('_User');
      const user = await query.get(userId);
      return {
        username: user.get('username')
      };
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }
}

export const badgeService = new BadgeService(); 