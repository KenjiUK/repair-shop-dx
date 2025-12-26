/**
 * アプリケーションのバージョン情報
 * package.jsonから自動的に取得
 */

// package.jsonからバージョンを取得
// ビルド時に静的に解決されるため、動的インポートは不要
let appVersion: string;
let appName: string;

try {
  // Next.jsのビルド時にはpackage.jsonが読み込める
  const packageJson = require("../../package.json");
  appVersion = packageJson.version || "0.1.0";
  appName = packageJson.name || "repair-shop-dx";
} catch (error) {
  // フォールバック（開発時など）
  appVersion = "0.1.0";
  appName = "repair-shop-dx";
}

/**
 * アプリケーションのバージョン
 * 例: "1.0.0-beta.1"
 */
export const APP_VERSION = appVersion;

/**
 * アプリケーション名
 */
export const APP_NAME = appName;

/**
 * アプリケーションの表示名
 */
export const APP_DISPLAY_NAME = "デジタルガレージ";

/**
 * 環境情報
 */
export const APP_ENV = process.env.NODE_ENV === "production" ? "production" : "development";

/**
 * バージョン情報を取得（表示用）
 * 例: "デジタルガレージ v1.0.0-beta.1"
 */
export function getVersionString(): string {
  return `${APP_DISPLAY_NAME} v${APP_VERSION}`;
}

/**
 * バージョン情報を取得（短縮版）
 * 例: "v1.0.0-beta.1"
 */
export function getShortVersionString(): string {
  return `v${APP_VERSION}`;
}

/**
 * バージョンがプレリリースかどうか
 */
export function isPreRelease(): boolean {
  return APP_VERSION.includes("-alpha") || 
         APP_VERSION.includes("-beta") || 
         APP_VERSION.includes("-rc");
}

/**
 * バージョンがベータ版かどうか
 */
export function isBeta(): boolean {
  return APP_VERSION.includes("-beta");
}

/**
 * バージョンが本番環境かどうか
 */
export function isProduction(): boolean {
  return APP_ENV === "production" && !isPreRelease();
}




