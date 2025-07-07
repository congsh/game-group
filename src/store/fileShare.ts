/**
 * 文件分享论坛状态管理
 * 使用 Zustand 管理文件分享、评论、点赞等状态
 */

import { create } from 'zustand';
import type {
  FileShare,
  FileComment,
  FileSearchParams,
  FileStats,
  FileShareResponse,
  FileCommentsResponse
} from '../types/fileShare';
import { fileShareService } from '../services/fileShare';

interface FileShareState {
  // 文件列表
  files: FileShare[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  currentPage: number;
  
  // 搜索参数
  searchParams: FileSearchParams;
  
  // 当前文件详情
  currentFile: FileShare | null;
  currentFileComments: FileComment[];
  commentsLoading: boolean;
  commentsTotal: number;
  commentsHasMore: boolean;
  commentsPage: number;
  
  // 统计信息
  stats: FileStats | null;
  statsLoading: boolean;
  
  // 用户点赞状态
  userLikes: Set<string>;
  
  // Actions
  setSearchParams: (params: FileSearchParams) => void;
  loadFiles: (reset?: boolean) => Promise<void>;
  loadMoreFiles: () => Promise<void>;
  refreshFiles: () => Promise<void>;
  
  setCurrentFile: (file: FileShare | null) => void;
  loadFileDetail: (fileId: string) => Promise<void>;
  
  loadComments: (fileId: string, reset?: boolean) => Promise<void>;
  loadMoreComments: (fileId: string) => Promise<void>;
  addComment: (fileId: string, content: string, parentId?: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  
  toggleLike: (fileId: string) => Promise<void>;
  downloadFile: (fileId: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  
  loadStats: () => Promise<void>;
  
  clearError: () => void;
  reset: () => void;
}

export const useFileShareStore = create<FileShareState>((set, get) => ({
  // 初始状态
  files: [],
  loading: false,
  error: null,
  total: 0,
  hasMore: false,
  currentPage: 1,
  
  searchParams: {
    sortBy: 'latest',
    pageSize: 20
  },
  
  currentFile: null,
  currentFileComments: [],
  commentsLoading: false,
  commentsTotal: 0,
  commentsHasMore: false,
  commentsPage: 1,
  
  stats: null,
  statsLoading: false,
  
  userLikes: new Set(),

  // 设置搜索参数
  setSearchParams: (params) => {
    set(state => ({
      searchParams: { ...state.searchParams, ...params },
      currentPage: 1
    }));
  },

  // 加载文件列表
  loadFiles: async (reset = false) => {
    const state = get();
    if (state.loading) return;

    try {
      set({ loading: true, error: null });
      
      const params = {
        ...state.searchParams,
        page: reset ? 1 : state.currentPage
      };
      
      const response = await fileShareService.getFileShares(params);
      
      set(state => ({
        files: reset ? response.files : [...state.files, ...response.files],
        total: response.total,
        hasMore: response.hasMore,
        currentPage: response.page,
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // 加载更多文件
  loadMoreFiles: async () => {
    const state = get();
    if (!state.hasMore || state.loading) return;

    set(state => ({ currentPage: state.currentPage + 1 }));
    await get().loadFiles(false);
  },

  // 刷新文件列表
  refreshFiles: async () => {
    set({ currentPage: 1 });
    await get().loadFiles(true);
  },

  // 设置当前文件
  setCurrentFile: (file) => {
    set({ currentFile: file });
  },

  // 加载文件详情
  loadFileDetail: async (fileId) => {
    try {
      set({ loading: true, error: null });
      
      const file = await fileShareService.getFileDetail(fileId);
      
      set({ 
        currentFile: file,
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // 加载评论
  loadComments: async (fileId, reset = false) => {
    const state = get();
    if (state.commentsLoading) return;

    try {
      set({ commentsLoading: true, error: null });
      
      const page = reset ? 1 : state.commentsPage;
      const response = await fileShareService.getFileComments(fileId, page);
      
      set(state => ({
        currentFileComments: reset ? response.comments : [...state.currentFileComments, ...response.comments],
        commentsTotal: response.total,
        commentsHasMore: response.hasMore,
        commentsPage: response.page,
        commentsLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, commentsLoading: false });
    }
  },

  // 加载更多评论
  loadMoreComments: async (fileId) => {
    const state = get();
    if (!state.commentsHasMore || state.commentsLoading) return;

    set(state => ({ commentsPage: state.commentsPage + 1 }));
    await get().loadComments(fileId, false);
  },

  // 添加评论
  addComment: async (fileId, content, parentId) => {
    try {
      const comment = await fileShareService.addComment(fileId, content, parentId);
      
      set(state => ({
        currentFileComments: [comment, ...state.currentFileComments],
        commentsTotal: state.commentsTotal + 1,
        // 更新文件的评论数
        currentFile: state.currentFile ? {
          ...state.currentFile,
          commentCount: state.currentFile.commentCount + 1
        } : null,
        // 更新文件列表中的评论数
        files: state.files.map(file => 
          file.objectId === fileId 
            ? { ...file, commentCount: file.commentCount + 1 }
            : file
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // 删除评论
  deleteComment: async (commentId) => {
    try {
      await fileShareService.deleteComment(commentId);
      
      set(state => {
        const deletedComment = state.currentFileComments.find(c => c.objectId === commentId);
        if (!deletedComment) return state;

        return {
          currentFileComments: state.currentFileComments.filter(c => c.objectId !== commentId),
          commentsTotal: state.commentsTotal - 1,
          // 更新文件的评论数
          currentFile: state.currentFile ? {
            ...state.currentFile,
            commentCount: state.currentFile.commentCount - 1
          } : null,
          // 更新文件列表中的评论数
          files: state.files.map(file => 
            file.objectId === deletedComment.fileId 
              ? { ...file, commentCount: file.commentCount - 1 }
              : file
          )
        };
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // 切换点赞
  toggleLike: async (fileId) => {
    try {
      const isLiked = await fileShareService.toggleFileLike(fileId);
      
      set(state => ({
        userLikes: isLiked 
          ? new Set([...Array.from(state.userLikes), fileId])
          : new Set(Array.from(state.userLikes).filter(id => id !== fileId)),
        // 更新文件的点赞数
        currentFile: state.currentFile && state.currentFile.objectId === fileId ? {
          ...state.currentFile,
          likeCount: state.currentFile.likeCount + (isLiked ? 1 : -1)
        } : state.currentFile,
        // 更新文件列表中的点赞数
        files: state.files.map(file => 
          file.objectId === fileId 
            ? { ...file, likeCount: file.likeCount + (isLiked ? 1 : -1) }
            : file
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // 下载文件
  downloadFile: async (fileId) => {
    try {
      const fileUrl = await fileShareService.downloadFile(fileId);
      
      // 更新下载次数
      set(state => ({
        currentFile: state.currentFile && state.currentFile.objectId === fileId ? {
          ...state.currentFile,
          downloadCount: state.currentFile.downloadCount + 1
        } : state.currentFile,
        files: state.files.map(file => 
          file.objectId === fileId 
            ? { ...file, downloadCount: file.downloadCount + 1 }
            : file
        )
      }));
      
      // 触发浏览器下载
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // 删除文件
  deleteFile: async (fileId) => {
    try {
      await fileShareService.deleteFileShare(fileId);
      
      set(state => ({
        files: state.files.filter(file => file.objectId !== fileId),
        total: state.total - 1,
        currentFile: state.currentFile?.objectId === fileId ? null : state.currentFile
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // 加载统计信息
  loadStats: async () => {
    const state = get();
    if (state.statsLoading) return;

    try {
      set({ statsLoading: true });
      
      const stats = await fileShareService.getFileStats();
      
      set({ 
        stats,
        statsLoading: false
      });
    } catch (error: any) {
      set({ error: error.message, statsLoading: false });
    }
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  },

  // 重置状态
  reset: () => {
    set({
      files: [],
      loading: false,
      error: null,
      total: 0,
      hasMore: false,
      currentPage: 1,
      currentFile: null,
      currentFileComments: [],
      commentsLoading: false,
      commentsTotal: 0,
      commentsHasMore: false,
      commentsPage: 1,
      userLikes: new Set()
    });
  }
})); 