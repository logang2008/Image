/** @type {import('next').NextConfig} */
const nextConfig = {
    // 只用 next/image 预览本地 blob，不需要服务端图片优化；关闭 /_next/image 入口，减少攻击面
    images: { unoptimized: true },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                ],
            },
            // 页面禁止被其他站点用 iframe 嵌套（防点击劫持）；图片地址不受影响
            ...['/', '/login', '/admin', '/admin/:path*'].map((source) => ({
                source,
                headers: [
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
                ],
            })),
        ]
    },
    async rewrites() {
        return [
            {
                source: '/file/:name*',
                destination: '/api/file/:name*', 
            },
        ]
    },
};

export default nextConfig;
