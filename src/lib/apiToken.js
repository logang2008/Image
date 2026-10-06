import { SignJWT, jwtVerify } from 'jose';
import { getRequestContext } from '@cloudflare/next-on-pages';

// API token 说明：
// 用户登录后调用 GET /api/user/token 领取一个长期有效的 JWT，
// 上传时在请求头携带 Authorization: Bearer <token> 即可，
// 与 NextAuth 登录会话二选一通过鉴权。

// 与 auth.js 保持一致的 secret 解析：优先运行时环境变量，其次构建时注入，
// 最后回落到 auth.js 中的默认 secret（保持一致才能互认）
const FALLBACK_SECRET = '00Fv/YUm0enwy04IgP4KoNOWLODe2iJ1tvBzr+4kEZ8=';

function getJwtSecret() {
  try {
    const { env } = getRequestContext();
    if (env?.SECRET) return env.SECRET;
  } catch {
    // 非请求上下文（如构建期）则走 process.env
  }
  return process.env.SECRET || FALLBACK_SECRET;
}

function secretKey() {
  return new TextEncoder().encode(getJwtSecret());
}

// token 有效期：365 天
export const API_TOKEN_TTL_SECONDS = 365 * 24 * 60 * 60;

// 签发长期 API token（需已登录用户调用）
export async function issueApiToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({
    type: 'api-token',
    name: user?.name || '',
    role: user?.role || '',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user?.id ?? ''))
    .setIssuedAt(now)
    .setExpirationTime(now + API_TOKEN_TTL_SECONDS)
    .sign(secretKey());
  return {
    token,
    expiresAt: new Date((now + API_TOKEN_TTL_SECONDS) * 1000).toISOString(),
  };
}

// 校验请求头中的 Bearer token 是否为有效的 API token
export async function isValidApiToken(request) {
  const token = getBearerToken(request);
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload?.type === 'api-token';
  } catch {
    return false;
  }
}

// 从请求头提取 Bearer token，无则返回 null
export function getBearerToken(request) {
  if (!request?.headers) return null;
  const h = request.headers.get('authorization');
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
