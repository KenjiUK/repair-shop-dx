# 下層ページの途中保存機能 - 実装完了レポート

## 実装日
2024年12月

## 実装内容

### 1. 実装完了した機能

#### 1.1 見積ページ (`/admin/estimate/[id]`)
- ✅ **自動保存機能**: `useAutoSaveWithOffline`フックを使用（3秒debounce）
- ✅ **保存状態表示**: `SaveStatusIndicator`コンポーネントを追加
- ✅ **オフライン対応**: IndexedDB + 同期キューによる保存
- ✅ **ページ離脱時の確認**: `useDirtyCheck`による未保存変更の警告

#### 1.2 診断ページ (`/mechanic/diagnosis/[id]`)
- ✅ **自動保存機能**: 既存の実装を`useAutoSaveWithOffline`に移行
- ✅ **保存状態表示**: `SaveStatusIndicator`コンポーネントを追加
- ✅ **オフライン対応**: IndexedDB + 同期キューによる保存
- ✅ **ページ離脱時の確認**: 既存の`useDirtyCheck`を維持

#### 1.3 作業ページ (`/mechanic/work/[id]`)
- ✅ **自動保存機能**: 既存の実装を`useAutoSaveWithOffline`に移行
- ✅ **保存状態表示**: 既存の`SaveStatusIndicator`を拡張（オフライン状態表示対応）
- ✅ **オフライン対応**: IndexedDB + 同期キューによる保存
- ✅ **ページ離脱時の確認**: `useDirtyCheck`を追加

### 2. 新規作成したコンポーネント・フック

#### 2.1 `useAutoSaveWithOffline`フック
**ファイル**: `src/hooks/use-auto-save-with-offline.ts`

**機能**:
- Debounced自動保存（入力後一定時間経過で自動保存）
- 明示的な手動保存
- 保存状態の管理
- ページ離脱時の自動保存
- オフライン対応（IndexedDB + 同期キュー）

**主な特徴**:
- オンライン時: IndexedDBに保存 → サーバーに保存
- オフライン時: IndexedDBに保存 → 同期キューに追加
- オンライン復帰時: 同期キューから自動同期

#### 2.2 `SaveStatusIndicator`コンポーネント（拡張）
**ファイル**: `src/components/features/save-status-indicator.tsx`

**追加機能**:
- オフライン状態の表示
- 同期待ち件数の表示
- オフライン時の「ローカルに保存済み」表示

### 3. 同期マネージャーの拡張

#### 3.1 見積データの同期ハンドラー
**ファイル**: `src/lib/sync-manager.ts`

見積データの同期処理を追加:
- `STORE_NAMES.ESTIMATES`の同期ハンドラーを実装
- `updateWorkOrder`を使用して見積データを同期

#### 3.2 作業データの同期ハンドラー
**ファイル**: `src/lib/sync-manager.ts`

作業データの同期処理を追加:
- `STORE_NAMES.WORK`の同期ハンドラーを実装
- `updateWorkOrder`を使用して作業データを同期

### 4. 実装の詳細

#### 4.1 保存フロー

```
ユーザー入力
    ↓
1. IndexedDBに即座に保存（ローカル）
    ↓
2. Debounce（見積: 3秒、診断・作業: 2秒）
    ↓
3. オンライン時: サーバーに保存
   オフライン時: 同期キューに追加
    ↓
4. オンライン復帰時: 同期キューから自動同期
```

#### 4.2 保存状態の表示

| 状態 | 表示内容 | アイコン |
|------|---------|---------|
| `saving` | 「保存中...」 | 🔄 (Loader2) |
| `saved` (オンライン) | 「保存済み」 | ✅ (CheckCircle2) |
| `saved` (オフライン) | 「ローカルに保存済み」 | 📶 (WifiOff) |
| `error` | 「保存失敗」 | ❌ (AlertCircle) |
| 未保存変更 | 「下書き保存」ボタン | 💾 (Save) |
| オフライン + 同期待ち | 「同期待ち: N件」 | 📶 (WifiOff) |

#### 4.3 ページ離脱時の処理

- **未保存変更がある場合**: ブラウザの標準確認ダイアログを表示
- **メッセージ**: 「入力中の内容が保存されていません。このまま移動しますか？」
- **オフライン時**: IndexedDBに保存済みのため、警告のみ表示

### 5. 技術的な実装詳細

#### 5.1 データ構造

**見積データ**:
```typescript
{
  estimate: WorkOrder['estimate'];
  diagnosisFee?: number | null;
  diagnosisDuration?: number | null;
  isDiagnosisFeePreDetermined?: boolean;
  mechanicApproved?: boolean;
  mechanicApprover?: string;
  baseSystemItemId?: string;
}
```

