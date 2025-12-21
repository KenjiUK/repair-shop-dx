# Google Driveフォルダ構造の再設計提案

## 現状の問題点

### 現在の構造
```
/repair-shop-dx/jobs/{jobId}/
```

### 問題点

1. **顧客視点での管理が困難**
   - 同じ顧客の複数の来店履歴が散らばる
   - 「田中様の前回の車検はいつ？」を確認するのに、Job IDで検索する必要がある
   - Google Driveで直接見た時に、どの顧客のどの車両か分からない

2. **車両履歴の追跡が困難**
   - 同じ車両の過去のメンテナンス履歴を確認するのが大変
   - 「このBMW X3の過去の点検履歴」を見るのに、複数のJob IDを探す必要がある

3. **業務フローとの不一致**
   - 実際の業務では「顧客→車両→来店履歴」の順で考える
   - 現在の構造は「Job ID→顧客・車両」の逆順になっている

4. **Google Driveでの直接確認が困難**
   - フォルダ名がJob ID（数字の羅列）なので、内容が推測できない
   - 事務員やスタッフがGoogle Driveで直接確認する際に不便

---

## 提案する新しい構造

### 基本構造

```
/repair-shop-dx/
  ├── /master-data/                    # マスタデータCSV/Excelのアップロード先
  ├── /customers/                      # 顧客別フォルダ
  │   └── /{customerId}_{customerName}/  # 顧客ID_顧客名
  │       └── /vehicles/                 # 車両フォルダ
  │           └── /{vehicleId}_{vehicleName}/  # 車両ID_車両名
  │               ├── /documents/        # 車両関連書類
  │               │   ├── shaken_{vehicleId}_{日付}.pdf  # 車検証（最新版）
  │               │   └── shaken_history/  # 車検証履歴（過去の車検証も保存）
  │               └── /jobs/              # 来店履歴（Job）
  │                   └── /{jobDate}_{jobId}/  # 入庫日_JobID
  │                       ├── /wo-{workOrderId}/  # ワークオーダー
  │                       │   ├── diagnosis.json
  │                       │   ├── estimate.json
  │                       │   ├── work.json
  │                       │   ├── /photos/        # 作業記録用写真（元データ）
  │                       │   └── /videos/
  │                       └── invoice.pdf  # 統合請求書（Job全体）
  └── /blog-photos/                    # ブログ用写真フォルダ（新規追加）
      ├── /by-date/                    # 日付別
      │   └── /YYYYMM/                 # 年月別
      │       └── /YYYYMMDD/           # 日付別
      ├── /by-service/                 # 作業種類別
      │   ├── /車検/
      │   ├── /12ヵ月点検/
      │   ├── /オイル交換/
      │   ├── /コーティング/
      │   └── ...
      ├── /by-vehicle-type/            # 車種別
      │   ├── /BMW/
      │   ├── /メルセデス/
      │   ├── /アウディ/
      │   └── ...
      └── /before-after/               # Before/After別
          ├── /before/
          └── /after/
```

### 具体例

