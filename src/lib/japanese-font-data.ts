/**
 * 日本語フォントデータ（Noto Sans JP）
 * 
 * このファイルには、Base64エンコードされた日本語フォントデータを含めます。
 * 
 * フォントファイルの準備方法:
 * 1. Google FontsからNoto Sans JPをダウンロード
 *    https://fonts.google.com/noto/specimen/Noto+Sans+JP
 * 2. フォントファイル（.ttf）をBase64エンコード
 * 3. 以下の定数にBase64エンコードされたデータを設定
 * 
 * Base64エンコード方法（Node.js）:
 * ```javascript
 * const fs = require('fs');
 * const fontData = fs.readFileSync('NotoSansJP-Regular.ttf');
 * console.log(fontData.toString('base64'));
 * ```
 * 
 * 注意: 完全なフォントファイルは大きい（数MB）ため、
 * 軽量なサブセットフォントを使用することを推奨します。
 */

// TODO: フォントファイルをBase64エンコードしてここに配置してください
// 現在は空文字列のため、フォントが読み込まれません
export const NOTO_SANS_JP_REGULAR = "";

// フォントが読み込まれたかどうかをチェック
export function isJapaneseFontAvailable(): boolean {
  return NOTO_SANS_JP_REGULAR.length > 0;
}



