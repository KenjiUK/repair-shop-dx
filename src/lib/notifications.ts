/**
 * 通知システム
 * ジョブの状態に基づいて通知を生成・管理
 */

import { ZohoJob } from "@/types";
import { getNumericalMasterConfig } from "./numerical-master-config";

/**
 * 通知タイプ
 */
export type NotificationType =
  | "pending_approval_overdue" // 承認待ち3日超過
  | "parts_procurement_overdue" // 部品待ち7日超過
  | "scheduled_departure_today"; // 本日出庫予定

/**
 * 通知データ
 */
export interface Notification {
  /** 通知ID */
  id: string;
  /** 通知タイプ */
  type: NotificationType;
  /** ジョブID */
  jobId: string;
  /** ジョブ情報（簡易版） */
  job: {
    id: string;
    customerName: string | null;
    vehicleName: string | null;
    stage: string;
  };
  /** 通知メッセージ */
  message: string;
  /** 通知詳細 */
  description: string;
  /** 作成日時 */
  createdAt: string; // ISO 8601
  /** 既読状態 */
  read: boolean;
  /** 既読日時 */
  readAt: string | null; // ISO 8601
}

/**
 * 通知を生成（ジョブリストから）
 */
export function generateNotifications(jobs: ZohoJob[]): Notification[] {
  const config = getNumericalMasterConfig();
  const notifications: Notification[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const job of jobs) {
    // 1. 承認待ち3日超過（見積提示済みステータス）
    if (job.field5 === "見積提示済み" && job.field13) {
      // 見積提示日時を推定（field13が設定された日時）
      // 簡易実装: 入庫日時から経過日数を計算
      const arrivalDate = job.field22 ? new Date(job.field22) : null;
      if (arrivalDate) {
        const daysSinceArrival = Math.floor(
          (now.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceArrival >= config.thresholds.longPendingApprovalDays) {
          notifications.push({
            id: `pending_approval_${job.id}`,
            type: "pending_approval_overdue",
            jobId: job.id,
            job: {
              id: job.id,
              customerName: job.field4?.name || null,
              vehicleName: job.vehicle?.name || null,
              stage: job.field5,
            },
            message: "承認待ちが3日以上経過しています",
            description: `${job.field4?.name || "顧客"}様の見積が承認待ちです（${daysSinceArrival}日経過）`,
            createdAt: now.toISOString(),
            read: false,
            readAt: null,
          });
        }
      }
    }

    // 2. 部品待ち7日超過（部品調達待ちステータス）
    if (job.field5 === "部品調達待ち") {
      // 部品調達待ち開始日時を推定（ステータス変更日時または入庫日時）
      const arrivalDate = job.field22 ? new Date(job.field22) : null;
      if (arrivalDate) {
        const daysSinceArrival = Math.floor(
          (now.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceArrival >= config.thresholds.longPartsProcurementDays) {
          notifications.push({
            id: `parts_procurement_${job.id}`,
            type: "parts_procurement_overdue",
            jobId: job.id,
            job: {
              id: job.id,
              customerName: job.field4?.name || null,
              vehicleName: job.vehicle?.name || null,
              stage: job.field5,
            },
            message: "部品調達待ちが7日以上経過しています",
            description: `${job.field4?.name || "顧客"}様の部品調達が長期化しています（${daysSinceArrival}日経過）`,
            createdAt: now.toISOString(),
            read: false,
            readAt: null,
          });
        }
      }
    }

    // 3. 本日出庫予定（出庫待ちステータス）
    if (job.field5 === "出庫待ち") {
      // 本日が予定日かどうかを判定
      // 簡易実装: 出庫待ちステータスのジョブは本日出庫予定とする
      notifications.push({
        id: `scheduled_departure_${job.id}`,
        type: "scheduled_departure_today",
        jobId: job.id,
        job: {
          id: job.id,
          customerName: job.field4?.name || null,
          vehicleName: job.vehicle?.name || null,
          stage: job.field5,
        },
        message: "本日出庫予定です",
        description: `${job.field4?.name || "顧客"}様の車両が本日出庫予定です`,
        createdAt: now.toISOString(),
        read: false,
        readAt: null,
      });
    }
  }

  return notifications;
}

/**
 * 通知の既読状態を管理
 */
const STORAGE_KEY = "notifications-read";

/**
 * 既読状態を取得
 */
export function getReadNotifications(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const readIds = JSON.parse(stored) as string[];
      return new Set(readIds);
    }
  } catch (error) {
    console.error("Failed to load read notifications:", error);
  }

  return new Set();
}

/**
 * 通知を既読にする
 */
export function markNotificationAsRead(notificationId: string): void {
  if (typeof window === "undefined") return;

  try {
    const readIds = Array.from(getReadNotifications());
    if (!readIds.includes(notificationId)) {
      readIds.push(notificationId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
    }
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
}

/**
 * 全ての通知を既読にする
 */
export function markAllNotificationsAsRead(notificationIds: string[]): void {
  if (typeof window === "undefined") return;

  try {
    const readIds = Array.from(getReadNotifications());
    for (const id of notificationIds) {
      if (!readIds.includes(id)) {
        readIds.push(id);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
  }
}

/**
 * 既読状態を通知リストに適用
 */
export function applyReadStatus(
  notifications: Notification[]
): Notification[] {
  const readIds = getReadNotifications();
  return notifications.map((notification) => ({
    ...notification,
    read: readIds.has(notification.id),
    readAt: readIds.has(notification.id) ? new Date().toISOString() : null,
  }));
}

/**
 * 未読通知数を取得
 */
export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length;
}


