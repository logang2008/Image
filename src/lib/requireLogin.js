import { auth } from "@/auth";
import { getRequestContext } from '@cloudflare/next-on-pages';
import { isValidApiToken } from "./apiToken";

// 从 Cloudflare 环境变量读取 UPLOAD_API_TOKEN
function getEnvApiToken() {
  try {
    const { env } = getRequestContext();
    return env?.UPLOAD_API_TOKEN || null;
  } catch {
    return null;
  }
}

// 上传接口统一鉴权：满足任一条件即放行
// 1. Authorization: Bearer <UPLOAD_API_TOKEN>（长期 token，供自动化调用）
// 2. NextAuth 登录会话（浏览器人工操作）
// 未授权返回 401 JSON 响应
//
// 注意：第一个参数为 request（用于读取 Authorization 头）
export async function requireLogin(request, headers = {}) {
  if (isValidApiToken(request, getEnvApiToken())) {
    return null;
  }
  const session = await auth();
  if (session?.user) {
    return null;
  }
  return Response.json({
    status: 401,
    message: '请先登录后再上传',
    success: false
  }, {
    status: 401,
    headers,
  });
}
