// 上传接口 Bearer token 鉴权 helpers（纯函数，无外部依赖，可在 middleware 中安全引用）

// 常量时间字符串比较，防止时序攻击
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// 从请求头提取 Bearer token，无则返回 null
export function getBearerToken(request) {
  if (!request?.headers) return null;
  const h = request.headers.get('authorization');
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

// 校验 token：与期望值做常量时间比较
// 期望值为空（未配置 UPLOAD_API_TOKEN）时直接返回 false，即 token 通道关闭
export function isValidApiToken(request, expectedToken) {
  if (!expectedToken) return false;
  const got = getBearerToken(request);
  if (!got) return false;
  return timingSafeEqual(got, expectedToken);
}
