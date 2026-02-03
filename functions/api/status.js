/**
 * 系统状态检查 API
 * GET /api/status
 * 返回 Telegram、KV、R2 等服务的连接状态
 */

export async function onRequestGet(context) {
  const { env } = context;
  
  const status = {
    telegram: { connected: false, message: '未配置' },
    kv: { connected: false, message: '未配置' },
    r2: { connected: false, message: '未配置', enabled: false },
    auth: { enabled: false, message: '未启用' }
  };

  // 检查 Telegram 配置
  if (env.TG_Bot_Token && env.TG_Chat_ID) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${env.TG_Bot_Token}/getMe`);
      const data = await response.json();
      if (data.ok) {
        status.telegram = {
          connected: true,
          message: `已连接 - @${data.result.username}`,
          botName: data.result.first_name,
          botUsername: data.result.username
        };
      } else {
        status.telegram = { connected: false, message: `连接失败: ${data.description}` };
      }
    } catch (error) {
      status.telegram = { connected: false, message: `连接错误: ${error.message}` };
    }
  }

  // 检查 KV 配置
  if (env.img_url) {
    try {
      // 尝试一个简单的 list 操作来验证 KV 是否可用
      const result = await env.img_url.list({ limit: 1 });
      status.kv = {
        connected: true,
        message: '已连接',
        hasData: result.keys && result.keys.length > 0
      };
    } catch (error) {
      status.kv = { connected: false, message: `连接错误: ${error.message}` };
    }
  }

  // 检查 R2 配置
  if (env.R2_BUCKET) {
    try {
      // 尝试 list 操作验证 R2 是否可用
      const result = await env.R2_BUCKET.list({ limit: 1 });
      status.r2 = {
        connected: true,
        enabled: true, // 只要 R2_BUCKET 存在就启用
        message: '已启用',
        hasData: result.objects && result.objects.length > 0
      };
    } catch (error) {
      status.r2 = { connected: false, enabled: false, message: `连接错误: ${error.message}` };
    }
  }

  // 检查认证配置
  if (env.BASIC_USER && env.BASIC_PASS) {
    status.auth = {
      enabled: true,
      message: '已启用密码认证'
    };
  }

  return new Response(JSON.stringify(status, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}
