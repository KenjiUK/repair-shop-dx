"use client";

/**
 * テーマ管理フック
 * 
 * ダークモード/ライトモードの切り替えを管理
 */

import { useState, useEffect } from "react";

export type Theme = "light" | "dark";

/**
 * テーマ管理フック
 * 
 * システム設定に追従し、localStorageに保存
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // localStorageから保存されたテーマを取得
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    
    // システム設定を検出
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    
    // 保存されたテーマがあればそれを使用、なければシステム設定に追従
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    
    // HTML要素にクラスを適用
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    // HTML要素にクラスを適用
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return { theme, toggleTheme, mounted };
}


