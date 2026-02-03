/**
 * 全局认证中间件
 * 保护需要登录才能访问的页面和API
 */
import { 
  checkAuthentication, 
  isAuthRequired,
  getSessionFromCookie,
  verifySession
} from './utils/auth.js';

// 不需要认证的公开路径
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/check',
  '/login.html',
  '/favicon.ico',
  '/_nuxt/',
  '/api/bing/'
];

// 静态资源扩展名
const STATIC_EXTENSIONS = ['.css', '.js', '.svg', '.png', '.jpg', '.ico', '.woff', '.woff2', '.ttf'];

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 检查是否是公开路径
  const isPublicPath = PUBLIC_PATHS.some(p => path.startsWith(p));
  if (isPublicPath) {
    return context.next();
  }

  // 检查是否是静态资源
  const isStaticResource = STATIC_EXTENSIONS.some(ext => path.endsWith(ext));
  if (isStaticResource && !path.includes('/file/')) {
    return context.next();
  }

  // 如果没有配置认证，直接放行
  if (!isAuthRequired(env)) {
    return context.next();
  }

  // 检查认证状态
  const authResult = await checkAuthentication(context);
  
  if (authResult.authenticated) {
    // 将认证信息传递给后续处理
    context.data.auth = authResult;
    return context.next();
  }

  // 未认证的请求
  // 对于 API 请求返回 401
  if (path.startsWith('/api/') || path.startsWith('/upload')) {
    return new Response(JSON.stringify({ error: 'Unauthorized', message: '请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 对于页面请求重定向到登录页
  return Response.redirect(`${url.origin}/login.html?redirect=${encodeURIComponent(path)}`, 302);
}
