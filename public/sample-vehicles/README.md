# サンプル車両画像

このフォルダには、JOBカードに表示するサンプル車両画像を配置します。

## 画像ファイル名

以下の画像ファイルを配置してください：

1. `peugeot-307-sw.jpg` - プジョー307 SW（濃い緑色のステーションワゴン）
2. `lancia-delta-integrale.jpg` - ランチア デルタ インテグラーレ（赤色のスポーツカー）
3. `toyota-yaris-grmn.jpg` - トヨタ ヤリス GRMN（白と黒のハッチバック）
4. `peugeot-2008.jpg` - プジョー2008（深紅色のクロスオーバーSUV）
5. `ford-mustang.jpg` - フォード マスタング（赤色のスポーツカー、白いストライプ付き）
6. `bmw-1-series.jpg` - BMW 1シリーズ（赤色のハッチバック）
7. `citroen-saxo.jpg` - シトロエン サクソ（深紅色のハッチバック）

## 使用方法

開発環境（`NODE_ENV === "development"`）でのみ、車両名に基づいて自動的にサンプル画像が表示されます。

車両名に以下のキーワードが含まれている場合、対応する画像が表示されます：
- "プジョー" + "307" → `peugeot-307-sw.jpg`
- "ランチア" または "lancia" → `lancia-delta-integrale.jpg`
- "ヤリス" または "yaris" → `toyota-yaris-grmn.jpg`
- "プジョー" + "2008" → `peugeot-2008.jpg`
- "マスタング" または "mustang" → `ford-mustang.jpg`
- "bmw" または "ビーエムダブリュー" → `bmw-1-series.jpg`
- "シトロエン" または "saxo" → `citroen-saxo.jpg`

## 注意事項

- 本番環境では、サンプル画像は表示されません
- 実際の診断写真や作業写真がある場合は、そちらが優先されます