```
/repair-shop-dx/
  ├── /master-data/
  │   ├── 車両マスタ_20250115.csv
  │   └── 顧客マスタ_20250115.xlsx
  ├── /customers/
  │   └── /K1001_田中太郎/
  │       └── /vehicles/
  │           ├── /V001_BMW_X3_世田谷580た9012/
  │           │   ├── /documents/  # 車両関連書類
  │           │   │   ├── shaken_V001_20250115.pdf  # 車検証（最新版、2025年1月15日受付時）
  │           │   │   └── shaken_history/  # 車検証履歴
  │           │   │       ├── shaken_V001_20250115.pdf  # 2025年1月15日受付時
  │           │   │       └── shaken_V001_20231201.pdf  # 2023年12月1日受付時（過去）
  │           │   └── /jobs/
  │           │       ├── /20250115_1234567890123456789/  # 2025年1月15日入庫
  │           │       │   ├── /wo-001/  # 車検
  │           │       │   │   ├── diagnosis.json
  │           │       │   │   ├── estimate.json
  │           │       │   │   ├── work.json
  │           │       │   │   ├── /photos/  # 作業記録用写真（元データ）
  │           │       │   │   │   ├── before_001.jpg
  │           │       │   │   │   ├── after_001.jpg
  │           │       │   │   │   └── diagnosis_001.jpg
  │           │       │   │   └── /videos/
  │           │       │   ├── /wo-002/  # オイル交換
  │           │       │   │   └── ...
  │           │       │   └── invoice.pdf  # 統合請求書
  │           │       └── /20241201_9876543210987654321/  # 2024年12月1日入庫（過去履歴）
  │           │           └── ...
  │           └── /V002_メルセデスCクラス_品川330さ1234/  # 同じ顧客の別の車両
  │               └── /jobs/
  │                   └── ...
  └── /blog-photos/  # ブログ用写真フォルダ
      ├── /by-date/
      │   └── /202501/
      │       └── /20250115/
      │           ├── 20250115_BMW_X3_車検_before_001.jpg
      │           ├── 20250115_BMW_X3_車検_after_001.jpg
      │           └── 20250115_BMW_X3_オイル交換_after_001.jpg
      ├── /by-service/
      │   ├── /車検/
      │   │   ├── 20250115_BMW_X3_車検_before_001.jpg
      │   │   └── 20250115_BMW_X3_車検_after_001.jpg
      │   └── /オイル交換/
      │       └── 20250115_BMW_X3_オイル交換_after_001.jpg
      ├── /by-vehicle-type/
      │   └── /BMW/
      │       ├── 20250115_BMW_X3_車検_before_001.jpg
      │       └── 20250115_BMW_X3_車検_after_001.jpg
      └── /before-after/
          ├── /before/
          │   └── 20250115_BMW_X3_車検_before_001.jpg
          └── /after/
              ├── 20250115_BMW_X3_車検_after_001.jpg
              └── 20250115_BMW_X3_オイル交換_after_001.jpg
```

---

## 新しい構造の利点

### 1. 顧客視点での管理が容易

**業務シナリオ**: 「田中様の前回の車検はいつ？」

**現在の構造**:
1. Zoho CRMで顧客IDを検索
2. 関連するJob IDを取得
3. 各Job IDのフォルダを確認
4. 車検のWorkOrderを探す

**新しい構造**:
1. `/customers/K1001_田中太郎/` にアクセス
2. 車両フォルダを確認
3. `/jobs/` フォルダ内の日付順で履歴を確認
4. 目的のJobフォルダを開く

### 2. 車両履歴の追跡が容易

**業務シナリオ**: 「このBMW X3の過去の点検履歴を確認したい」

**現在の構造**:
1. 車両IDでZoho CRMを検索
2. 関連するJob IDを取得
3. 各Job IDのフォルダを確認

**新しい構造**:
1. `/customers/K1001_田中太郎/vehicles/V001_BMW_X3_世田谷580た9012/jobs/` にアクセス
2. 日付順に並んだフォルダで履歴を一覧確認

### 3. Google Driveでの直接確認が容易

**業務シナリオ**: 事務員がGoogle Driveで直接ファイルを確認したい

**現在の構造**:
- フォルダ名: `1234567890123456789` → 内容が分からない

**新しい構造**:
- フォルダ名: `K1001_田中太郎/vehicles/V001_BMW_X3_世田谷580た9012/jobs/20250115_1234567890123456789`
- 一目で「田中太郎様のBMW X3、2025年1月15日入庫」と分かる

### 4. 業務フローとの一致

**実際の業務フロー**:
1. 顧客が来店
2. 顧客情報を確認（既存顧客か新規顧客か）
3. 車両情報を確認（既存車両か新規車両か）
4. 今回の作業内容を確認

**フォルダ構造**:
- 顧客 → 車両 → 来店履歴（Job） → 作業（WorkOrder）

**完全に一致！**

### 5. データの集約と整理

- 同じ顧客のすべての来店履歴が一箇所に集約
- 同じ車両のすべての履歴が一箇所に集約
- 時系列で整理される（日付順）

---

## 実装上の考慮事項

### 1. Job IDでの直接アクセス

**問題**: アプリ側でJob IDから直接フォルダにアクセスする必要がある