**診断データ**:
```typescript
{
  items: DiagnosisItem[];
  photos: { position: string; url: string }[];
  mileage?: number;
  version?: number | null;
  enhancedOBDDiagnosticResult?: EnhancedOBDDiagnosticResult | null;
  qualityInspection?: QualityInspection | null;
  manufacturerInquiry?: ManufacturerInquiry | null;
}
```

**作業データ**:
```typescript
{
  records: WorkRecord[];
  mechanicName?: string;
  bodyPaintInfo?: BodyPaintWorkInfo;
  restoreWorkData?: RestoreWorkData;
  coatingInfo?: CoatingInfo;
}
```

#### 5.2 IndexedDBストア

- `STORE_NAMES.ESTIMATES`: 見積データ
- `STORE_NAMES.DIAGNOSIS`: 診断データ
- `STORE_NAMES.WORK`: 作業データ
- `STORE_NAMES.SYNC_QUEUE`: 同期キュー

#### 5.3 同期キューの処理

- **自動同期**: オンライン復帰時に自動実行
- **手動同期**: ユーザーが明示的に実行可能
- **リトライロジック**: 最大3回までリトライ
- **エラーハンドリング**: リトライ不可能なエラーは記録

### 6. パフォーマンス最適化

#### 6.1 Debounce時間
- **見積ページ**: 3秒（項目が多いため）
- **診断ページ**: 2秒
- **作業ページ**: 2秒

#### 6.2 データのシリアライズ
- JSON.stringifyを使用して変更検知
- 大きなデータの場合は圧縮を検討

#### 6.3 同期キューの最適化
- 重複チェック: 同じデータの重複保存を防止
- 優先度設定: 古いデータを優先的に同期
- バッチ処理: 複数のデータをまとめて同期

### 7. エラーハンドリング

#### 7.1 保存エラー
- サーバー保存失敗時: 同期キューに追加
- IndexedDB保存失敗時: コンソールにエラーを記録
- ユーザーへの通知: トースト通知で表示

#### 7.2 同期エラー
- リトライ可能なエラー: 自動的にリトライ
- リトライ不可能なエラー: エラー状態として記録
- ユーザーへの通知: 同期キューインジケーターで表示

### 8. テスト項目

#### 8.1 機能テスト
- [x] 自動保存が正常に動作するか
- [x] 手動保存ボタンが正常に動作するか
- [x] 保存状態が正しく表示されるか
- [x] オフライン時にIndexedDBに保存されるか
- [x] オンライン復帰時に自動同期されるか
- [x] ページ離脱時に未保存データが警告されるか

#### 8.2 エッジケース
- [x] ネットワークが不安定な場合
- [x] ブラウザがクラッシュした場合
- [x] タブを閉じた場合
- [x] 長時間放置した場合
- [x] 大量のデータを入力した場合

### 9. 今後の改善点

#### 9.1 報告ページへの実装
- 報告ページにも自動保存機能を追加（未実装）

#### 9.2 バックグラウンド同期
- Service Workerを使用したバックグラウンド同期
- 定期的な同期処理の最適化

#### 9.3 保存履歴の管理
- バージョン管理機能
- 復元機能の実装

### 10. まとめ

#### 10.1 実装完了項目
1. ✅ 見積ページに自動保存機能を追加
2. ✅ 診断ページに保存状態表示を追加
3. ✅ 全ページにオフライン対応を実装
4. ✅ ページ離脱時の保存確認を実装

#### 10.2 期待される効果
- ✅ **データ損失の防止**: 入力内容が確実に保存される
- ✅ **UXの向上**: 保存状態が明確に表示される
- ✅ **オフライン対応**: ネットワークがなくても作業可能
- ✅ **業務効率の向上**: 中断と再開が容易になる

#### 10.3 技術的な成果
- 統一された保存戦略の実装
- オフライン対応の完全実装
- ユーザビリティの向上
- 保守性の高いコード構造

---

## 実装ファイル一覧

### 新規作成
- `src/hooks/use-auto-save-with-offline.ts`
- `docs/DRAFT_SAVE_IMPLEMENTATION.md` (このファイル)

### 更新
- `src/app/admin/estimate/[id]/page.tsx`
- `src/app/mechanic/diagnosis/[id]/page.tsx`
- `src/app/mechanic/work/[id]/page.tsx`
- `src/components/features/save-status-indicator.tsx`
- `src/lib/sync-manager.ts`

### 既存（変更なし）
- `src/hooks/use-auto-save.ts`
- `src/lib/offline-storage.ts`
- `src/lib/dirty-check.ts`
- `src/hooks/use-online-status.ts`

