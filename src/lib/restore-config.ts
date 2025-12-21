/**
 * レストア系：設定
 *
 * レストアの種類、フェーズ、部品管理の設定を定義
 */

// =============================================================================
// 型定義
// =============================================================================

/**
 * レストアの種類
 */
export type RestoreType = "フルレストア" | "部分レストア" | "その他";

/**
 * 修復内容
 */
export type RestoreContent = "修復" | "交換" | "塗装" | "その他";

/**
 * 修復の程度
 */
export type RestoreSeverity = "軽微" | "中程度" | "深刻";

/**
 * 現状確認の状態
 */
export type ConditionStatus =
  | "良好"
  | "軽微な劣化"
  | "中程度の劣化"
  | "深刻な劣化"
  | "修復必要";

/**
 * 作業フェーズ
 */
export type WorkPhase =
  | "分解"
  | "診断・評価"
  | "部品発注"
  | "修復"
  | "組み立て"
  | "仕上げ"
  | "最終確認";

/**
 * フェーズの状態
 */
export type PhaseStatus = "未開始" | "作業中" | "完了" | "保留";

/**
 * 部品の取り寄せ状況
 */
export type PartStatus = "在庫あり" | "発注済み" | "取り寄せ中" | "到着済み" | "遅延";

/**
 * 車体部位（レストア用）
 */
export type RestoreBodyPart =
  | "エンジン"
  | "トランスミッション"
  | "サスペンション"
  | "ブレーキ"
  | "ボディ"
  | "内装"
  | "電装系"
  | "その他";

// =============================================================================
// マスタデータ
// =============================================================================

/**
 * レストアの種類一覧
 */
export const RESTORE_TYPES: RestoreType[] = ["フルレストア", "部分レストア", "その他"];

/**
 * 修復内容一覧
 */
export const RESTORE_CONTENTS: RestoreContent[] = ["修復", "交換", "塗装", "その他"];

/**
 * 修復の程度一覧
 */
export const RESTORE_SEVERITIES: RestoreSeverity[] = ["軽微", "中程度", "深刻"];

/**
 * 現状確認の状態一覧
 */
export const CONDITION_STATUSES: ConditionStatus[] = [
  "良好",
  "軽微な劣化",
  "中程度の劣化",
  "深刻な劣化",
  "修復必要",
];

/**
 * 作業フェーズ一覧（順序付き）
 */
export const WORK_PHASES: WorkPhase[] = [
  "分解",
  "診断・評価",
  "部品発注",
  "修復",
  "組み立て",
  "仕上げ",
  "最終確認",
];

/**
 * フェーズの状態一覧
 */
export const PHASE_STATUSES: PhaseStatus[] = ["未開始", "作業中", "完了", "保留"];

/**
 * 部品の取り寄せ状況一覧
 */
export const PART_STATUSES: PartStatus[] = [
  "在庫あり",
  "発注済み",
  "取り寄せ中",
  "到着済み",
  "遅延",
];

/**
 * 車体部位一覧（レストア用）
 */
export const RESTORE_BODY_PARTS: RestoreBodyPart[] = [
  "エンジン",
  "トランスミッション",
  "サスペンション",
  "ブレーキ",
  "ボディ",
  "内装",
  "電装系",
  "その他",
];

/**
 * フェーズの順序を取得
 */
export function getPhaseOrder(phase: WorkPhase): number {
  return WORK_PHASES.indexOf(phase);
}

/**
 * 次のフェーズを取得
 */
export function getNextPhase(currentPhase: WorkPhase): WorkPhase | null {
  const currentIndex = WORK_PHASES.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === WORK_PHASES.length - 1) {
    return null;
  }
  return WORK_PHASES[currentIndex + 1];
}

/**
 * 前のフェーズを取得
 */
export function getPreviousPhase(currentPhase: WorkPhase): WorkPhase | null {
  const currentIndex = WORK_PHASES.indexOf(currentPhase);
  if (currentIndex <= 0) {
    return null;
  }
  return WORK_PHASES[currentIndex - 1];
}

/**
 * フェーズ間の依存関係をチェック（前のフェーズが完了しているか）
 */
export function canStartPhase(
  phase: WorkPhase,
  phases: Array<{ name: WorkPhase; status: PhaseStatus }>
): boolean {
  const previousPhase = getPreviousPhase(phase);
  if (!previousPhase) {
    return true; // 最初のフェーズは常に開始可能
  }
  const previousPhaseData = phases.find((p) => p.name === previousPhase);
  return previousPhaseData?.status === "完了";
}

/**
 * フェーズの予定日を計算（前のフェーズの完了日 + 作業期間）
 */
export function calculatePhaseExpectedDate(
  phase: WorkPhase,
  phases: Array<{ name: WorkPhase; completionDate?: string }>,
  baseDate?: string
): string | null {
  const previousPhase = getPreviousPhase(phase);
  if (!previousPhase) {
    return baseDate || null; // 最初のフェーズは基準日を使用
  }
  const previousPhaseData = phases.find((p) => p.name === previousPhase);
  return previousPhaseData?.completionDate || null;
}