**解決策**:
- Zoho CRMの`field19`（お客様共有フォルダ）に完全なフォルダパスを保存
- 例: `https://drive.google.com/drive/folders/xxx` または `/customers/K1001_田中太郎/vehicles/V001_BMW_X3_世田谷580た9012/jobs/20250115_1234567890123456789`
- アプリ側でJob IDから顧客ID・車両IDを取得し、フォルダパスを構築

### 2. 顧客名・車両名の変更

**問題**: フォルダ名に顧客名・車両名を含めると、名前変更時に問題が発生する可能性

**解決策**:
- フォルダ名の主要部分はID（`K1001`, `V001`）を使用
- 名前部分（`_田中太郎`, `_BMW_X3_世田谷580た9012`）は補助情報として使用
- 名前が変更されても、IDが同じであれば問題なし
- 必要に応じてフォルダ名を更新するスクリプトを用意

### 3. フォルダ名の長さ制限

**問題**: Google Driveのフォルダ名には長さ制限がある（255文字）

**解決策**:
- 車両名が長い場合は省略（例: `V001_BMW_X3_世田谷580た9012` → `V001_BMW_X3`）
- または、車両名部分を短縮（登録番号のみなど）

### 4. パフォーマンス

**問題**: 深い階層構造によるアクセス速度への影響

**解決策**:
- アプリ側でフォルダパスをキャッシュ（Zoho CRMの`field19`に保存）
- 直接アクセス用のインデックスファイルを作成（オプション）

### 5. 車検証の管理

**問題**: 車検証は車両に関連する情報で、複数の来店履歴で参照される可能性がある

**解決策**:
- **車両フォルダの`/documents/`に保存**
  - 最新版: `/customers/{customerId}/vehicles/{vehicleId}/documents/shaken_{vehicleId}_{日付}.pdf`
  - 履歴: `/customers/{customerId}/vehicles/{vehicleId}/documents/shaken_history/shaken_{vehicleId}_{日付}.pdf`
- **アップロード時の処理**:
  1. 新しい車検証がアップロードされたら、既存の最新版を`shaken_history/`に移動
  2. 新しい車検証を`/documents/`直下に保存（最新版として）
  3. Zoho CRMの`field12`（関連ファイル）には、最新版のURLを保存（または参照）
- **命名規則**: `shaken_{vehicleId}_{受付日}.{拡張子}`
  - 例: `shaken_V001_20250115.pdf`
  - 日付は車検証を受付した日（Jobの入庫日）

**業務フロー**:
1. **受付時**: 顧客から車検証を受け取る
2. **アップロード**: アプリで車検証を撮影・アップロード
3. **保存処理**: 
   - 既存の最新版があれば`shaken_history/`に移動
   - 新しい車検証を`/documents/`直下に保存
4. **参照**: 以降の来店時は、車両フォルダの`/documents/`から最新の車検証を参照

**アプリ側の実装例**:
```typescript
// 車検証をアップロード
async function uploadShaken(
  vehicleId: string,
  customerId: string,
  jobDate: string,
  file: File
): Promise<string> {
  // 1. 車両フォルダのパスを構築
  const vehicleFolderPath = `/customers/${customerId}/vehicles/${vehicleId}`;
  const documentsFolderPath = `${vehicleFolderPath}/documents`;
  const historyFolderPath = `${documentsFolderPath}/shaken_history`;
  
  // 2. 既存の最新版を確認
  const existingShaken = await findLatestShaken(documentsFolderPath);
  
  // 3. 既存の最新版を履歴フォルダに移動
  if (existingShaken) {
    const historyFileName = existingShaken.name; // ファイル名はそのまま
    await moveFile(existingShaken.id, historyFolderPath, historyFileName);
  }
  
  // 4. 新しい車検証をアップロード
  const newFileName = `shaken_${vehicleId}_${jobDate}.pdf`;
  const newShakenUrl = await uploadFile(file, documentsFolderPath, newFileName);
  
  // 5. Zoho CRMのfield12を更新（最新版のURLを保存）
  await updateZohoJobField12(jobId, newShakenUrl);
  
  return newShakenUrl;
}
```

