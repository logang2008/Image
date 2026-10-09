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
  // 只认真实登录用户（有 role），配置异常时 auth 可能返回不完整对象，不能放行
  if (session?.user?.role) {
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

// 后台接口鉴权：仅 admin 角色放行（middleware 之外的第二道防线）
export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role === 'admin') {
    return null;
  }
  return Response.json({
    status: "fail",
    message: "You are not logged in by admin !",
    success: false
  }, {
    status: 401,
  });
}
