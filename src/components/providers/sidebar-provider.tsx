"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from "react";

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 画面サイズを監視（モバイル判定のみ、デバウンス付き）
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile((prev) => {
        const mobile = window.innerWidth < 768;
        // 値が変更された場合のみ更新（不要な再レンダリングを防ぐ）
        if (prev === mobile) return prev;
        return mobile;
      });
    };

    // 初回実行
    checkMobile();
    
    // リサイズイベントのデバウンス処理
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        checkMobile();
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // 関数をメモ化（不要な再レンダリングを防ぐ）
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Contextの値をメモ化（依存配列の値が変更された時のみ再作成）
  const contextValue = useMemo(
    () => ({ isOpen, toggle, open, close, isMobile }),
    [isOpen, toggle, open, close, isMobile]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
