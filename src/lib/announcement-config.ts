/**
 * お知らせ設定
 * お知らせバナーの内容を管理
 */

import { APP_VERSION } from "./version";

export interface AnnouncementConfig {
  /** お知らせID */
  id: string;
  /** お知らせメッセージ */
  message: string;
  /** バナーの背景色 */
  backgroundColor?: string;
  /** テキストの色 */
  textColor?: string;
  /** 有効期限（ISO8601形式、オプション） */
  expiresAt?: string | null;
  /** 優先度（数値が大きいほど優先） */
  priority?: number;
}

/**
 * 初回起動時にデフォルトのお知らせを追加・更新
 */
function initializeDefaultAnnouncements(): void {
  if (typeof window === "undefined") return;
  
  try {
    const stored = localStorage.getItem("announcement-banner-list");
    const existing = stored ? (JSON.parse(stored) as AnnouncementConfig[]) : [];
    
    // テスト版のお知らせが既に存在するかチェック
    const betaAnnouncementIndex = existing.findIndex((a) => a.id === "beta-release-2025-12");
    const expectedMessage = `🚀 デジタルガレージ ${APP_VERSION} を公開中です。ご意見・ご要望をお待ちしております。`;
    
    if (betaAnnouncementIndex === -1) {
      // 存在しない場合は追加
      const betaAnnouncement: AnnouncementConfig = {
        id: "beta-release-2025-12",
        message: expectedMessage,
        backgroundColor: "bg-blue-500",
        textColor: "text-white",
        expiresAt: null,
        priority: 10,
      };
      
      existing.push(betaAnnouncement);
      localStorage.setItem("announcement-banner-list", JSON.stringify(existing));
    } else {
      // 既に存在する場合は、メッセージを更新（バージョン情報を含める）
      const currentAnnouncement = existing[betaAnnouncementIndex];
      if (currentAnnouncement.message !== expectedMessage) {
        existing[betaAnnouncementIndex] = {
          ...currentAnnouncement,
          message: expectedMessage,
        };
        localStorage.setItem("announcement-banner-list", JSON.stringify(existing));
      }
    }
  } catch (error) {
    console.error("Failed to initialize default announcements:", error);
  }
}

/**
 * 現在有効なお知らせを取得
 * 有効期限をチェックし、優先度順にソート
 * 
 * 優先順位:
 * 1. localStorageに保存されたお知らせ（管理画面から登録）
 * 2. このファイル内のデフォルトお知らせ（コードで定義）
 */
export function getActiveAnnouncements(): AnnouncementConfig[] {
  const now = new Date();
  
  // 初回起動時にデフォルトのお知らせを追加
  if (typeof window !== "undefined") {
    initializeDefaultAnnouncements();
  }
  
  // localStorageから保存されたお知らせを取得
  let storedAnnouncements: AnnouncementConfig[] = [];
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("announcement-banner-list");
      if (stored) {
        storedAnnouncements = JSON.parse(stored) as AnnouncementConfig[];
      }
    } catch (error) {
      console.error("Failed to load stored announcements:", error);
    }
  }
  
  // デフォルトのお知らせ（コードで定義、通常は空）
  const defaultAnnouncements: AnnouncementConfig[] = [
    // コードで直接定義するお知らせはここに追加
    // 通常は管理画面から登録するため、ここは空にしておく
  ];
  
  // 両方を結合
  const allAnnouncements = [...storedAnnouncements, ...defaultAnnouncements];
  
  // 有効期限をチェック
  const activeAnnouncements = allAnnouncements.filter((announcement) => {
    if (!announcement.expiresAt) return true;
    const expiresAt = new Date(announcement.expiresAt);
    return now < expiresAt;
  });
  
  // 優先度順にソート（優先度が高い順）
  return activeAnnouncements.sort((a, b) => {
    const priorityA = a.priority || 0;
    const priorityB = b.priority || 0;
    return priorityB - priorityA;
  });
}

/**
 * お知らせが閉じられているか確認
 */
export function isAnnouncementClosed(id: string): boolean {
  if (typeof window === "undefined") return false;
  
  const storageKey = `announcement-banner-${id}-closed`;
  return localStorage.getItem(storageKey) === "true";
}




