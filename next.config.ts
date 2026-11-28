import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { securityHeaders } from "./security-headers.mjs";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
    allowedDevOrigins: ['127.0.0.1', '172.26.17.136'],
    poweredByHeader: false,
    async headers() {
        return [
            {
                source: '/:path*',
                headers: securityHeaders({ dev: isDev }),
            },
        ];
    },
    async redirects() {
        return [
            {
                // The API and older links call posts "articles"; posts live at /posts.
                // (/login is the blog's own reader sign-in, so it is no longer redirected.)
                source: '/articles/:path*',
                destination: '/posts/:path*',
                permanent: true,
            },
            {
                source: '/articles',
                destination: '/posts',
                permanent: true,
            },
            {
                source: '/admin',
                destination: 'https://admin.pphat.me',
                permanent: true,
            },
        ];
    },
    images: {
        localPatterns: [
            {
                pathname: '/**',
                search: '',
            },
        ],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'github.com',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
            {
                // Post/project images hosted in the pphatdev/assets repo.
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
                pathname: '/pphatdev/**',
            },
            {
                protocol: 'https',
                hostname: 'pphat.me',
            },
            {
                protocol: 'https',
                hostname: 'blog-api.pphatdev.workers.dev',
            },
            {
                protocol: 'https',
                hostname: 'pphat.top',
            },
            {
                protocol: 'https',
                hostname: 'api.pphat.top',
            },
            {
                protocol: 'https',
                hostname: 'avatar.vercel.sh',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            }
        ],
    },
};


export default nextConfig;

initOpenNextCloudflareForDev();
