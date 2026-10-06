import { auth } from "@/auth";
import { isValidApiToken } from "./apiToken";

// 上传接口统一鉴权：满足任一条件即放行
// 1. Authorization: Bearer <api-token>（登录后经 /api/user/token 领取的长期 token）
// 2. NextAuth 登录会话（浏览器人工操作）
// 未授权返回 401 JSON 响应
//
// 注意：第一个参数为 request（用于读取 Authorization 头）
export async function requireLogin(request, headers = {}) {
  if (await isValidApiToken(request)) {
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
