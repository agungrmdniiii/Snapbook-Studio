import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com', pathname: '/gallery/**' },
      { protocol: 'https', hostname: 'whiyncjfocmnatbpknam.supabase.co', pathname: '/storage/v1/object/public/studio-gallery/**' },
    ],
  },
};

export default nextConfig;
