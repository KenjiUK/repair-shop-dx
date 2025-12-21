# CompactJobHeader デザイン仕様

## ドキュメント情報

- **作成日**: 2025-01-XX
- **バージョン**: 2.0
- **目的**: TOPページ以外のページで使用するコンパクトな案件ヘッダーの設計仕様
- **ベース**: [JobCard](./TOP_PAGE_DESIGN_SYSTEM.md)の情報階層

---

## 1. 設計方針

### 1-1. JobCardの情報階層をベースに設計

JobCardの情報階層を参考に、コンパクトなヘッダーを設計しました。

**JobCardの情報階層**:
- 第1階層: 顧客名 + ステータスバッジ
- 第2階層: 車両情報、入庫区分、時間、タグ（横並び）
- 第3階層: 代車・担当整備士、連絡先情報

**CompactJobHeaderの情報階層**:
- 第1階層: 顧客名 + 重要な顧客フラグ + お客様共有フォルダ + ステータスバッジ + 戻るボタン
- 第2階層: 車両情報、入庫区分、入庫日時（横並び、モバイルでは折り返し）
- 第3階層: 現在の作業、担当整備士、代車、タグ（該当する場合のみ）

### 1-2. 問題点の解決

**修正前の問題点**:
1. 「作業: 12ヵ月点検」とタイトルが一緒になっている
2. タグが重要でないのに目立つところにある（タイトルと同じ行）

**修正後の解決策**:
1. ページタイトルは別行で表示（h1要素）
2. タグは第3階層に配置（重要度が低いため）
3. 「現在の作業」は第3階層に配置（タイトルとは分離）
4. 入庫区分バッジと重複する場合は「現在の作業」を非表示

---

## 2. 情報階層の詳細

### 2-1. 第1階層: 顧客名 + 重要な顧客フラグ + お客様共有フォルダ + ステータスバッジ + 戻るボタン

**レイアウト**:
```
[Userアイコン] 顧客名 [Starアイコン] [Folderアイコン] [ステータスバッジ] ... [戻るボタン]
```

**スタイル**:
- 顧客名: `text-sm sm:text-base font-semibold text-slate-900`
- 重要な顧客フラグ（Starアイコン）: `h-5 w-5`
  - アクティブ時: `text-yellow-500 hover:text-yellow-600`
  - 非アクティブ時: `text-slate-300 hover:text-yellow-400`
  - クリックでトグル可能
- お客様共有フォルダ（Folderアイコン）: `h-5 w-5 text-slate-500 hover:text-blue-600`
  - `job.field19`が存在する場合のみ表示
  - 外部リンクとして動作
- ステータスバッジ: `text-xs font-medium px-2.5 py-0.5 rounded-full`
- 戻るボタン: `text-sm text-slate-600 hover:text-slate-900`

**表示内容**:
- 顧客名（必須）
- 重要な顧客フラグ（Starアイコン、該当する場合のみ、クリック可能）
- お客様共有フォルダ（Folderアイコン、`job.field19`がある場合のみ）
- ステータスバッジ（必須、色分け）
- 戻るボタン（右側、モバイルではアイコンのみ）

### 2-2. 第2階層: 車両情報、入庫区分、入庫日時

**レイアウト**:
```
[Carアイコン] 車両名 / ナンバー [入庫区分バッジ] [Clockアイコン] MM/DD HH:MM 入庫
```

**スタイル**:
- 車両情報: `text-sm text-slate-700`
- 入庫区分バッジ: `text-xs font-medium px-2.5 py-1 rounded-full`
- 入庫日時: `text-sm text-slate-700`
  - アイコン: `h-4 w-4 text-slate-500`
  - 表示形式: `MM/DD HH:MM 入庫` または `--/-- 00:00 入庫予定`

**表示内容**:
- 車両情報（必須）
- 入庫区分（オプション）
- 入庫日時（必須、日付+時刻形式で表示）
  - 入庫済み: 実際の入庫日時（`job.field22`から取得）
  - 入庫待ち: `--/-- 00:00 入庫予定`として表示

**モバイル対応**:
- `flex-wrap`で折り返し対応
- `gap-1.5 sm:gap-2`でレスポンシブなスペーシング

### 2-3. 第3階層: 現在の作業、担当整備士、代車、タグ

**レイアウト**:
```
[FileTextアイコン] 作業名 [Wrenchアイコン] 担当整備士名 [CarFrontアイコン] 代車名 [Tagアイコン] タグ
```

**スタイル**:
- 現在の作業: `text-sm text-slate-600`
- 担当整備士: `text-sm text-slate-600`
- 代車: `text-sm text-slate-600`
  - アイコン: `h-3.5 w-3.5 text-slate-500`
- タグ: `text-sm text-slate-600`
  - アイコン: `h-3.5 w-3.5 text-slate-500`（重要度が低いため、色をさらに薄く）

**表示内容**:
- 現在の作業（診断ページ・作業ページ・見積ページで使用、入庫区分バッジと重複する場合は非表示）
- 担当整備士（該当する場合のみ）
- 代車（`courtesyCars`から取得、該当する場合のみ）
- タグ（オプション、最後に配置）

**表示条件**:
- `currentWorkOrderName`（重複しない場合）、`assignedMechanic`、`courtesyCar`、または`tagId`が存在する場合のみ表示
- 入庫区分バッジ（`serviceKind`）と現在の作業名（`currentWorkOrderName`）が同じ場合は、現在の作業を非表示
- 代車情報は`courtesyCars` propsから`job.id`で検索して取得

