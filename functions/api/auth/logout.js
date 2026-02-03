/**
 * 登出 API
 * POST /api/auth/logout
 */
import { 
  getSessionFromCookie,
  deleteSession,
  createClearSessionCookieHeader 
} from '../../utils/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const sessionToken = getSessionFromCookie(request);
    
    if (sessionToken) {
      await deleteSession(sessionToken, env);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: '已退出登录' 
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': createClearSessionCookieHeader()
      }
    });

  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '退出失败' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
