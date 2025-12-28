import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      zIndex: {
        // Z-Index階層管理（DESIGN_SYSTEM.mdに準拠）
        // 40歳以上ユーザー向け最適化のため、レイヤーを明確に定義
        header: "40",      // ヘッダー（AppHeader）
        sheet: "50",       // サイドパネル（Sheet）
        dialog: "60",      // ダイアログ（Dialog）
        toast: "100",      // トースト通知（Toast）
      },
    },
  },
  plugins: [],
};

export default config;

