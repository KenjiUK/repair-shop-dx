# カラーユニバーサルデザイン対応ガイド

## 概要

本システムは、色覚多様性に対応するため、**カラーユニバーサルデザイン**の原則に基づいて実装されています。

## 基本原則

診断結果の状態表示は、**色だけに依存せず、以下の4つの要素で表現**します：

1. **色（Color）**: 背景色とテキスト色
2. **形状（Shape）**: ボタンの形状（円形、四角形、三角形など）
3. **アイコン（Icon）**: 視覚的なアイコン
4. **テキスト（Text）**: ラベルテキスト

## 状態表示のマッピング

| 状態 | 色 | 形状 | アイコン | テキスト | 境界線スタイル |
| --- | --- | --- | --- | --- | --- |
| OK（正常） | 緑 | 円形（circle） | CheckCircle2 | "OK" | 実線（border-2） |
| 注意 | 黄 | 三角形（triangle） | AlertCircle | "注意" | 破線（border-dashed） |
| 要交換 | 赤 | 四角形（square） | XCircle | "要交換" | 二重線（border-double） |
| 調整 | 青 | 六角形（hexagon） | Wrench | "調整" | 実線（border-2） |
| 清掃 | シアン | ダイヤモンド形（diamond） | Brush | "清掃" | 実線（border-2） |
| 省略 | グレー | 円形（circle） | SkipForward | "省略" | 破線（border-dashed） |
| 該当なし | グレー | 四角形（square） | Minus | "該当なし" | 実線（border） |

## 実装例

### TrafficLightButtonコンポーネント

```tsx
<TrafficLightButton
  status="green"
  currentStatus={currentStatus}
  onClick={() => handleStatusChange("green")}
  showLabel={true} // テキストラベルを表示
/>
```

このコンポーネントは自動的に以下を提供します：
- **色**: 緑色の背景
- **形状**: 円形（`rounded-full`）
- **アイコン**: CheckCircle2アイコン
- **テキスト**: "OK"ラベル
- **境界線**: 実線の緑色境界線

## アクセシビリティ対応

### スクリーンリーダー対応

- `aria-label`に形状情報を含める（例: "OK（円形）"）
- `title`属性に形状情報を含める（ツールチップ表示）

### キーボード操作

- Tabキーでフォーカス移動可能
- Enter/Spaceキーで選択可能
- `aria-pressed`属性で選択状態を通知

## 色覚シミュレーターでの検証

### 推奨ツール

1. **Chrome DevTools**
   - DevTools → Rendering → Emulate vision deficiencies
   - 以下のタイプを検証：
     - Protanopia（1型色覚）
     - Deuteranopia（2型色覚）
     - Tritanopia（3型色覚）

2. **Color Oracle**（デスクトップアプリ）
   - Windows/Mac/Linux対応
   - リアルタイムで色覚シミュレーション

3. **WebAIM Contrast Checker**
   - コントラスト比の検証
   - WCAG 2.1 AA基準（4.5:1以上）を確認

### 検証チェックリスト

- [ ] 色だけでなく、形状でも区別できるか
- [ ] アイコンだけで状態が理解できるか
- [ ] テキストラベルが明確か
- [ ] 境界線スタイルで区別できるか
- [ ] コントラスト比がWCAG 2.1 AA基準を満たしているか
- [ ] スクリーンリーダーで形状情報が読み上げられるか

## ベストプラクティス

1. **複数の手がかりを提供**
   - 色だけに依存しない
   - 形状、アイコン、テキストを組み合わせる

2. **コントラスト比の確保**
   - テキストと背景のコントラスト比は4.5:1以上（WCAG 2.1 AA）
   - 大きなテキスト（18pt以上）は3:1以上

3. **一貫性の維持**
   - 同じ状態は常に同じ形状・アイコン・色を使用
   - 状態間の違いを明確にする

4. **ユーザーテスト**
   - 実際の色覚多様性を持つユーザーにテストしてもらう
   - フィードバックを反映

## 参考資料

- [カラーユニバーサルデザイン機構](https://jfly.uni-koeln.de/color/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)















