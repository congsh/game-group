/**
 * 统一文件上传服务
 * 支持多种存储后端：七牛云、阿里云OSS、腾讯云COS等
 * 优先使用各云服务SDK的原生方法
 */
import * as qiniu from 'qiniu-js';
import CryptoJS from 'crypto-js';

// 上传配置类型
interface UploadConfig {
  provider: 'qiniu' | 'aliyun' | 'tencent' | 'local';
  endpoint: string;
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  domain?: string;
  isPrivate?: boolean;
}

// 上传结果类型
interface UploadResult {
  url: string;
  key: string;
  size: number;
  name: string;
  type: string;
  thumbnailUrl?: string;
}

// 上传进度回调
type ProgressCallback = (percent: number) => void;

class UploadService {
  private config: UploadConfig;

  constructor() {
    // 从环境变量读取配置
    this.config = {
      provider: (process.env.REACT_APP_STORAGE_PROVIDER as any) || 'qiniu',
      endpoint: process.env.REACT_APP_STORAGE_ENDPOINT || '/api/upload',
      bucket: process.env.REACT_APP_QINIU_BUCKET || process.env.REACT_APP_STORAGE_BUCKET,
      region: process.env.REACT_APP_QINIU_REGION || process.env.REACT_APP_STORAGE_REGION,
      domain: process.env.REACT_APP_QINIU_DOMAIN || process.env.REACT_APP_STORAGE_DOMAIN,
      isPrivate: process.env.REACT_APP_QINIU_BUCKET_IS_PRIVATE === 'true'
    };
  }

  /**
   * 检查存储空间是否为私有
   */
  isPrivateBucket(): boolean {
    return this.config.isPrivate || false;
  }

  /**
   * 上传文件
   */
  async upload(
    file: File,
    options?: {
      onProgress?: ProgressCallback;
      metadata?: Record<string, any>;
    }
  ): Promise<UploadResult> {
    try {
      switch (this.config.provider) {
        case 'qiniu':
          return await this.uploadToQiniu(file, options);
        case 'aliyun':
          return await this.uploadToAliyun(file, options);
        case 'tencent':
          return await this.uploadToTencent(file, options);
        default:
          return await this.uploadToLocal(file, options);
      }
    } catch (error: any) {
      // 如果是七牛云配置错误，在开发环境下降级到模拟上传
      if (this.config.provider === 'qiniu' && 
          process.env.NODE_ENV === 'development' && 
          error.message.includes('七牛云配置')) {
        console.warn('七牛云配置不完整，使用模拟上传模式');
        return this.mockUpload(file, options);
      }
      throw error;
    }
  }

  /**
   * 上传到七牛云
   * 使用qiniu-js SDK的标准方法，简化实现
   */
  private async uploadToQiniu(
    file: File,
    options?: {
      onProgress?: ProgressCallback;
      metadata?: Record<string, any>;
    }
  ): Promise<UploadResult> {
    const token = await this.getQiniuToken();
    const key = `uploads/${Date.now()}_${file.name}`;
    
    const putExtra: any = {
      fname: file.name,
      params: options?.metadata || {},
      mimeType: file.type || this.getMimeType(file.name),
    };

    const config: any = {
      useCdnDomain: true,
      region: (qiniu.region as any)[this.config.region || 'z0'],
    };

    return new Promise((resolve, reject) => {
      const observable = qiniu.upload(file, key, token, putExtra, config);
      
      const subscription = observable.subscribe({
        next: (res) => {
          if (options?.onProgress) {
            options.onProgress(Math.round(res.total.percent));
          }
        },
        error: (err) => {
          reject(new Error(`上传失败: ${err.message}`));
        },
        complete: async (res) => {
          const fileUrl = `${this.config.domain}/${res.key}`;
          const fileType = file.type || this.getMimeType(file.name);
          
          let thumbnailUrl: string | undefined;
          if (fileType.startsWith('image/')) {
            // 只附加图片处理参数，不进行签名。
            // 这个永久性的、不含签名的URL将被存入数据库。
            thumbnailUrl = `${fileUrl}?imageView2/2/w/200/h/200`;
          }

          resolve({
            url: fileUrl,
            key: res.key,
            size: file.size,
            name: file.name,
            type: fileType,
            thumbnailUrl,
          });
        },
      });

      // 如果需要，可以取消上传
      // subscription.unsubscribe(); 
    });
  }

  /**
   * 根据文件扩展名获取MIME类型
   */
  private getMimeType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      // 图片
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      // 视频
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'webm': 'video/webm',
      // 音频
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'flac': 'audio/flac',
      // 文档
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * 上传到阿里云OSS
   */
  private async uploadToAliyun(
    file: File,
    options?: {
      onProgress?: ProgressCallback;
      metadata?: Record<string, any>;
    }
  ): Promise<UploadResult> {
    // 类似七牛云的实现
    // 1. 获取STS临时凭证
    // 2. 使用OSS SDK上传
    throw new Error('阿里云OSS上传暂未实现');
  }

