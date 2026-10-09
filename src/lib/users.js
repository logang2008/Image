import { getRequestContext } from '@cloudflare/next-on-pages';

// 统一读取环境变量：优先运行时，其次构建时注入
function readEnv(key) {
  try {
    const { env } = getRequestContext();
    if (env?.[key] != null && env[key] !== '') return env[key];
  } catch {
    // 非请求上下文则走 process.env
  }
  return process.env[key];
}

// 用户列表来源（按优先级合并，用户名去重）：
// 1. USERS 环境变量（JSON 数组，可配任意多组）：
//    [{"username":"alice","password":"xxx","role":"user"},{"username":"bob","password":"yyy","role":"admin"}]
// 2. 兼容旧配置：BASIC_USER/BASIC_PASS（role=admin）、REGULAR_USER/REGULAR_PASS（role=user）
export function getUsers() {
  const users = [];
  const seen = new Set();

  const pushUser = (id, username, password, role) => {
    if (!username || !password || seen.has(username)) return;
    seen.add(username);
    users.push({ id, username, password, role: role || 'user' });
  };

  try {
    const raw = readEnv('USERS');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((u, i) => {
          pushUser(u?.id || `u${i + 1}`, u?.username, u?.password, u?.role);
        });
      }
    }
  } catch (e) {
    console.warn('USERS 环境变量解析失败:', e?.message);
  }

  pushUser('admin', readEnv('BASIC_USER'), readEnv('BASIC_PASS'), 'admin');
  pushUser('user', readEnv('REGULAR_USER'), readEnv('REGULAR_PASS'), 'user');

  return users;
}

// 定长比较，避免通过响应耗时逐字符猜出密码
function safeEqual(a, b) {
  a = String(a);
  b = String(b);
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

// 校验用户名密码，成功返回 {id, username, role}（不含密码），失败返回 null
export function validateCredentials(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) return null;
  const user = getUsers().find((u) => u.username === username);
  // 用户不存在时也做一次比较，避免通过耗时判断用户名是否存在
  const ok = safeEqual(password, user ? user.password : '\u0000' + password);
  if (!user || !ok) return null;
  return { id: user.id, username: user.username, role: user.role };
}