### 6. ブログ用写真の管理

**問題**: ブログ担当者が記事に使いたい写真を探しやすくする必要がある

**解決策**:
- **ブログ用専用フォルダ**（`/blog-photos/`）を作成
- **複数の分類方法**を提供（日付別、作業種類別、車種別、Before/After別）
- **アプリ側で「ブログ用に公開」ボタン**を実装
  - 写真を選択して「ブログ用に公開」をクリック
  - 元の写真は作業記録として残し、ブログ用フォルダにコピー
  - 複数の分類フォルダに同時にコピー（日付別、作業種類別など）
- **写真の命名規則**: `{日付}_{車種}_{作業種類}_{種類}_{連番}.{拡張子}`
  - 例: `20250115_BMW_X3_車検_before_001.jpg`
  - 例: `20250115_BMW_X3_オイル交換_after_001.jpg`

**ブログ用写真の命名規則**:

| **要素** | **形式** | **例** | **備考** |
| --- | --- | --- | --- |
| 日付 | `YYYYMMDD` | `20250115` | 撮影日または入庫日 |
| 車種 | `{メーカー}_{車種}` | `BMW_X3` | スペースはアンダースコアに変換 |
| 作業種類 | `{入庫区分}` | `車検`, `オイル交換`, `コーティング` | 12種類の入庫区分 |
| 種類 | `before`, `after`, `diagnosis`, `work` | `before`, `after` | 写真の種類 |
| 連番 | `{3桁連番}` | `001`, `002` | 同じ条件の写真が複数ある場合 |

**命名例**:
- `20250115_BMW_X3_車検_before_001.jpg`
- `20250115_BMW_X3_車検_after_001.jpg`
- `20250115_メルセデスCクラス_オイル交換_after_001.jpg`
- `20250115_アウディA4_コーティング_before_001.jpg`

**アプリ側の実装**:
1. **写真選択画面**: 作業完了後、写真一覧を表示
2. **「ブログ用に公開」ボタン**: 選択した写真にチェックを付けて公開
3. **自動コピー処理**: 
   - 元の写真は作業記録として残す
   - ブログ用フォルダに複数の分類でコピー
   - ファイル名を自動的にリネーム（上記の命名規則に従う）
4. **メタデータの記録**: JSONファイルに「ブログ用に公開済み」フラグを記録

---

## 命名規則の詳細

### フォルダ名の命名規則

| **階層** | **命名規則** | **例** | **備考** |
| --- | --- | --- | --- |
| 顧客フォルダ | `{customerId}_{customerName}` | `K1001_田中太郎` | 顧客IDは必須、名前は補助 |
| 車両フォルダ | `{vehicleId}_{vehicleName}` | `V001_BMW_X3_世田谷580た9012` | 車両IDは必須、名前は補助 |
| 車両書類フォルダ | `documents` | `documents` | 車両関連書類（車検証など） |
| 車検証履歴フォルダ | `shaken_history` | `shaken_history` | 過去の車検証を保存 |
| Jobフォルダ | `{jobDate}_{jobId}` | `20250115_1234567890123456789` | 日付（YYYYMMDD）+ Job ID |
| WorkOrderフォルダ | `wo-{連番}` | `wo-001`, `wo-002` | 連番（001, 002, ...） |

### ファイル名の命名規則

#### 車両関連書類

| **ファイル種別** | **命名規則** | **例** | **保存場所** |
| --- | --- | --- | --- |
| 車検証（最新版） | `shaken_{vehicleId}_{日付}.{拡張子}` | `shaken_V001_20250115.pdf` | `/customers/.../{vehicleId}/documents/` |
| 車検証（履歴） | `shaken_{vehicleId}_{日付}.{拡張子}` | `shaken_V001_20250115.pdf` | `/customers/.../{vehicleId}/documents/shaken_history/` |

**注意事項**:
- 車検証は**車両フォルダの`/documents/`**に保存します
- 最新版は`/documents/`直下に保存（常に最新の車検証を参照可能）
- 過去の車検証は`/documents/shaken_history/`に保存（履歴として保持）
- 新しい車検証がアップロードされたら、既存の最新版を`shaken_history/`に移動してから新しいものを保存

