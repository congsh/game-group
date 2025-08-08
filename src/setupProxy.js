const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 代理七牛云API请求到本地处理
  app.use('/api/qiniu', createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    pathRewrite: {
      '^/api/qiniu': '/api/qiniu'
    },
    onProxyReq: (proxyReq, req, res) => {
      // 如果是POST请求到token端点，返回模拟的token
      if (req.method === 'POST' && req.url === '/token') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          token: 'mock_qiniu_token_for_development',
          message: '开发环境模拟token'
        }));
        return;
      }
      
      // 如果是POST请求到delete端点，返回成功
      if (req.method === 'POST' && req.url === '/delete') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: '开发环境模拟删除成功'
        }));
        return;
      }
    }
  }));

  // 代理本地文件上传API
  app.use('/api/upload', createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    pathRewrite: {
      '^/api/upload': '/api/upload'
    },
    onProxyReq: (proxyReq, req, res) => {
      // 如果是POST请求，返回模拟的上传结果
      if (req.method === 'POST') {
        const timestamp = Date.now();
        const fileName = `file_${timestamp}.tmp`;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          url: `http://localhost:3000/uploads/${fileName}`,
          key: `uploads/${fileName}`,
          size: 1024,
          name: fileName,
          type: 'application/octet-stream',
          message: '开发环境模拟上传成功'
        }));
        return;
      }
    }
  }));
}; 