  /**
   * 上传到腾讯云COS
   */
  private async uploadToTencent(
    file: File,
    options?: {
      onProgress?: ProgressCallback;
      metadata?: Record<string, any>;
    }
  ): Promise<UploadResult> {
    // 类似七牛云的实现
    throw new Error('腾讯云COS上传暂未实现');
  }

  /**
   * 上传到本地服务器
   */
  private async uploadToLocal(
    file: File,
    options?: {
      onProgress?: ProgressCallback;
      metadata?: Record<string, any>;
    }
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    // 添加元数据
    if (options?.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 监听上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && options?.onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          options.onProgress(percent);
        }
      });

      // 监听完成
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else {
          reject(new Error('上传失败'));
        }
      });

      // 监听错误
      xhr.addEventListener('error', () => {
        reject(new Error('网络错误'));
      });

      // 发送请求
      xhr.open('POST', this.config.endpoint);
      
      // 添加认证
      const token = localStorage.getItem('authToken');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.send(formData);
    });
  }

  /**
   * 模拟上传（开发环境使用）
   */
  private async mockUpload(
    file: File,
    options?: {
      onProgress?: ProgressCallback;
      metadata?: Record<string, any>;
    }
  ): Promise<UploadResult> {
    return new Promise((resolve) => {
      // 模拟上传进度
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        if (options?.onProgress) {
          options.onProgress(progress);
        }
        if (progress >= 100) {
          clearInterval(interval);
          
          // 生成模拟的文件信息
          const key = `mock/${Date.now()}-${file.name}`;
          const mockUrl = `data:${file.type};base64,${btoa('mock-file-content')}`;
          
          resolve({
            url: mockUrl,
            key,
            name: file.name,
            size: file.size,
            type: file.type,
            thumbnailUrl: file.type.startsWith('image/') ? mockUrl : undefined
          });
        }
      }, 200);
    });
  }

  /**
   * 获取七牛云上传凭证
   * 优先从服务器获取，开发环境可使用本地生成
   */
  private async getQiniuToken(): Promise<string> {
    // 开发环境下直接使用本地生成
    if (process.env.NODE_ENV === 'development') {
      try {
        return this.generateQiniuToken();
      } catch (error) {
        console.error('七牛云配置错误:', error);
        throw new Error('七牛云配置不完整。请在 .env.local 文件中配置 REACT_APP_QINIU_AK, REACT_APP_QINIU_SK, REACT_APP_QINIU_BUCKET 等环境变量，或者将 REACT_APP_STORAGE_PROVIDER 设置为 "local" 使用本地存储。');
      }
    }
    
    // 生产环境从服务器获取
    try {
      const response = await fetch('/api/qiniu/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
    } catch (error) {
      console.error('从服务器获取凭证失败:', error);
    }
    
    throw new Error('无法获取上传凭证，请检查服务器配置');
  }

  /**
   * 生成七牛云上传凭证（仅用于开发环境）
   * 使用标准的上传策略
   */
  private generateQiniuToken(): string {
    const accessKey = process.env.REACT_APP_QINIU_AK;
    const secretKey = process.env.REACT_APP_QINIU_SK;
    const bucket = this.config.bucket;
    
    if (!accessKey || !secretKey || !bucket) {
      console.error('七牛云配置检查:', {
        accessKey: accessKey ? '已配置' : '未配置',
        secretKey: secretKey ? '已配置' : '未配置',
        bucket: bucket || '未配置'
      });
      throw new Error('七牛云配置信息不完整，请检查环境变量 REACT_APP_QINIU_AK, REACT_APP_QINIU_SK, REACT_APP_QINIU_BUCKET');
    }
    
    // 构造上传策略
    const putPolicy = {
      scope: bucket,
      deadline: Math.floor(Date.now() / 1000) + 3600 // 1小时后过期
    };
    
    // 1. 将上传策略JSON序列化
    const putPolicyStr = JSON.stringify(putPolicy);

    // 2. 对JSON序列化后的上传策略进行URL安全的Base64编码
    const encodedPutPolicy = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(putPolicyStr))
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // 3. 使用SecretKey对编码后的上传策略进行HMAC-SHA1加密，并对加密结果做URL安全的Base64编码
    const sign = CryptoJS.HmacSHA1(encodedPutPolicy, secretKey);
    const encodedSign = sign.toString(CryptoJS.enc.Base64)
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
      
    // 4. 拼接上传凭证
    return `${accessKey}:${encodedSign}:${encodedPutPolicy}`;
  }
  

  

  


  /**
   * 获取文件URL（带处理参数）
   * 简化实现，支持基本的图片处理参数
   */
  async getFileUrl(
    key: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
      download?: boolean;
      filename?: string;
      private?: boolean;
    }
  ): Promise<string> {
    let url = `${this.config.domain}/${key}`;
    const params: string[] = [];

    switch (this.config.provider) {
      case 'qiniu':
        if (options?.width || options?.height) {
          const imageParams = ['imageView2/2'];
          if (options.width) imageParams.push(`w/${options.width}`);
          if (options.height) imageParams.push(`h/${options.height}`);
          if (options.quality) imageParams.push(`q/${options.quality}`);
          if (options.format) imageParams.push(`format/${options.format}`);
          params.push(imageParams.join('/'));
        }
        if (options?.download) {
          const filename = options.filename || key;
          params.push(`attname=${encodeURIComponent(filename)}`);
        }
        break;

      case 'aliyun':
        if (options?.width || options?.height) {
          const processParams = [];
          if (options.width) processParams.push(`w_${options.width}`);
          if (options.height) processParams.push(`h_${options.height}`);
          if (options.quality) processParams.push(`q_${options.quality}`);
          if (options.format) processParams.push(`format,${options.format}`);
          params.push(`x-oss-process=image/resize,${processParams.join(',')}`);
        }
        break;

      case 'tencent':
        if (options?.width || options?.height) {
          params.push(`imageMogr2/thumbnail/${options.width || ''}x${options.height || ''}`);
          if (options.quality) params.push(`quality/${options.quality}`);
          if (options.format) params.push(`format/${options.format}`);
        }
        break;
    }

    if (params.length > 0) {
      const separator = this.config.provider === 'qiniu' ? '?' : '&';
      url += separator + params.join(this.config.provider === 'qiniu' ? '&' : '&');
    }

    console.log('签名URL检查:', {
        provider: this.config.provider,
        isPrivateBucket: this.config.isPrivate,
        options: options,
        shouldSign: this.config.provider === 'qiniu' && (this.config.isPrivate || !!options?.private)
    });

    // 如果是七牛云的私有空间或文件被指定为私有，则生成带签名的URL
    if (this.config.provider === 'qiniu' && (this.config.isPrivate || options?.private)) {
      const accessKey = process.env.REACT_APP_QINIU_AK;
      const secretKey = process.env.REACT_APP_QINIU_SK;

      if (!accessKey || !secretKey) {
        console.error('无法为私有空间生成签名URL，AK/SK缺失');
        return url;
      }

      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1小时有效期
      
      // 构造待签名的URL: 完整的原始URL + 过期时间参数
      const urlToSign = `${url}${url.includes('?') ? '&' : '?'}e=${deadline}`;
      
      // 计算HMAC-SHA1签名
      const sign = CryptoJS.HmacSHA1(urlToSign, secretKey);
      const encodedSign = sign.toString(CryptoJS.enc.Base64)
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      
      // 生成下载凭证
      const downloadToken = `${accessKey}:${encodedSign}`;
      
      // 拼接最终的URL
      return `${urlToSign}&token=${downloadToken}`;
    }

    return url;
  }



  /**
   * 删除七牛云文件
   * 使用服务器端API进行删除操作（推荐方式）
   */
  async deleteQiniuFile(key: string): Promise<boolean> {
    try {
      // 优先使用服务器端删除API
      const response = await fetch('/api/qiniu/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ key, bucket: this.config.bucket })
      });

      if (response.ok) {
        const result = await response.json();
        return result.success;
      } else if (response.status === 404) {
        // 文件不存在
        return false;
      } else {
        throw new Error(`删除失败: ${response.status}`);
      }
    } catch (error) {
      // 如果服务器端API不可用，在开发环境下可以尝试直接删除
      if (process.env.NODE_ENV === 'development') {
        console.warn('服务器删除API不可用，开发环境下跳过删除操作');
        return true;
      }
      throw error;
    }
  }

  /**
   * 删除文件（支持多个云存储提供商）
   */
  async deleteFile(key: string): Promise<boolean> {
    switch (this.config.provider) {
      case 'qiniu':
        return this.deleteQiniuFile(key);
      case 'aliyun':
        throw new Error('阿里云OSS删除功能暂未实现');
      case 'tencent':
        throw new Error('腾讯云COS删除功能暂未实现');
      default:
        throw new Error('本地存储删除功能暂未实现');
    }
  }

  /**
   * 批量删除文件
   */
  async batchDeleteFiles(keys: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };
    
    for (const key of keys) {
      try {
        const deleted = await this.deleteFile(key);
        if (deleted) {
          results.success.push(key);
        } else {
          results.failed.push(key);
        }
      } catch (error) {
        console.error(`删除文件 ${key} 失败:`, error);
        results.failed.push(key);
      }
    }
    
    return results;
  }

  /**
   * 批量上传
   */
  async batchUpload(
    files: File[],
    options?: {
      onProgress?: (fileIndex: number, percent: number) => void;
      onFileComplete?: (fileIndex: number, result: UploadResult) => void;
      concurrent?: number;
    }
  ): Promise<UploadResult[]> {
    const concurrent = options?.concurrent || 3;
    const results: UploadResult[] = [];
    
    // 分批上传
    for (let i = 0; i < files.length; i += concurrent) {
      const batch = files.slice(i, i + concurrent);
      const batchPromises = batch.map((file, index) => 
        this.upload(file, {
          onProgress: (percent) => {
            if (options?.onProgress) {
              options.onProgress(i + index, percent);
            }
          }
        }).then(result => {
          if (options?.onFileComplete) {
            options.onFileComplete(i + index, result);
          }
          return result;
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }


}

// 导出单例
export const uploadService = new UploadService();

// 导出类型
export type { UploadResult, UploadConfig, ProgressCallback };