---

## 3. 各ページでの使用例

### 3-1. 診断ページ

```tsx
<AppHeader maxWidthClassName="max-w-2xl">
  {/* ページタイトル */}
  <div className="mb-3">
    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
      <AlertCircle className="h-5 w-5 text-slate-600 shrink-0" />
      車検診断
    </h1>
  </div>
  
  {/* 案件情報 */}
  <CompactJobHeader
    job={job}
    customerName={customerName}
    vehicleName={vehicleName}
    licensePlate={licensePlate}
    tagId={tagId !== "---" ? tagId : undefined}
    serviceKind={serviceKinds.length > 0 ? serviceKinds[0] : undefined}
    currentWorkOrderName={currentWorkOrderName}
    assignedMechanic={job.assignedMechanic}
    backHref="/"
    courtesyCars={courtesyCars}
  />
</AppHeader>
```

### 3-2. 作業ページ

```tsx
<AppHeader maxWidthClassName="max-w-2xl">
  {/* ページタイトル */}
  <div className="mb-3">
    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
      <Wrench className="h-5 w-5 text-slate-600 shrink-0" />
      車検作業
    </h1>
  </div>
  
  {/* 案件情報 */}
  <CompactJobHeader
    job={job}
    customerName={customerName}
    vehicleName={vehicleName}
    licensePlate={licensePlate}
    tagId={tagId || undefined}
    serviceKind={serviceKinds.length > 0 ? serviceKinds[0] : undefined}
    currentWorkOrderName={currentWorkOrderName}
    assignedMechanic={job?.assignedMechanic}
    backHref="/"
  />
</AppHeader>
```

### 3-3. 見積ページ

```tsx
<AppHeader maxWidthClassName="max-w-7xl">
  {/* ページタイトル */}
  <div className="mb-3">
    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
      <Calculator className="h-5 w-5 text-slate-600 shrink-0" />
      見積作成
    </h1>
  </div>
  
  {/* 案件情報 */}
  <CompactJobHeader
    job={job}
    customerName={customerName}
    vehicleName={vehicleName}
    licensePlate={licensePlate}
    tagId={tagId !== "---" ? tagId : undefined}
    serviceKind={serviceKinds.length > 0 ? serviceKinds[0] : undefined}
    currentWorkOrderName={currentWorkOrderName}
    backHref="/"
    courtesyCars={courtesyCars}
  />
</AppHeader>
```

---

## 4. デザインシステムとの整合性

### 4-1. アイコンサイズ

| 階層 | アイコンサイズ | Tailwindクラス | 実装例 |
|------|--------------|----------------|--------|
| 第1階層（User） | 16px | `h-4 w-4` | Userアイコン |
| 第1階層（Star/Folder） | 20px | `h-5 w-5` | Starアイコン（重要な顧客フラグ）、Folderアイコン（共有フォルダ） |
| 第2階層 | 16px | `h-4 w-4` | Car、Clockアイコン |
| 第3階層 | 14px | `h-3.5 w-3.5` | FileText、Wrench、CarFront、Tagアイコン |

### 4-2. 文字サイズ

| 階層 | 文字サイズ | Tailwindクラス | 実装例 |
|------|----------|----------------|--------|
| 第1階層 | 14px/16px | `text-sm sm:text-base` | 顧客名 |
| 第2階層 | 14px | `text-sm` | 車両情報、時間 |
| 第3階層 | 14px | `text-sm` | 現在の作業、担当整備士 |

### 4-3. スペーシング

| 用途 | スペーシング | Tailwindクラス | 実装例 |
|------|------------|----------------|--------|
| 階層間 | 6px | `space-y-1.5` | 第1階層と第2階層の間 |
| 要素間（第2階層） | 6px/8px | `gap-1.5 sm:gap-2` | 車両情報、入庫区分、時間 |
| 要素間（第3階層） | 6px/8px | `gap-1.5 sm:gap-2` | 現在の作業、担当整備士、タグ |

---

## 5. モバイル対応

### 5-1. レスポンシブな表示

- **第1階層**: 常に表示
- **第2階層**: `flex-wrap`で折り返し対応
- **第3階層**: `flex-wrap`で折り返し対応

### 5-2. テキスト折り返し

- 車両情報: `break-words`を使用
- 現在の作業: `break-words`を使用
- 担当整備士: `break-words`を使用

### 5-3. 戻るボタン

- モバイル: アイコンのみ表示（`hidden sm:inline`）
- PC: アイコン + 「戻る」テキスト

---

## 6. 更新履歴

- 2025-01-XX: 初版作成（JobCardの情報階層をベースに設計）
- 2025-01-XX: タグを第2階層の最後に移動、「現在の作業」を第3階層に配置
- 2025-01-XX: タグを第3階層に移動、情報の重複を解消（入庫区分バッジと重複する場合は現在の作業を非表示）
- 2025-01-XX: 第1階層に重要な顧客フラグ（Starアイコン）とお客様共有フォルダ（Folderアイコン）を追加、第2階層の入庫日時を日付+時刻形式に変更、第3階層に代車情報（CarFrontアイコン）を追加

---

## 7. 関連ドキュメント

- [TOPページデザインシステム](./TOP_PAGE_DESIGN_SYSTEM.md)
- [デザインシステム適用計画](./DESIGN_SYSTEM_APPLICATION_PLAN.md)




