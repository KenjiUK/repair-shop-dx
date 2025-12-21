/**
 * LINE通知テンプレート
 * 
 * 各種通知タイプに対応するメッセージテンプレートを定義
 */

import { LineNotificationType } from "./line-api";

// =============================================================================
// Types
// =============================================================================

/**
 * 通知テンプレートデータ
 */
export interface NotificationTemplateData {
  /** 顧客名 */
  customerName: string;
  /** 車両名 */
  vehicleName: string;
  /** ナンバープレート（オプション） */
  licensePlate?: string;
  /** 作業種類 */
  serviceKind: string;
  /** Job ID */
  jobId: string;
  /** マジックリンクURL（オプション） */
  magicLinkUrl?: string;
  /** 追加データ */
  additionalData?: Record<string, unknown>;
}

/**
 * LINE通知メッセージ
 */
export interface LineNotificationMessage {
  /** メッセージタイプ（text, flex, template等） */
  type: "text" | "flex" | "template";
  /** メッセージ本文（textの場合） */
  text?: string;
  /** Flexメッセージ（flexの場合） */
  altText?: string;
  contents?: unknown;
  /** テンプレートメッセージ（templateの場合） */
  template?: unknown;
}

// =============================================================================
// Template Functions
// =============================================================================

/**
 * 入庫完了通知のメッセージを生成
 */
export function createCheckInNotification(
  data: NotificationTemplateData
): LineNotificationMessage {
  return {
    type: "text",
    text: `【${data.customerName}様】\n\nお車の入庫が完了しました。\n\n車両: ${data.vehicleName}${data.licensePlate ? ` (${data.licensePlate})` : ""}\n作業: ${data.serviceKind}\n\n診断が完了次第、お見積もりをお送りいたします。`,
  };
}

/**
 * 診断完了通知のメッセージを生成
 */
export function createDiagnosisCompleteNotification(
  data: NotificationTemplateData
): LineNotificationMessage {
  return {
    type: "text",
    text: `【${data.customerName}様】\n\n診断が完了しました。\n\n車両: ${data.vehicleName}${data.licensePlate ? ` (${data.licensePlate})` : ""}\n作業: ${data.serviceKind}\n\nお見積もりを作成中です。しばらくお待ちください。`,
  };
}

/**
 * 見積送付通知のメッセージを生成
 */
export function createEstimateSentNotification(
  data: NotificationTemplateData
): LineNotificationMessage {
  const magicLinkText = data.magicLinkUrl
    ? `\n\n以下のリンクからお見積もりの確認・承認が可能です：\n${data.magicLinkUrl}`
    : "";

  return {
    type: "text",
    text: `【${data.customerName}様】\n\nお見積もりが完成しました。\n\n車両: ${data.vehicleName}${data.licensePlate ? ` (${data.licensePlate})` : ""}\n作業: ${data.serviceKind}${magicLinkText}\n\nご確認の上、承認をお願いいたします。`,
  };
}

/**
 * 見積承認通知のメッセージを生成
 */
export function createEstimateApprovedNotification(
  data: NotificationTemplateData
): LineNotificationMessage {
  return {
    type: "text",
    text: `【${data.customerName}様】\n\nお見積もりの承認ありがとうございます。\n\n車両: ${data.vehicleName}${data.licensePlate ? ` (${data.licensePlate})` : ""}\n作業: ${data.serviceKind}\n\n作業を開始いたします。完了次第、ご連絡いたします。`,
  };
}

/**
 * 作業完了通知のメッセージを生成
 */
export function createWorkCompleteNotification(
  data: NotificationTemplateData
): LineNotificationMessage {
  return {
    type: "text",
    text: `【${data.customerName}様】\n\n作業が完了しました。\n\n車両: ${data.vehicleName}${data.licensePlate ? ` (${data.licensePlate})` : ""}\n作業: ${data.serviceKind}\n\nお車の引き取りが可能です。お気をつけてお越しください。`,
  };
}

/**
 * 通知タイプに応じたメッセージを生成
 * 
 * @param type 通知タイプ
 * @param data テンプレートデータ
 * @returns LINE通知メッセージ
 */
export function createNotificationMessage(
  type: LineNotificationType,
  data: NotificationTemplateData
): LineNotificationMessage {
  switch (type) {
    case "check_in":
      return createCheckInNotification(data);
    case "diagnosis_complete":
      return createDiagnosisCompleteNotification(data);
    case "estimate_sent":
      return createEstimateSentNotification(data);
    case "estimate_approved":
      return createEstimateApprovedNotification(data);
    case "work_complete":
      return createWorkCompleteNotification(data);
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
}















