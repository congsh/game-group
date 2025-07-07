const qiniu = require('qiniu');
const process = require('process');

// 此函数处理删除请求
// 注意：这应该是一个受保护的端点，只有授权用户才能调用
module.exports = (req, res) => {
  // 仅支持 POST 方法
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { key, bucket } = req.body;

    // 检查请求体中是否包含 key 和 bucket
    if (!key || !bucket) {
      return res.status(400).json({ success: false, message: '缺少 key 或 bucket 参数' });
    }

    // 从环境变量中获取七牛云的 Access Key 和 Secret Key
    const accessKey = process.env.REACT_APP_QINIU_AK;
    const secretKey = process.env.REACT_APP_QINIU_SK;

    // 检查环境变量是否配置
    if (!accessKey || !secretKey) {
        console.error('Qiniu AK/SK not configured in environment variables.');
        return res.status(500).json({ success: false, message: '服务器存储配置错误' });
    }

    // 创建七牛云配置和凭证
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const config = new qiniu.conf.Config();
    // 根据需要配置机房，例如 qiniu.zone.Zone_z2
    const bucketManager = new qiniu.rs.BucketManager(mac, config);

    // 执行删除操作
    bucketManager.delete(bucket, key, (err, respBody, respInfo) => {
      if (err) {
        console.error('Qiniu delete error:', err);
        // 如果错误是因为文件不存在 (612)，我们也视作成功
        if (respInfo.statusCode === 612) {
            return res.status(200).json({ success: true, message: '文件不存在，无需删除' });
        }
        return res.status(500).json({ success: false, message: '云存储文件删除失败', error: err.message });
      }

      if (respInfo.statusCode === 200) {
        return res.status(200).json({ success: true, message: '文件删除成功' });
      } else {
        console.error('Qiniu delete response:', respBody);
        return res.status(respInfo.statusCode).json({ success: false, message: '云存储文件删除失败', data: respBody });
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ success: false, message: '服务器内部错误' });
  }
}; 