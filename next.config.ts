import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // useSearchParams()を使うページが多いため、全ページを動的レンダリングに設定
  experimental: {
    // 静的生成を無効化（必要に応じて個別ページで設定可能）
  },
};

export default nextConfig;
