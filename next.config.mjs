/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                ],
            },
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
