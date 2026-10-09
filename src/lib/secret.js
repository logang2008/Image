import { getRequestContext } from '@cloudflare/next-on-pages';

// 读取登录会话 / API token 的签名密钥：SECRET（兼容 AUTH_SECRET）
// 优先 Cloudflare 运行时环境变量，其次构建时注入的 process.env
// 不再提供默认值：源码公开，默认密钥等于没有密钥，任何人都能伪造登录态
export function getAuthSecret() {
  try {
    const { env } = getRequestContext();
    if (env?.SECRET) return env.SECRET;
    if (env?.AUTH_SECRET) return env.AUTH_SECRET;
  } catch {
    // 非请求上下文（如构建期）则走 process.env
  }
  return process.env.SECRET || process.env.AUTH_SECRET || undefined;
}
