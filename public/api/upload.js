/**
 * 本地文件上传API
 * 用于开发环境的文件上传处理
 */

// 注意：这是一个模拟的API文件，用于开发环境
// 在生产环境中，这些逻辑应该在真正的后端服务器中实现

console.log('本地文件上传API - 此文件仅用于说明，实际需要后端实现');

// 示例响应格式
const exampleResponse = {
  success: true,
  url: 'http://localhost:3000/uploads/example-file.jpg',
  key: 'uploads/example-file.jpg',
  size: 1024,
  name: 'example-file.jpg',
  type: 'image/jpeg',
  message: '文件上传成功'
};

// 导出示例，实际不会被使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = exampleResponse;
} 