import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // useSearchParams()の警告を回避するため、静的生成を無効化
  // 動的レンダリングを強制する（SSRのみ）
};

export default nextConfig;
