export const runtime = 'edge';
import { auth } from "@/auth";
import { validateCredentials } from "@/lib/users";
import { issueApiToken } from "@/lib/apiToken";

// GET /api/user/token：已登录用户（浏览器会话）领取长期 API token
// 上传时携带 Authorization: Bearer <token> 即可
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({
      status: 401,
      message: '请先登录',
      success: false
    }, { status: 401 });
  }
  const data = await issueApiToken({
    id: session.user.id,
    name: session.user.name,
    role: session.user.role,
  });
  return Response.json({ success: true, ...data });
}

// POST /api/user/token：用户名密码直接换取长期 API token（供脚本/自动化调用）
// Body: { "username": "...", "password": "..." }
export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }
  const user = validateCredentials(body?.username, body?.password);
  if (!user) {
    return Response.json({
      status: 401,
      message: '用户名或密码错误',
      success: false
    }, { status: 401 });
  }
  const data = await issueApiToken({ id: user.id, name: user.username, role: user.role });
  return Response.json({ success: true, ...data });
}
