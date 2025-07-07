/**
 * 七牛云API接口
 * 提供上传凭证生成等服务
 */

import CryptoJS from 'crypto-js';

/**
 * 生成七牛云上传凭证
 * @param key 文件key
 * @returns 上传凭证
 */
export async function generateUploadToken(key: string): Promise<string> {
  const accessKey = process.env.REACT_APP_QINIU_AK;
  const secretKey = process.env.REACT_APP_QINIU_SK;
  const bucket = process.env.REACT_APP_QINIU_BUCKET;
  
  if (!accessKey || !secretKey || !bucket) {
    throw new Error('七牛云配置不完整');
  }
  
  // 构造上传策略
  const putPolicy = {
    scope: `${bucket}:${key}`,
    deadline: Math.floor(Date.now() / 1000) + 3600 // 1小时后过期
  };
  
  // 将上传策略序列化成JSON
  const putPolicyJson = JSON.stringify(putPolicy);
  
  // 对JSON编码的上传策略进行URL安全的Base64编码
  const encodedPutPolicy = stringToUrlSafeBase64(putPolicyJson);
  
  // 使用访问密钥对待签名字符串计算HMAC-SHA1签名
  const sign = CryptoJS.HmacSHA1(encodedPutPolicy, secretKey);
  const encodedSign = CryptoJS.enc.Base64.stringify(sign)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  // 将访问密钥、encodedSign和encodedPutPolicy用:连接起来
  const uploadToken = `${accessKey}:${encodedSign}:${encodedPutPolicy}`;
  
  return uploadToken;
}

/**
 * 生成URL签名
 * @param url 待签名的URL
 * @returns 签名字符串
 */
export async function generateUrlSignature(url: string): Promise<string> {
  const secretKey = process.env.REACT_APP_QINIU_SK;
  
  if (!secretKey) {
    throw new Error('七牛云密钥未配置');
  }
  
  // 使用HMAC-SHA1计算签名
  const sign = CryptoJS.HmacSHA1(url, secretKey);
  const encodedSign = CryptoJS.enc.Base64.stringify(sign)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return encodedSign;
}

/**
 * 生成管理凭证
 * @param method HTTP方法
 * @param path 请求路径
 * @param query 查询参数
 * @param host 主机名
 * @param contentType 内容类型
 * @param body 请求体
 * @returns 管理凭证
 */
export async function generateAccessToken(
  method: string,
  path: string,
  query?: string,
  host?: string,
  contentType?: string,
  body?: string
): Promise<string> {
  const accessKey = process.env.REACT_APP_QINIU_AK;
  const secretKey = process.env.REACT_APP_QINIU_SK;
  
  if (!accessKey || !secretKey) {
    throw new Error('七牛云配置不完整');
  }
  
  // 构造待签名的原始字符串
  let signingStr = `${method} ${path}`;
  if (query) {
    signingStr += `?${query}`;
  }
  signingStr += `\nHost: ${host || 'rs.qiniu.com'}`;
  if (contentType) {
    signingStr += `\nContent-Type: ${contentType}`;
  }
  signingStr += '\n\n';
  if (body) {
    signingStr += body;
  }
  
  // 生成签名
  const sign = CryptoJS.HmacSHA1(signingStr, secretKey);
  const encodedSign = CryptoJS.enc.Base64.stringify(sign)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  const accessToken = `Qiniu ${accessKey}:${encodedSign}`;
  
  return accessToken;
}

/**
 * 字符串转URL安全的Base64编码
 */
function stringToUrlSafeBase64(str: string): string {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}