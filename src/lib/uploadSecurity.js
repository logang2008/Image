// 上传文件校验 + 文件响应安全头
// 只允许常见位图格式，SVG/HTML 等可执行内容一律拒绝

// 扩展名白名单 -> 对应的真实格式
const ALLOWED_EXTENSIONS = {
  jpg: 'jpeg',
  jpeg: 'jpeg',
  png: 'png',
  gif: 'gif',
  webp: 'webp',
  bmp: 'bmp',
  avif: 'avif',
};

const FORMAT_MIME = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  avif: 'image/avif',
};

function startsWith(bytes, signature, offset = 0) {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((b, i) => bytes[offset + i] === b);
}

function ascii(str) {
  return Array.from(str, (c) => c.charCodeAt(0));
}

// 根据文件头 magic bytes 判断真实格式
export function detectImageFormat(bytes) {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(bytes, ascii('GIF87a')) || startsWith(bytes, ascii('GIF89a'))) return 'gif';
  if (startsWith(bytes, ascii('RIFF')) && startsWith(bytes, ascii('WEBP'), 8)) return 'webp';
  if (startsWith(bytes, ascii('BM'))) return 'bmp';
  if (startsWith(bytes, ascii('ftyp'), 4) && (startsWith(bytes, ascii('avif'), 8) || startsWith(bytes, ascii('avis'), 8))) return 'avif';
  return null;
}

function getExtension(fileName) {
  if (!fileName || !fileName.includes('.')) return '';
  return fileName.split('.').pop().toLowerCase();
}

// 校验上传文件：扩展名白名单 + magic bytes，且两者必须一致
// 返回 { ok: true, ext, mime } 或 { ok: false, message }
export async function validateImageUpload(file) {
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    return { ok: false, message: '未找到上传文件' };
  }

  if (file.size === 0) {
    return { ok: false, message: '文件为空' };
  }

  const ext = getExtension(file.name);
  const expectedFormat = ALLOWED_EXTENSIONS[ext];
  if (!expectedFormat) {
    return { ok: false, message: `不支持的文件类型，仅允许: ${Object.keys(ALLOWED_EXTENSIONS).join(', ')}` };
  }

  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const detectedFormat = detectImageFormat(header);
  if (!detectedFormat) {
    return { ok: false, message: '文件内容不是有效的图片' };
  }
  if (detectedFormat !== expectedFormat) {
    return { ok: false, message: `文件扩展名 .${ext} 与实际内容 (${detectedFormat}) 不符` };
  }

  return { ok: true, ext, mime: FORMAT_MIME[detectedFormat] };
}

export function invalidUploadResponse(message, headers = {}) {
  return Response.json({
    status: 400,
    message,
    success: false
  }, {
    status: 400,
    headers,
  });
}

// 允许浏览器内联展示的类型，其余一律当附件下载
const INLINE_SAFE_TYPES = new Set([
  ...Object.values(FORMAT_MIME),
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

// 给文件响应加安全头：nosniff + CSP sandbox，非白名单类型强制下载
export function withFileSecurityHeaders(response) {
  const headers = new Headers(response.headers);

  const contentType = (headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!INLINE_SAFE_TYPES.has(contentType)) {
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Disposition', 'attachment');
  }

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; sandbox");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
