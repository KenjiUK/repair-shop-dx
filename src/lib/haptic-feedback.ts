/**
 * ハプティックフィードバック（モバイル）
 * 
 * モバイルデバイスでの触覚フィードバックを提供
 */

// =============================================================================
// Types
// =============================================================================

/**
 * ハプティックフィードバックの種類
 */
export type HapticFeedbackType =
  | "light" // 軽い振動
  | "medium" // 中程度の振動
  | "heavy" // 強い振動
  | "success" // 成功時の振動パターン
  | "warning" // 警告時の振動パターン
  | "error"; // エラー時の振動パターン

// =============================================================================
// Functions
// =============================================================================

/**
 * ハプティックフィードバックをトリガー
 * 
 * @param type フィードバックの種類
 * @returns 成功したかどうか
 */
export function triggerHapticFeedback(
  type: HapticFeedbackType = "medium"
): boolean {
  // ブラウザのVibration APIをサポートしているか確認
  if (typeof window === "undefined" || !("vibrate" in navigator)) {
    return false;
  }

  try {
    const patterns = getVibrationPattern(type);
    navigator.vibrate(patterns);
    return true;
  } catch (error) {
    console.warn("ハプティックフィードバックの実行に失敗しました:", error);
    return false;
  }
}

/**
 * 振動パターンを取得
 */
function getVibrationPattern(type: HapticFeedbackType): number | number[] {
  switch (type) {
    case "light":
      return 10; // 10ms
    case "medium":
      return 20; // 20ms
    case "heavy":
      return 50; // 50ms
    case "success":
      return [10, 50, 10]; // 短→長→短
    case "warning":
      return [20, 30, 20]; // 中→中→中
    case "error":
      return [50, 100, 50]; // 長→長→長
    default:
      return 20;
  }
}

/**
 * ハプティックフィードバックを停止
 */
export function stopHapticFeedback(): void {
  if (typeof window === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  try {
    navigator.vibrate(0);
  } catch (error) {
    console.warn("ハプティックフィードバックの停止に失敗しました:", error);
  }
}















