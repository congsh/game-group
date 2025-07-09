/**
 * 文件分享论坛数据类型定义
 */

// 文件分享记录
export interface FileShare {
  objectId: string;
  title: string;                    // 文件标题
  description?: string;             // 文件描述
  fileUrl: string;                  // 文件访问URL
  fileKey: string;                  // 文件存储key
  fileName: string;                 // 原始文件名
  fileSize: number;                 // 文件大小（字节）
  fileType: string;                 // 文件MIME类型
  thumbnailUrl?: string;            // 缩略图URL（图片/视频）
  category: 'image' | 'video' | 'audio' | 'document' | 'other'; // 文件分类
  tags?: string[];                  // 标签
  downloadCount: number;            // 下载次数
  viewCount: number;                // 查看次数
  likeCount: number;                // 点赞数
  commentCount: number;             // 评论数
  
  // 上传者信息
  uploaderId: string;               // 上传者ID
  uploaderName: string;             // 上传者昵称
  
  // 权限设置
  allowDownload: boolean;           // 是否允许下载
  allowComment: boolean;            // 是否允许评论
  
  // 时间信息
  createdAt: string;
  updatedAt: string;
}

// 文件评论
export interface FileComment {
  objectId: string;
  fileId: string;                   // 关联的文件ID
  content: string;                  // 评论内容
  parentId?: string;                // 父评论ID（用于回复）
  
  // 评论者信息
  commenterId: string;              // 评论者ID
  commenterName: string;            // 评论者昵称
  
  // 互动数据
  likeCount: number;                // 点赞数
  
  // 时间信息
  createdAt: string;
  updatedAt: string;
}

// 文件点赞记录
export interface FileLike {
  objectId: string;
  fileId: string;                   // 关联的文件ID
  userId: string;                   // 点赞用户ID
  type: 'file' | 'comment';         // 点赞类型
  targetId: string;                 // 目标ID（文件ID或评论ID）
  createdAt: string;
}

// 文件下载记录
export interface FileDownload {
  objectId: string;
  fileId: string;                   // 关联的文件ID
  userId: string;                   // 下载用户ID
  downloadTime: string;             // 下载时间
  userAgent?: string;               // 用户代理
  ipAddress?: string;               // IP地址
}

// 文件上传表单数据
export interface FileUploadForm {
  title: string;
  description?: string;
  tags?: string[];
  category: 'image' | 'video' | 'audio' | 'document' | 'other';
  allowDownload: boolean;
  allowComment: boolean;
}

// 文件查询参数
export interface FileSearchParams {
  category?: string;
  tags?: string[];
  keyword?: string;
  uploaderId?: string;
  sortBy?: 'latest' | 'popular' | 'downloads' | 'likes';
  page?: number;
  pageSize?: number;
}

// 文件统计信息
export interface FileStats {
  totalFiles: number;
  totalDownloads: number;
  totalViews: number;
  totalComments: number;
  categoryCounts: Record<string, number>;
  topFiles: FileShare[];
  recentFiles: FileShare[];
}

// API响应类型
export interface FileShareResponse {
  files: FileShare[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface FileCommentsResponse {
  comments: FileComment[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
} 