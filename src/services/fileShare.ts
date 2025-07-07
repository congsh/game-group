/**
 * 文件分享论坛服务层
 * 提供文件分享、评论、点赞、下载等功能
 */

import AV from 'leancloud-storage';
import { useAuthStore } from '../store/auth';
import { uploadService } from './upload.service';
import type {
  FileShare,
  FileComment,
  FileLike,
  FileDownload,
  FileUploadForm,
  FileSearchParams,
  FileStats,
  FileShareResponse,
  FileCommentsResponse
} from '../types/fileShare';

class FileShareService {
  private FileShare = AV.Object.extend('FileShare');
  private FileComment = AV.Object.extend('FileComment');
  private FileLike = AV.Object.extend('FileLike');
  private FileDownload = AV.Object.extend('FileDownload');

  /**
   * 上传并分享文件
   */
  async uploadAndShareFile(
    file: File,
    formData: FileUploadForm,
    onProgress?: (percent: number) => void
  ): Promise<FileShare> {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 1. 上传文件到存储服务
      const uploadResult = await uploadService.upload(file, {
        onProgress,
        metadata: {
          type: 'file-share',
          userId: user.objectId,
          category: formData.category
        }
      });

      // 2. 创建文件分享记录
      const fileShare = new this.FileShare();
      
      // 基本信息
      fileShare.set('title', formData.title);
      fileShare.set('description', formData.description || '');
      fileShare.set('fileUrl', uploadResult.url);
      fileShare.set('fileKey', uploadResult.key);
      fileShare.set('fileName', uploadResult.name);
      fileShare.set('fileSize', uploadResult.size);
      fileShare.set('fileType', uploadResult.type);
      fileShare.set('thumbnailUrl', uploadResult.thumbnailUrl);
      fileShare.set('category', formData.category);
      fileShare.set('tags', formData.tags || []);
      
      // 统计信息
      fileShare.set('downloadCount', 0);
      fileShare.set('viewCount', 0);
      fileShare.set('likeCount', 0);
      fileShare.set('commentCount', 0);
      
      // 上传者信息
      fileShare.set('uploaderId', user.objectId);
      fileShare.set('uploaderName', user.username);
      
      // 权限设置
      fileShare.set('isPublic', formData.isPublic);
      fileShare.set('allowDownload', formData.allowDownload);
      fileShare.set('allowComment', formData.allowComment);

      // 设置ACL权限
      // 设置ACL权限
      const acl = new AV.ACL();
      acl.setPublicReadAccess(formData.isPublic);
      // 修复类型错误：使用用户ID而不是用户对象
      acl.setWriteAccess(user.objectId, true);
      fileShare.setACL(acl);

      const savedFile = await fileShare.save();
      return this.formatFileShare(savedFile);
    } catch (error) {
      console.error('文件分享失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件分享列表
   */
  async getFileShares(params: FileSearchParams = {}): Promise<FileShareResponse> {
    try {
      let query = new AV.Query(this.FileShare);
      
      // 只查询公开的文件
      query.equalTo('isPublic', true);
      
      // 分类筛选
      if (params.category) {
        query.equalTo('category', params.category);
      }
      
      // 关键词搜索
      if (params.keyword) {
        const titleQuery = new AV.Query(this.FileShare);
        titleQuery.contains('title', params.keyword);
        
        const descQuery = new AV.Query(this.FileShare);
        descQuery.contains('description', params.keyword);
        
        const fileNameQuery = new AV.Query(this.FileShare);
        fileNameQuery.contains('fileName', params.keyword);
        
        // 创建组合查询
        const combinedQuery = AV.Query.or(titleQuery, descQuery, fileNameQuery);
        combinedQuery.equalTo('isPublic', true);
        
        // 使用组合查询替换原始查询
        query = combinedQuery;
      }
      
      // 标签筛选
      if (params.tags && params.tags.length > 0) {
        query.containsAll('tags', params.tags);
      }
      
      // 上传者筛选
      if (params.uploaderId) {
        query.equalTo('uploaderId', params.uploaderId);
      }
      
      // 排序
      switch (params.sortBy) {
        case 'popular':
          query.descending(['likeCount', 'viewCount']);
          break;
        case 'downloads':
          query.descending('downloadCount');
          break;
        case 'likes':
          query.descending('likeCount');
          break;
        default:
          query.descending('createdAt');
      }
      
      // 分页
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      query.skip((page - 1) * pageSize);
      query.limit(pageSize);
      
      const [results, total] = await Promise.all([
        query.find(),
        query.count()
      ]);
      
      return {
        files: results.map(file => this.formatFileShare(file)),
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total
      };
    } catch (error) {
      console.error('获取文件列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件详情
   */
  async getFileDetail(fileId: string): Promise<FileShare> {
    try {
      const query = new AV.Query(this.FileShare);
      const file = await query.get(fileId);
      
      if (!file) {
        throw new Error('文件不存在');
      }
      
      // 增加查看次数
      file.increment('viewCount', 1);
      await file.save();
      
      return this.formatFileShare(file);
    } catch (error) {
      console.error('获取文件详情失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件分享
   */
  /**
   * 删除文件分享
   * 同时删除LeanCloud记录和云存储文件
   */
  async deleteFileShare(fileId: string): Promise<void> {
    console.log('🗑️ 开始删除文件分享:', fileId);
    
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        console.error('❌ 删除失败: 用户未登录');
        throw new Error('用户未登录');
      }
      console.log('✅ 用户验证通过:', user.objectId);

      // 1. 获取文件记录
      console.log('📋 正在获取文件记录...');
      const query = new AV.Query(this.FileShare);
      const file = await query.get(fileId);
      
      if (!file) {
        console.error('❌ 文件记录不存在:', fileId);
        throw new Error('文件不存在');
      }
      
      const fileKey = file.get('fileKey');
      const fileName = file.get('fileName');
      const uploaderId = file.get('uploaderId');
      
      console.log('📄 文件信息:', {
        fileKey,
        fileName,
        uploaderId,
        currentUserId: user.objectId
      });
      
      // 2. 检查权限
      if (uploaderId !== user.objectId) {
        console.error('❌ 权限验证失败: 当前用户无权删除此文件');
        throw new Error('无权限删除此文件');
      }
      console.log('✅ 权限验证通过');
      
      // 3. 删除云存储文件
      if (fileKey) {
        console.log('☁️ 正在删除云存储文件:', fileKey);
        try {
          const cloudDeleted = await uploadService.deleteFile(fileKey);
          if (cloudDeleted) {
            console.log('✅ 云存储文件删除成功:', fileKey);
          } else {
            console.warn('⚠️ 云存储文件删除失败或文件不存在:', fileKey);
          }
        } catch (cloudError) {
          console.error('❌ 云存储文件删除失败:', cloudError);
          // 不抛出错误，继续删除数据库记录
          console.log('⚠️ 继续删除数据库记录...');
        }
      } else {
        console.warn('⚠️ 文件记录中没有fileKey，跳过云存储删除');
      }
      
      // 4. 删除相关的评论记录
      console.log('💬 正在删除相关评论...');
      try {
        const commentQuery = new AV.Query(this.FileComment);
        commentQuery.equalTo('fileId', fileId);
        const comments = await commentQuery.find();
        
        if (comments.length > 0) {
          await AV.Object.destroyAll(comments);
          console.log(`✅ 删除了 ${comments.length} 条评论`);
        } else {
          console.log('ℹ️ 没有相关评论需要删除');
        }
      } catch (commentError) {
        console.error('❌ 删除评论失败:', commentError);
        // 不抛出错误，继续删除其他记录
      }
      
      // 5. 删除相关的点赞记录
      console.log('👍 正在删除相关点赞...');
      try {
        const likeQuery = new AV.Query(this.FileLike);
        likeQuery.equalTo('fileId', fileId);
        const likes = await likeQuery.find();
        
        if (likes.length > 0) {
          await AV.Object.destroyAll(likes);
          console.log(`✅ 删除了 ${likes.length} 条点赞记录`);
        } else {
          console.log('ℹ️ 没有相关点赞需要删除');
        }
      } catch (likeError) {
        console.error('❌ 删除点赞记录失败:', likeError);
        // 不抛出错误，继续删除其他记录
      }
      
      // 6. 删除相关的下载记录
      console.log('📥 正在删除相关下载记录...');
      try {
        const downloadQuery = new AV.Query(this.FileDownload);
        downloadQuery.equalTo('fileId', fileId);
        const downloads = await downloadQuery.find();
        
        if (downloads.length > 0) {
          await AV.Object.destroyAll(downloads);
          console.log(`✅ 删除了 ${downloads.length} 条下载记录`);
        } else {
          console.log('ℹ️ 没有相关下载记录需要删除');
        }
      } catch (downloadError) {
        console.error('❌ 删除下载记录失败:', downloadError);
        // 不抛出错误，继续删除主记录
      }
      
      // 7. 最后删除文件主记录
      console.log('📋 正在删除文件主记录...');
      await file.destroy();
      console.log('✅ 文件主记录删除成功');
      
      console.log('🎉 文件删除完成:', {
        fileId,
        fileName,
        fileKey
      });
      
    } catch (error) {
      console.error('❌ 删除文件失败:', {
        fileId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * 下载文件
   */
  async downloadFile(fileId: string): Promise<string> {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('用户未登录');
      }

      const query = new AV.Query(this.FileShare);
      const file = await query.get(fileId);
      
      if (!file) {
        throw new Error('文件不存在');
      }
      
      if (!file.get('allowDownload')) {
        throw new Error('该文件不允许下载');
      }
      
      // 记录下载
      const download = new this.FileDownload();
      download.set('fileId', fileId);
      download.set('userId', user.objectId);
      download.set('downloadTime', new Date().toISOString());
      download.set('userAgent', navigator.userAgent);
      await download.save();
      
      // 增加下载次数
      file.increment('downloadCount', 1);
      await file.save();
      
      return file.get('fileUrl');
    } catch (error) {
      console.error('下载文件失败:', error);
      throw error;
    }
  }

  /**
   * 点赞/取消点赞文件
   */
  async toggleFileLike(fileId: string): Promise<boolean> {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 检查是否已点赞
      const likeQuery = new AV.Query(this.FileLike);
      likeQuery.equalTo('fileId', fileId);
      likeQuery.equalTo('userId', user.objectId);
      likeQuery.equalTo('type', 'file');
      
      const existingLike = await likeQuery.first();
      
      if (existingLike) {
        // 取消点赞
        await existingLike.destroy();
        
        // 减少点赞数
        const fileQuery = new AV.Query(this.FileShare);
        const file = await fileQuery.get(fileId);
        file.increment('likeCount', -1);
        await file.save();
        
        return false;
      } else {
        // 添加点赞
        const like = new this.FileLike();
        like.set('fileId', fileId);
        like.set('userId', user.objectId);
        like.set('type', 'file');
        like.set('targetId', fileId);
        await like.save();
        
        // 增加点赞数
        const fileQuery = new AV.Query(this.FileShare);
        const file = await fileQuery.get(fileId);
        file.increment('likeCount', 1);
        await file.save();
        
        return true;
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      throw error;
    }
  }

  /**
   * 添加评论
   */
  async addComment(fileId: string, content: string, parentId?: string): Promise<FileComment> {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 检查文件是否允许评论
      const fileQuery = new AV.Query(this.FileShare);
      const file = await fileQuery.get(fileId);
      
      if (!file.get('allowComment')) {
        throw new Error('该文件不允许评论');
      }

      // 创建评论
      const comment = new this.FileComment();
      comment.set('fileId', fileId);
      comment.set('content', content);
      comment.set('commenterId', user.objectId);
      comment.set('commenterName', user.username);
      comment.set('likeCount', 0);
      
      if (parentId) {
        comment.set('parentId', parentId);
      }

      const savedComment = await comment.save();
      
      // 增加评论数
      file.increment('commentCount', 1);
      await file.save();
      
      return this.formatFileComment(savedComment);
    } catch (error) {
      console.error('添加评论失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件评论
   */
  async getFileComments(fileId: string, page = 1, pageSize = 20): Promise<FileCommentsResponse> {
    try {
      const query = new AV.Query(this.FileComment);
      query.equalTo('fileId', fileId);
      query.descending('createdAt');
      query.skip((page - 1) * pageSize);
      query.limit(pageSize);
      
      const [results, total] = await Promise.all([
        query.find(),
        query.count()
      ]);
      
      return {
        comments: results.map(comment => this.formatFileComment(comment)),
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total
      };
    } catch (error) {
      console.error('获取评论失败:', error);
      throw error;
    }
  }

  /**
   * 删除评论
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('用户未登录');
      }

      const query = new AV.Query(this.FileComment);
      const comment = await query.get(commentId);
      
      if (!comment) {
        throw new Error('评论不存在');
      }
      
      // 检查权限
      if (comment.get('commenterId') !== user.objectId) {
        throw new Error('无权限删除此评论');
      }
      
      await comment.destroy();
      
      // 减少评论数
      const fileQuery = new AV.Query(this.FileShare);
      const file = await fileQuery.get(comment.get('fileId'));
      file.increment('commentCount', -1);
      await file.save();
    } catch (error) {
      console.error('删除评论失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件统计信息
   */
  async getFileStats(): Promise<FileStats> {
    try {
      const query = new AV.Query(this.FileShare);
      query.equalTo('isPublic', true);
      
      // 总文件数
      const totalFiles = await query.count();
      
      // 分类统计
      const categories = ['image', 'video', 'audio', 'document', 'other'];
      const categoryCounts: Record<string, number> = {};
      
      for (const category of categories) {
        const categoryQuery = new AV.Query(this.FileShare);
        categoryQuery.equalTo('isPublic', true);
        categoryQuery.equalTo('category', category);
        categoryCounts[category] = await categoryQuery.count();
      }
      
      // 热门文件
      const popularQuery = new AV.Query(this.FileShare);
      popularQuery.equalTo('isPublic', true);
      popularQuery.descending(['likeCount', 'viewCount']);
      popularQuery.limit(10);
      const topFiles = await popularQuery.find();
      
      // 最新文件
      const recentQuery = new AV.Query(this.FileShare);
      recentQuery.equalTo('isPublic', true);
      recentQuery.descending('createdAt');
      recentQuery.limit(10);
      const recentFiles = await recentQuery.find();
      
      return {
        totalFiles,
        totalDownloads: 0, // TODO: 从下载记录统计
        totalViews: 0,     // TODO: 从文件记录统计
        totalComments: 0,  // TODO: 从评论记录统计
        categoryCounts,
        topFiles: topFiles.map(file => this.formatFileShare(file)),
        recentFiles: recentFiles.map(file => this.formatFileShare(file))
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 格式化文件分享对象
   */
  private formatFileShare(avObject: any): FileShare {
    return {
      objectId: avObject.id,
      title: avObject.get('title'),
      description: avObject.get('description'),
      fileUrl: avObject.get('fileUrl'),
      fileKey: avObject.get('fileKey'),
      fileName: avObject.get('fileName'),
      fileSize: avObject.get('fileSize'),
      fileType: avObject.get('fileType'),
      thumbnailUrl: avObject.get('thumbnailUrl'),
      category: avObject.get('category'),
      tags: avObject.get('tags') || [],
      downloadCount: avObject.get('downloadCount') || 0,
      viewCount: avObject.get('viewCount') || 0,
      likeCount: avObject.get('likeCount') || 0,
      commentCount: avObject.get('commentCount') || 0,
      uploaderId: avObject.get('uploaderId'),
      uploaderName: avObject.get('uploaderName'),
      isPublic: avObject.get('isPublic'),
      allowDownload: avObject.get('allowDownload'),
      allowComment: avObject.get('allowComment'),
      createdAt: avObject.createdAt?.toISOString(),
      updatedAt: avObject.updatedAt?.toISOString()
    };
  }

  /**
   * 格式化文件评论对象
   */
  private formatFileComment(avObject: any): FileComment {
    return {
      objectId: avObject.id,
      fileId: avObject.get('fileId'),
      content: avObject.get('content'),
      parentId: avObject.get('parentId'),
      commenterId: avObject.get('commenterId'),
      commenterName: avObject.get('commenterName'),
      likeCount: avObject.get('likeCount') || 0,
      createdAt: avObject.createdAt?.toISOString(),
      updatedAt: avObject.updatedAt?.toISOString()
    };
  }
}

// 导出单例
export const fileShareService = new FileShareService();