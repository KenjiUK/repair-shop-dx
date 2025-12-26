# 日本語フォントのセットアップガイド

## 問題

jsPDFの標準フォント（Helvetica）では日本語が文字化けします。日本語を正しく表示するには、日本語フォントを追加する必要があります。

## 解決方法

### 方法1: フォントファイルをBase64エンコードして埋め込む（推奨）

1. **フォントファイルの取得**
   - Google Fontsから「Noto Sans JP」または「Source Han Sans」をダウンロード
   - 軽量なサブセットフォントを使用することを推奨

2. **Base64エンコード**
   ```bash
   # Node.jsでBase64エンコード
   node -e "const fs = require('fs'); const data = fs.readFileSync('NotoSansJP-Regular.ttf'); console.log(data.toString('base64'));" > font-base64.txt
   ```

3. **フォントデータを埋め込む**
   - `src/lib/japanese-font-data.ts` を作成
   - Base64エンコードされたフォントデータをエクスポート

4. **jsPDFに追加**
   ```typescript
   import { NOTO_SANS_JP_REGULAR } from "@/lib/japanese-font-data";
   
   doc.addFileToVFS("NotoSansJP-Regular.ttf", NOTO_SANS_JP_REGULAR);
   doc.addFont("NotoSansJP-Regular.ttf", "NotoSansJP", "normal");
   doc.setFont("NotoSansJP");
   ```

### 方法2: 軽量なサブセットフォントを使用

よく使われる文字のみを含むサブセットフォントを作成することで、ファイルサイズを削減できます。

### 方法3: 別のPDF生成ライブラリを使用

- `pdfmake`: 日本語フォントをサポート
- `react-pdf`: React向けのPDF生成ライブラリ

## 現在の状態

現在、フォントファイルが埋め込まれていないため、PDFで日本語が文字化けします。

## 次のステップ

1. フォントファイルを取得
2. Base64エンコード
3. `src/lib/japanese-font-data.ts` に埋め込み
4. `src/lib/work-order-pdf-generator.ts` でフォントを読み込む