#### 作業記録用ファイル（元データ）

| **ファイル種別** | **命名規則** | **例** | **保存場所** |
| --- | --- | --- | --- |
| 診断JSON | `diagnosis.json` | `diagnosis.json` | `/customers/.../wo-{workOrderId}/` |
| 見積JSON | `estimate.json` | `estimate.json` | `/customers/.../wo-{workOrderId}/` |
| 作業JSON | `work.json` | `work.json` | `/customers/.../wo-{workOrderId}/` |
| 請求書PDF | `invoice.pdf` または `{日付}_{顧客名}_請求書.pdf` | `20250115_田中太郎_請求書.pdf` | `/customers/.../{jobDate}_{jobId}/` |
| 写真（作業記録用） | `{種類}_{連番}.{拡張子}` | `before_001.jpg`, `after_001.jpg` | `/customers/.../wo-{workOrderId}/photos/` |
| 動画 | `{種類}_{連番}.{拡張子}` | `diagnosis_001.mp4` | `/customers/.../wo-{workOrderId}/videos/` |

#### ブログ用写真（公開用）

| **ファイル種別** | **命名規則** | **例** | **保存場所** |
| --- | --- | --- | --- |
| ブログ用写真 | `{日付}_{車種}_{作業種類}_{種類}_{連番}.{拡張子}` | `20250115_BMW_X3_車検_before_001.jpg` | `/blog-photos/by-date/YYYYMM/YYYYMMDD/`<br>`/blog-photos/by-service/{作業種類}/`<br>`/blog-photos/by-vehicle-type/{メーカー}/`<br>`/blog-photos/before-after/{種類}/` |

**注意**: ブログ用写真は**元の写真をコピー**して保存します。元の写真は作業記録として残します。

---

## 移行計画

### Phase 1: 新規Jobの新構造適用

- 新規に作成されるJobから新しい構造を使用
- 既存のJobは旧構造のまま（後で移行）

### Phase 2: 既存Jobの移行

- 既存のJobフォルダを新しい構造に移行
- Zoho CRMの`field19`を更新

### Phase 3: 旧構造の削除

- 移行が完了したら旧構造のフォルダを削除（またはアーカイブ）

---

## ブログ用写真の管理ワークフロー

### 業務フロー

1. **整備士が作業中に写真を撮影**
   - Before/After写真、診断写真、作業写真を撮影
   - 写真は作業記録として各ワークオーダーの`/photos/`フォルダに保存

2. **作業完了後、写真を確認**
   - アプリの作業完了画面で写真一覧を表示
   - 整備士またはフロントスタッフが「ブログ用に良い写真」を選択

3. **「ブログ用に公開」ボタンをクリック**
   - 選択した写真にチェックを付けて「ブログ用に公開」ボタンをクリック
   - アプリが自動的に以下を実行:
     - 元の写真をコピー（元の写真は作業記録として残す）
     - ブログ用フォルダに複数の分類で保存:
       - `/blog-photos/by-date/YYYYMM/YYYYMMDD/`
       - `/blog-photos/by-service/{作業種類}/`
       - `/blog-photos/by-vehicle-type/{メーカー}/`
       - `/blog-photos/before-after/{種類}/`
     - ファイル名を自動的にリネーム（命名規則に従う）
     - JSONファイルに「ブログ用に公開済み」フラグを記録

4. **ブログ担当者が写真を確認**
   - Google Driveで`/blog-photos/`フォルダにアクセス
   - 目的に応じて分類フォルダを選択:
     - **日付で探す**: `/by-date/202501/20250115/`
     - **作業種類で探す**: `/by-service/車検/`
     - **車種で探す**: `/by-vehicle-type/BMW/`
     - **Before/Afterで探す**: `/before-after/after/`
   - ファイル名から内容が分かる（例: `20250115_BMW_X3_車検_after_001.jpg`）

### アプリ側の実装

#### UIコンポーネント

**作業完了画面に追加**:
```typescript
// 写真選択コンポーネント
<PhotoSelectionGrid
  photos={workPhotos}
  onSelectForBlog={(photoIds) => {
    // ブログ用に公開
    publishPhotosForBlog(photoIds);
  }}
/>
```

