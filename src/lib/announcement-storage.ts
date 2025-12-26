/**
 * お知らせストレージ管理
 * localStorageベースのお知らせ管理機能
 */

import { AnnouncementConfig } from "./announcement-config";

const STORAGE_KEY = "announcement-banner-list";

/**
 * localStorageからお知らせ一覧を取得
 */
export function getStoredAnnouncements(): AnnouncementConfig[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const announcements = JSON.parse(stored) as AnnouncementConfig[];
    return announcements;
  } catch (error) {
    console.error("Failed to parse stored announcements:", error);
    return [];
  }
}

/**
 * localStorageにお知らせ一覧を保存
 */
export function saveStoredAnnouncements(announcements: AnnouncementConfig[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(announcements));
  } catch (error) {
    console.error("Failed to save announcements:", error);
    throw new Error("お知らせの保存に失敗しました");
  }
}

/**
 * お知らせを追加
 */
export function addAnnouncement(announcement: AnnouncementConfig): void {
  const announcements = getStoredAnnouncements();
  announcements.push(announcement);
  saveStoredAnnouncements(announcements);
}

/**
 * お知らせを更新
 */
export function updateAnnouncement(id: string, updates: Partial<AnnouncementConfig>): void {
  const announcements = getStoredAnnouncements();
  const index = announcements.findIndex((a) => a.id === id);
  
  if (index === -1) {
    throw new Error(`お知らせが見つかりません: ${id}`);
  }
  
  announcements[index] = { ...announcements[index], ...updates };
  saveStoredAnnouncements(announcements);
}

/**
 * お知らせを削除
 */
export function deleteAnnouncement(id: string): void {
  const announcements = getStoredAnnouncements();
  const filtered = announcements.filter((a) => a.id !== id);
  saveStoredAnnouncements(filtered);
  
  // 閉じた状態も削除
  const closedKey = `announcement-banner-${id}-closed`;
  localStorage.removeItem(closedKey);
}

/**
 * お知らせをIDで取得
 */
export function getAnnouncementById(id: string): AnnouncementConfig | null {
  const announcements = getStoredAnnouncements();
  return announcements.find((a) => a.id === id) || null;
}




