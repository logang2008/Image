import { auth } from "@/auth";

// 上传接口必须登录（不受 ENABLE_AUTH_API 开关影响）
// 已登录返回 null，未登录返回 401 响应
export async function requireLogin(headers = {}) {
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