**機能**:
- 写真一覧をグリッド表示
- チェックボックスで複数選択可能
- 「ブログ用に公開」ボタン
- 公開済み写真には「公開済み」バッジを表示

#### API実装

```typescript
// ブログ用に写真を公開
async function publishPhotosForBlog(
  photoIds: string[],
  workOrderId: string,
  jobId: string
): Promise<void> {
  // 1. 写真のメタデータを取得
  const photos = await getPhotos(photoIds);
  const workOrder = await getWorkOrder(workOrderId);
  const job = await getJob(jobId);
  
  // 2. 各写真をブログ用フォルダにコピー
  for (const photo of photos) {
    const blogFileName = generateBlogPhotoFileName({
      date: job.arrivalDate,
      vehicleType: job.vehicle.name,
      serviceKind: workOrder.serviceKind,
      photoType: photo.type,
      sequence: photo.sequence
    });
    
    // 複数の分類フォルダにコピー
    await copyPhotoToBlogFolders(photo.url, blogFileName, {
      byDate: true,
      byService: true,
      byVehicleType: true,
      byBeforeAfter: true
    });
  }
  
  // 3. JSONファイルに公開フラグを記録
  await updateWorkOrderJson(workOrderId, {
    blogPublishedPhotos: photoIds
  });
}
```

### ブログ担当者向けの使い方

#### シナリオ1: 「今月の車検の写真を探したい」

1. `/blog-photos/by-service/車検/` にアクセス
2. ファイル名から日付と車種を確認
3. 目的の写真を選択

#### シナリオ2: 「BMWのBefore/After写真を探したい」

1. `/blog-photos/by-vehicle-type/BMW/` にアクセス
2. または `/blog-photos/before-after/after/` にアクセス
3. ファイル名から作業種類を確認
4. 目的の写真を選択

#### シナリオ3: 「特定の日の写真を探したい」

1. `/blog-photos/by-date/202501/20250115/` にアクセス
2. その日のすべての公開写真を確認
3. 目的の写真を選択

---

## 推奨事項

### 推奨: 新しい構造を採用

**理由**:
1. 業務フローと完全に一致
2. 顧客・車両視点での管理が容易
3. Google Driveでの直接確認が容易
4. 長期的なメンテナンス性が向上
5. **ブログ担当者が写真を見つけやすい**（新規追加）

### 実装時の注意点

1. **Zoho CRMの`field19`に完全なフォルダパスを保存**
   - アプリ側でJob IDから直接アクセスできるようにする

2. **フォルダ作成時の自動化**
   - アプリ側でJob作成時に自動的にフォルダ構造を作成
   - 顧客ID・車両IDからフォルダパスを構築

3. **名前変更への対応**
   - 顧客名・車両名が変更されても、IDが同じであれば問題なし
   - 必要に応じてフォルダ名を更新する機能を用意

4. **検索機能の実装**
   - Job IDから顧客ID・車両IDを取得するAPI
   - 顧客ID・車両IDからJob一覧を取得するAPI

5. **ブログ用写真の管理**
   - アプリ側で「ブログ用に公開」機能を実装
   - 複数の分類フォルダに自動的にコピー
   - ファイル名を自動的にリネーム（命名規則に従う）
   - 元の写真は作業記録として残す（削除しない）

6. **車検証の管理**
   - 車両フォルダの`/documents/`に保存
   - アップロード時に既存の最新版を`shaken_history/`に移動
   - 最新版は常に`/documents/`直下に保存（参照しやすくする）
   - Zoho CRMの`field12`には最新版のURLを保存（または参照）

---

## 結論

**新しい構造（顧客→車両→Job）を強く推奨します。**

現在の構造（Job IDベース）は技術的には問題ありませんが、**業務フローと一致せず、長期的なメンテナンス性に課題があります**。

新しい構造により:
- 顧客視点での管理が容易になる
- 車両履歴の追跡が容易になる
- Google Driveでの直接確認が容易になる
- 業務フローと完全に一致する

実装時のオーバーヘッドはありますが、長期的なメリットが大きいと考えます。


















