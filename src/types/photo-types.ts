/**
 * 写真の種類と分類の型定義
 * 
 * 写真機能の整理のため、写真の種類と分類を明確に定義
 */

/**
 * 写真の用途分類
 * 
 * - `internal`: 社内用（診断・作業記録として使用）
 * - `blog`: ブログ用（SNS/ブログ素材として使用）
 */
export type PhotoUsage = "internal" | "blog";

/**
 * 写真の種類（社内用）
 * 
 * - `diagnosis`: 診断写真（証拠写真、不具合箇所など）
 * - `before`: 作業前写真
 * - `after`: 作業後写真
 * - `general`: その他の作業写真
 */
export type InternalPhotoType = "diagnosis" | "before" | "after" | "general";

/**
 * 写真の種類（ブログ用）
 * 
 * ブログ用写真は位置（position）で分類される
 * - `front`: 前面
 * - `rear`: 後面
 * - `left`: 左側面
 * - `right`: 右側面
 * - `engine`: エンジンルーム
 * - `interior`: 内装
 * - `damage`: 傷・凹み
 * - `other`: その他
 */
export type BlogPhotoPosition = "front" | "rear" | "left" | "right" | "engine" | "interior" | "damage" | "other";

/**
 * 社内用写真の基本情報
 */
export interface InternalPhoto {
  /** 写真ID */
  id: string;
  /** 写真の種類 */
  type: InternalPhotoType;
  /** 写真のURL */
  url: string;
  /** Google DriveのファイルID（オプション） */
  fileId?: string;
  /** 写真の位置（診断写真の場合） */
  position?: string;
  /** 撮影日時（ISO8601形式） */
  capturedAt?: string;
}

/**
 * ブログ用写真の基本情報
 */
export interface BlogPhoto {
  /** 写真ID */
  id: string;
  /** 写真の位置 */
  position: BlogPhotoPosition;
  /** 写真のURL */
  url: string;
  /** Google DriveのファイルID（オプション） */
  fileId?: string;
  /** 撮影日時（ISO8601形式） */
  capturedAt?: string;
  /** ブログ用に公開済みかどうか */
  published?: boolean;
  /** 公開日時（ISO8601形式） */
  publishedAt?: string;
}

/**
 * 写真の統合型（用途に応じて使い分け）
 */
export type Photo = InternalPhoto | BlogPhoto;

/**
 * 写真の用途を判定
 */
export function isInternalPhoto(photo: Photo): photo is InternalPhoto {
  return "type" in photo && (photo.type === "diagnosis" || photo.type === "before" || photo.type === "after" || photo.type === "general");
}

/**
 * 写真の用途を判定
 */
export function isBlogPhoto(photo: Photo): photo is BlogPhoto {
  return "position" in photo && !("type" in photo);
}

/**
 * JOBカードに表示する写真の優先順位
 * 
 * 1. 診断写真（diagnosis）
 * 2. 作業前写真（before）
 * 3. 作業後写真（after）
 * 4. その他の作業写真（general）
 * 
 * 注意: ブログ用写真はJOBカードには表示しない
 */
export const JOB_CARD_PHOTO_PRIORITY: InternalPhotoType[] = [
  "diagnosis",
  "before",
  "after",
  "general",
];









