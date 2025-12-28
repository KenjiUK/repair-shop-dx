import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // useSearchParams()の警告を回避するため、静的生成を無効化
  // 動的レンダリングを強制する（SSRのみ）
  images: {
    // Google Driveの画像URLに対応
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // 外部画像の最適化を無効化（動的URLが多い場合）
    unoptimized: false,
  },



  // コンパイラ最適化
  compiler: {
    // 本番環境でのconsole.logを削除
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

export default nextConfig;
