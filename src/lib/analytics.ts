/**
 * アナリティクス収集ライブラリ（クライアント側）
 *
 * ページビュー、アクション完了、エラー発生、タイミングの自動収集
 */

import {
  UsageAnalytics,
  PageViewEvent,
  ActionEvent,
  ErrorEvent,
  TimingEvent,
} from "@/types";
import { getCurrentUser } from "./auth";

// =============================================================================
// 設定
// =============================================================================

const ANALYTICS_ENDPOINT = "/api/analytics";
const BATCH_SIZE = 10; // バッチ送信のサイズ
const FLUSH_INTERVAL = 30000; // 30秒ごとに自動送信
const MAX_QUEUE_SIZE = 100; // キューサイズの上限

// =============================================================================
// イベントキュー管理
// =============================================================================

let eventQueue: UsageAnalytics[] = [];
let flushTimer: NodeJS.Timeout | null = null;

/**
 * イベントをキューに追加
 */
function enqueueEvent(event: UsageAnalytics): void {
  // キューサイズの上限チェック
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    console.warn("[Analytics] キューが上限に達しました。古いイベントを削除します。");
    eventQueue.shift(); // 古いイベントを削除
  }

  eventQueue.push(event);

  // バッチサイズに達したら即座に送信
  if (eventQueue.length >= BATCH_SIZE) {
    flushEvents();
  } else {
    // タイマーをリセット
    scheduleFlush();
  }
}

/**
 * イベントを送信（バッチ処理）
 */
async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  // タイマーをクリア
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  try {
    await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ events: eventsToSend }),
    });
  } catch (error) {
    console.error("[Analytics] イベント送信エラー:", error);
    // エラー時はキューに戻す（ただし、キューサイズの上限を超えないように）
    eventQueue = [...eventsToSend, ...eventQueue].slice(0, MAX_QUEUE_SIZE);
  }
}

/**
 * タイマーをスケジュール
 */
function scheduleFlush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
  }

  flushTimer = setTimeout(() => {
    flushEvents();
  }, FLUSH_INTERVAL);
}

/**
 * ページアンロード時にキューを送信
 */
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    // 同期的に送信（navigator.sendBeaconを使用）
    if (eventQueue.length > 0) {
      const eventsToSend = JSON.stringify({ events: eventQueue });
      navigator.sendBeacon(ANALYTICS_ENDPOINT, eventsToSend);
    }
  });
}

// =============================================================================
// イベント送信関数
// =============================================================================

/**
 * ページビューを記録
 */
export function trackPageView(
  screenId: string,
  path: string,
  title?: string
): void {
  const user = getCurrentUser();
  const event: PageViewEvent = {
    eventType: "page_view",
    screenId,
    userRole: user?.role || "anonymous",
    timestamp: Date.now(),
    path,
    title,
  };

  enqueueEvent(event);
}

/**
 * アクション完了を記録
 */
export function trackAction(
  screenId: string,
  actionName: string,
  result: "success" | "failure",
  resourceId?: string,
  metadata?: Record<string, unknown>
): void {
  const user = getCurrentUser();
  const event: ActionEvent = {
    eventType: "action",
    screenId,
    userRole: user?.role || "anonymous",
    timestamp: Date.now(),
    actionName,
    result,
    resourceId,
    metadata,
  };

  enqueueEvent(event);
}

/**
 * エラー発生を記録
 */
export function trackError(
  screenId: string,
  errorCode: string,
  errorMessage: string,
  location?: string,
  metadata?: Record<string, unknown>
): void {
  const user = getCurrentUser();
  const event: ErrorEvent = {
    eventType: "error",
    screenId,
    userRole: user?.role || "anonymous",
    timestamp: Date.now(),
    errorCode,
    errorMessage,
    location,
    metadata,
  };

  enqueueEvent(event);
}

/**
 * タイミングを記録
 */
export function trackTiming(
  screenId: string,
  timingName: string,
  duration: number,
  target?: string,
  metadata?: Record<string, unknown>
): void {
  const user = getCurrentUser();
  const event: TimingEvent = {
    eventType: "timing",
    screenId,
    userRole: user?.role || "anonymous",
    timestamp: Date.now(),
    timingName,
    duration,
    target,
    metadata,
  };

  enqueueEvent(event);
}

// =============================================================================
// ユーティリティ関数
// =============================================================================

/**
 * 手動でキューを送信
 */
export async function flushAnalytics(): Promise<void> {
  await flushEvents();
}

/**
 * キューをクリア
 */
export function clearAnalyticsQueue(): void {
  eventQueue = [];
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
























