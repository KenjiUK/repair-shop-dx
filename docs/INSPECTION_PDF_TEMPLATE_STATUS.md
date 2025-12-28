# 12ヶ月点検PDFテンプレート対応状況

**更新日**: 2025-01-XX  
**目的**: PDFテンプレートの記号とデータモデルの対応状況を記録

---

## PDFテンプレートの記号（凡例）

| 記号 | 意味 | データモデルでの対応 | 実装状況 |
|:---:|:---|:---|:---|
| ／ | 該当なし | `InspectionStatus.none` | ✅ 実装済み |
| ○ | 特定整備 | `InspectionStatus.specific` | ✅ 型定義追加済み |
| レ | 点検良好 | `InspectionStatus.good` | ✅ 実装済み |
| × | 交換 | `InspectionStatus.exchange` | ✅ 実装済み |
| A | 調整 | `InspectionStatus.adjust` | ✅ 実装済み |
| T | 締付 | `InspectionStatus.tighten` | ✅ 実装済み |
| C | 清掃 | `InspectionStatus.clean` | ✅ 実装済み |
| L | 給油（水） | `InspectionStatus.lubricate` | ✅ 型定義追加済み |
| △ | 修理 | `InspectionStatus.repair` | ✅ 実装済み |
| P | 省略 | `InspectionStatus.omit` | ✅ 型定義追加済み |

## チェックボックスの凡例

| タイプ | 意味 | データモデルでの対応 | 実装状況 |
|:---:|:---|:---|:---|
| □（実線） | 法定12ヶ月点検項目 | `InspectionItemRedesign.isStatutory: true` | ✅ 型定義追加済み |
| □（点線） | 走行距離によって省略できる項目 | `InspectionItemRedesign.isOmittableByMileage: true` | ✅ 型定義追加済み |
| ■（グレー） | 走行距離によって省略できる項目（トヨタ指定） | `InspectionItemRedesign.isOmittableByMileageToyota: true` | ✅ 型定義追加済み |

## 測定値

| 項目 | データモデルでの対応 | 実装状況 |
|:---|:---|:---|
| CO濃度（%） | `InspectionMeasurements.co` | ✅ 型定義済み |
| HC濃度（ppm） | `InspectionMeasurements.hc` | ✅ 型定義済み |
| ブレーキパッド厚さ（前輪左/右、後輪左/右、mm） | `InspectionMeasurements.brakeFrontLeft`, `brakeFrontRight`, `brakeRearLeft`, `brakeRearRight` | ✅ 型定義済み |
| タイヤ溝深さ（前輪左/右、後輪左/右、mm） | `InspectionMeasurements.tireFrontLeft`, `tireFrontRight`, `tireRearLeft`, `tireRearRight` | ✅ 型定義済み |

## 交換部品

| 項目 | データモデルでの対応 | 実装状況 |
|:---|:---|:---|
| エンジンオイル（L） | `InspectionParts.engineOil` | ✅ 型定義済み |
| オイルフィルター（個） | `InspectionParts.oilFilter` | ✅ 型定義済み |
| ワイパーゴム（個） | `InspectionParts.wiperRubber` | ✅ 型定義済み |
| クリーンエアフィルター（個） | `InspectionParts.airFilter` | ✅ 型定義済み |

## 対応が必要な項目

### 1. 検査項目リストの更新
- [ ] `isOmitted`プロパティを削除
- [ ] `isStatutory`、`isOmittableByMileage`、`isOmittableByMileageToyota`プロパティを各項目に追加
- [ ] 各項目が法定項目かどうかを判定して設定

### 2. UIコンポーネントの更新
- [ ] ボトムナビゲーションにすべての記号ボタンを追加（○、L、Pを含む）
- [ ] ステータス選択UIにすべての記号を表示
- [ ] チェックボックスのスタイル（実線、点線、グレー）を実装

### 3. PDF生成機能
- [ ] 各記号をPDFテンプレートの適切な位置に描画
- [ ] 測定値をPDFテンプレートの入力欄に反映
- [ ] 交換部品をPDFテンプレートの表に反映

---

## 実装優先順位

1. **Phase 1**: データモデルの拡張（✅ 完了）
2. **Phase 2**: UIコンポーネントの実装（進行中）
3. **Phase 3**: 検査項目リストの更新（`isOmitted`の置き換え）
4. **Phase 4**: PDF生成機能の実装





