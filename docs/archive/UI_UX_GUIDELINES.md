# UI/UXガイドライン

## ドキュメント情報

- **作成日**: 2025-01-XX
- **バージョン**: 1.0
- **対象**: すべての入庫区分で使用するUI/UXガイドライン
- **設計方針**: 世界最高のUI/UX、ITコンサルの目線での推奨を元に設計

---

## 1. デザインシステム

### 1-1. カラーパレット

**プライマリカラー**:
- `slate-900`: メインアクション、重要なテキスト
- `slate-600`: サブアクション、セカンダリテキスト
- `slate-500`: アイコン、補助テキスト
- `slate-300`: ボーダー、区切り線

**セマンティックカラー**:
- **成功**: `green-600` (完了・承認)
- **警告**: `amber-600` (注意・保留)
- **エラー**: `red-600` (エラー・却下)
- **情報**: `blue-600` (情報表示)

**背景色**:
- `white`: メイン背景
- `slate-50`: セクション背景
- `slate-100`: カード背景

**使用例**:
```typescript
// メインアクションボタン
<Button className="bg-slate-900 text-white hover:bg-slate-800">
  診断を開始
</Button>

// 成功バッジ
<Badge className="bg-green-600 text-white">
  完了
</Badge>

// 警告メッセージ
<div className="bg-amber-50 border border-amber-200 text-amber-800">
  注意が必要です
</div>
```

### 1-2. タイポグラフィ

**フォントファミリー**:
- サンセリフ: Geist Sans（デフォルト）
- モノスペース: Geist Mono（コード表示用）

**フォントサイズ**:
詳細な文字サイズ体系については、[TOPページデザインシステム](./TOP_PAGE_DESIGN_SYSTEM.md#3-1-文字サイズ階層)を参照してください。

**標準サイズ（概要）**:
- `text-2xl`: ページタイトル（24px）
- `text-xl`: セクションタイトル（20px）
- `text-lg`: サブセクションタイトル（18px）
- `text-base`: 本文（16px）
- `text-sm`: 補助テキスト（14px）
- `text-xs`: ラベル、バッジ（12px）

**詳細なサイズ階層**:

| 階層 | 用途 | サイズ | Tailwindクラス | フォントウェイト | 色 | 実装例 |
|------|------|--------|----------------|------------------|-----|--------|
| **H1** | ページタイトル | 24px | `text-2xl` | `font-bold` | `text-slate-900` | ページメインタイトル（現在未使用） |
| **H2** | セクションタイトル | 20px | `text-xl` | `font-bold` | `text-slate-900` | 「サマリー」「車両一覧」 |
| **H3** | カードタイトル | 18px | `text-lg` | `font-semibold` | `text-slate-900` | ジョブカードの顧客名、サマリーカードタイトル |
| **Body Large** | 重要情報 | 16px | `text-base` | `font-medium` | `text-slate-900` | 車両情報（クリック可能時は`hover:text-blue-600`） |
| **Body** | 本文 | 16px | `text-base` | `font-normal` | `text-slate-700` | 一般的な本文 |
| **Body Small（主要）** | 補助情報 | 14px | `text-sm` | `font-medium` | `text-slate-700` | 入庫日時 |
| **Body Small（補助）** | 補助情報 | 14px | `text-sm` | `font-normal` | `text-slate-600` | タグ、代車、担当整備士、連絡先情報 |
| **Caption** | ラベル・バッジ | 12px | `text-xs` | `font-medium` | 状況に応じた色 | ステータスバッジ、入庫区分バッジ、詳細情報バッジ |
| **Number Large（優先度1）** | 最重要数値 | 20px | `text-xl` | `font-bold` | `text-slate-900` | サマリーカードの件数（入庫待ち、診断待ち） |
| **Number Medium（優先度2-3）** | 通常数値 | 18px | `text-lg` | `font-bold` | `text-slate-900` | サマリーカードの件数（その他のステータス） |

**フォントウェイト**:
- `font-semibold`: 見出し、重要なテキスト
- `font-medium`: ラベル、ボタン、重要情報
- `font-normal`: 本文（デフォルト）
- `font-bold`: 数値、重要な数値

**文字カラー体系**:

| 用途 | カラー | Tailwindクラス | 説明 |
|------|--------|----------------|------|
| **最重要テキスト** | Slate 900 | `text-slate-900` | 顧客名、車両情報、セクションタイトル |
| **重要テキスト** | Slate 700 | `text-slate-700` | 走行距離、時間、タグ、代車、担当整備士 |
| **補助テキスト** | Slate 600 | `text-slate-600` | 連絡先情報、補助的な情報 |
| **弱いテキスト** | Slate 500 | `text-slate-500` | ラベル、メタ情報 |
| **無効テキスト** | Slate 400 | `text-slate-400` | 無効な状態、プレースホルダー |
| **リンクテキスト** | Blue 600 | `text-blue-600` | クリック可能なリンク、ホバー時 |

**使用例**:
```typescript
// ページタイトル
<h1 className="text-2xl font-semibold text-slate-900">
  田中様 BMW X3 車検診断
</h1>

// セクションタイトル
<h2 className="text-xl font-bold text-slate-900">
  診断項目
</h2>

// 重要情報
<p className="text-base font-medium text-slate-900">
  車両情報
</p>

// 本文
<p className="text-base text-slate-700">
  診断結果、特記事項など
</p>

// 補助情報
<span className="text-sm text-slate-600">
  タグ情報
</span>
```

### 1-3. スペーシング

**共通スペーシング**:
- `space-y-6`: セクション間
- `space-y-4`: 項目間
- `space-y-2`: コンポーネント内
- `gap-2`: フレックスアイテム間（小）
- `gap-4`: フレックスアイテム間（中）
- `gap-6`: フレックスアイテム間（大）

**パディング**:
- `p-6`: カード内パディング
- `p-4`: セクション内パディング
- `p-3`: コンポーネント内パディング
- `px-6 py-4`: ボタンパディング

**使用例**:
```typescript
// セクション間
<div className="space-y-6">
  <SectionCard>...</SectionCard>
  <SectionCard>...</SectionCard>
</div>

// 項目間
<div className="space-y-4">
  <ItemCard>...</ItemCard>
  <ItemCard>...</ItemCard>
</div>
```

### 1-4. ボーダーとシャドウ

**ボーダー**:
- `border`: 1px ボーダー
- `border-2`: 2px ボーダー（強調）
- `border-slate-300`: 標準ボーダー
- `border-slate-200`: 薄いボーダー
- `rounded-md`: 角丸（中）
- `rounded-lg`: 角丸（大）
- `rounded-xl`: 角丸（特大）

**シャドウ**:
- `shadow`: 標準シャドウ
- `shadow-md`: 中程度のシャドウ
- `shadow-lg`: 大きなシャドウ

**使用例**:
```typescript
// カード
<Card className="border border-slate-300 rounded-xl shadow">
  ...
</Card>

// ボタン
<Button className="border-2 border-slate-900 rounded-md">
  保存
</Button>
```

### 1-5. アニメーション

**トランジション**:
- `transition-all`: すべてのプロパティ
- `transition-colors`: 色のみ
- `duration-200`: 200ms
- `duration-300`: 300ms

**ホバーエフェクト**:
- `hover:bg-slate-100`: 背景色変更
- `hover:scale-105`: 拡大
- `active:scale-95`: クリック時の縮小

**使用例**:
```typescript
// ボタン
<Button className="transition-all hover:bg-slate-800 active:scale-95">
  クリック
</Button>

// カード
<Card className="transition-all hover:shadow-lg">
  ...
</Card>
```

---

## 2. コンポーネントスタイルガイド

### 2-1. ボタン

**プライマリボタン**:
```typescript
<Button className="bg-slate-900 text-white hover:bg-slate-800 h-10">
  診断を開始
</Button>
```

**セカンダリボタン**:
```typescript
<Button variant="outline" className="border-slate-300">
  キャンセル
</Button>
```

**アイコンボタン**:
```typescript
<Button className="bg-slate-900 text-white hover:bg-slate-800 h-10">
  <Activity className="h-4 w-4" />
  診断を開始
</Button>
```

### 2-2. カード

**基本カード**:
```typescript
<Card className="border border-slate-300 rounded-xl shadow">
  <CardHeader>
    <CardTitle>セクションタイトル</CardTitle>
  </CardHeader>
  <CardContent>
    {/* コンテンツ */}
  </CardContent>
</Card>
```

**情報カード**:
```typescript
<Card className="bg-blue-50 border border-blue-200">
  <CardContent className="p-4">
    <p className="text-blue-800">情報メッセージ</p>
  </CardContent>
</Card>
```

### 2-3. バッジ

**ステータスバッジ**:
```typescript
<Badge className="bg-green-600 text-white">
  完了
</Badge>

<Badge className="bg-amber-600 text-white">
  注意
</Badge>

<Badge className="bg-slate-100 text-slate-700 border border-slate-300">
  入庫待ち
</Badge>
```

### 2-4. 入力フィールド

**テキスト入力**:
```typescript
<FormField label="走行距離" required error={errors.mileage}>
  <Input 
    type="number" 
    value={mileage} 
    onChange={(e) => setMileage(e.target.value)}
    className="w-full"
  />
</FormField>
```

**テキストエリア**:
```typescript
<FormField label="コメント">
  <TextArea
    value={comments}
    onChange={setComments}
    rows={4}
    className="w-full"
  />
</FormField>
```

### 2-5. 進捗バー

**進捗バー**:
```typescript
<div className="w-full bg-slate-200 rounded-full h-2">
  <div 
    className="bg-slate-900 h-2 rounded-full transition-all duration-300"
    style={{ width: `${progress}%` }}
  />
</div>
```

---

## 3. レイアウトパターン

### 3-1. ページレイアウト

**基本構造**:
```typescript
<div className="min-h-screen bg-white">
  <AppHeader />
  <main className="container mx-auto px-4 py-6 max-w-4xl">
    <PageLayout title="タイトル">
      {/* コンテンツ */}
    </PageLayout>
  </main>
</div>
```

### 3-2. セクションレイアウト

**セクション構造**:
```typescript
<div className="space-y-6">
  <SectionCard title="セクション1" icon={<Icon1 />}>
    {/* セクション1のコンテンツ */}
  </SectionCard>
  
  <SectionCard title="セクション2" icon={<Icon2 />}>
    {/* セクション2のコンテンツ */}
  </SectionCard>
</div>
```

### 3-3. フォームレイアウト

**フォーム構造**:
```typescript
<form className="space-y-6">
  <FormField label="項目1" required>
    <Input />
  </FormField>
  
  <FormField label="項目2">
    <TextArea />
  </FormField>
  
  <div className="flex justify-end gap-4">
    <Button variant="outline">キャンセル</Button>
    <Button>保存</Button>
  </div>
</form>
```

---

## 4. アクセシビリティ

### 4-1. WCAG 2.1 AA準拠

**コントラスト比**:
- 本文テキスト: 4.5:1以上
- UIコンポーネント: 3:1以上

**キーボード操作**:
- すべての機能をキーボードで操作可能
- フォーカスインジケーターを明確に表示
- Tab順序が論理的

**スクリーンリーダー**:
- 適切なARIAラベルを設定
- セマンティックHTMLを使用
- 画像にalt属性を設定

### 4-2. 実装例

**ARIAラベル**:
```typescript
<button
  aria-label="診断を開始"
  className="bg-slate-900 text-white"
>
  <Activity className="h-4 w-4" aria-hidden="true" />
  診断を開始
</button>
```

**フォーカス管理**:
```typescript
<Input
  className="focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
  aria-required="true"
  aria-invalid={!!errors.mileage}
/>
```

---

## 5. パフォーマンス

### 5-1. 画像最適化

**画像圧縮**:
- クライアント側で500KB以下に圧縮
- `browser-image-compression`を使用

**実装例**:
```typescript
import imageCompression from "browser-image-compression";

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  
  return await imageCompression(file, options);
}
```

### 5-2. データフェッチング

**SWRを使用したキャッシング**:
```typescript
const { data, error, mutate } = useSWR(
  `/api/jobs/${jobId}`,
  fetcher,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  }
);
```

### 5-3. コード分割

**動的インポート**:
```typescript
const HeavyComponent = dynamic(() => import("./heavy-component"), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

---

## 6. レスポンシブデザイン

### 6-1. ブレークポイント

**Tailwind CSSブレークポイント**:
- `sm`: 640px以上
- `md`: 768px以上
- `lg`: 1024px以上
- `xl`: 1280px以上

### 6-2. モバイルファースト

**実装例**:
```typescript
// モバイル: 1列、デスクトップ: 2列
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Card>...</Card>
  <Card>...</Card>
</div>

// モバイル: 非表示、デスクトップ: 表示
<div className="hidden md:block">
  <Sidebar />
</div>
```

---

## 7. エラーハンドリングUI

### 7-1. エラーメッセージ表示

**フォームエラー**:
```typescript
<FormField 
  label="走行距離" 
  required 
  error={errors.mileage}
>
  <Input 
    type="number" 
    value={mileage}
    aria-invalid={!!errors.mileage}
  />
</FormField>
```

**トースト通知**:
```typescript
import { toast } from "sonner";

// 成功
toast.success("保存しました");

// エラー
toast.error("エラーが発生しました");

// 警告
toast.warning("注意が必要です");
```

### 7-2. ローディング状態

**ローディング表示**:
```typescript
{isLoading ? (
  <Skeleton className="h-10 w-full" />
) : (
  <div>コンテンツ</div>
)}
```

**ボタンのローディング状態**:
```typescript
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      保存中...
    </>
  ) : (
    "保存"
  )}
</Button>
```

---

## 8. インタラクション設計

### 8-1. フィードバック

**即座のフィードバック**:
- ボタンクリック: 視覚的フィードバック（スケール変更）
- フォーム入力: リアルタイムバリデーション
- 保存: トースト通知

### 8-2. 確認ダイアログ

**削除確認**:
```typescript
<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>削除しますか？</DialogTitle>
      <DialogDescription>
        この操作は取り消せません。
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
        キャンセル
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        削除
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 8-3. 音声入力

**音声入力のUXガイドライン**:
- **目的**: 手が汚れている状態でも入力可能にする（整備士の作業環境を考慮）
- **使用場面**: 部品名の入力、コメント入力など
- **最大録音時間**: 30秒（デフォルト）
- **視覚的フィードバック**: 録音中はアイコンとタイマーを表示
- **音声認識**: Web Speech API（ブラウザ標準）または OpenAI Whisper API を使用
- **エラーハンドリング**: 音声認識に失敗した場合は、手動入力に切り替え可能

**実装例**:
```typescript
<AudioInputButton
  onRecognize={(text) => {
    setPartName(text);
    toast.success("音声認識が完了しました");
  }}
  onRecording={(isRecording) => {
    setIsRecording(isRecording);
  }}
  maxDuration={30}
/>
```

**UXのベストプラクティス**:
- 録音ボタンは大きく表示（タッチしやすい）
- 録音中は明確な視覚的フィードバック（アニメーション、タイマー）
- 音声認識結果は確認可能（編集可能）
- 音声認識に失敗した場合、手動入力に簡単に切り替え可能

---

## 9. アイコン使用ガイドライン

### 9-1. アイコンライブラリ

**lucide-reactを使用**:
```typescript
import { 
  Activity, 
  Camera, 
  FileText, 
  Wrench,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
```

### 9-2. アイコンサイズ

詳細なアイコンサイズ体系については、[TOPページデザインシステム](./TOP_PAGE_DESIGN_SYSTEM.md#2-1-標準アイコンサイズ)を参照してください。

**標準サイズ（概要）**:
- `h-3.5 w-3.5` (14px): バッジ内アイコン、第3階層の補助アイコン
- `h-4 w-4` (16px): 第2階層アイコン、ボタン内アイコン（モバイル）、サマリーカード内アイコン
- `h-5 w-5` (20px): 第1階層アイコン、セクションタイトルアイコン、検索バーアイコン、プライマリアクションボタンアイコン（PC）

**詳細なサイズ体系**:

| 用途 | サイズ | Tailwindクラス | 実装例 | 色 |
|------|--------|----------------|--------|-----|
| **カードタイトルアイコン** | 20px | `h-5 w-5` | セクションタイトル | `text-slate-600` |
| **第1階層アイコン** | 20px | `h-5 w-5` | 顧客名アイコン（User）、重要な顧客フラグ（Star）、共有フォルダ（Folder） | `text-slate-500`（User, Folder）<br>`text-yellow-500`（Star、アクティブ時）<br>`text-slate-300`（Star、非アクティブ時） |
| **第2階層アイコン（主要）** | 16px | `h-4 w-4` | 車両情報（Car）、入庫日時（Clock） | `text-slate-500` |
| **第2階層アイコン（補助）** | 14px | `h-3.5 w-3.5` | タグ（Tag）、代車（CarFront）、担当整備士（Wrench） | `text-slate-500` |
| **入庫区分バッジ内アイコン** | 14px | `h-3.5 w-3.5` | 入庫区分バッジ内のアイコン | カテゴリー別色（Cyan/Emerald/Orange/Rose/Violet） |
| **サマリーカードステータスアイコン** | 16px | `h-4 w-4` | ステータス項目のアイコン | ステータス別色（Blue/Orange/Indigo/Amber/Green） |
| **検索バーアイコン** | 20px | `h-5 w-5` | 検索アイコン（Search） | `text-slate-500` |
| **プライマリアクションボタンアイコン（PC）** | 20px | `h-5 w-5` | プライマリアクションボタン内アイコン | `text-white` |
| **プライマリアクションボタンアイコン（モバイル）** | 16px | `h-4 w-4` | モバイル用プライマリアクションボタン内アイコン | `text-white` |

**使用例**:
```typescript
// プライマリアクションボタン（PC）
<Button className="bg-blue-600 text-white h-12">
  <Activity className="h-5 w-5" />
  診断を開始
</Button>

// 第2階層アイコン
<div className="flex items-center gap-1.5">
  <Car className="h-4 w-4 text-slate-500 shrink-0" />
  <span>BMW X3</span>
</div>

// バッジ内アイコン
<Badge>
  <ShieldCheck className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
  車検
</Badge>
```

### 9-3. アイコンカラー体系

詳細なアイコンカラー体系については、[TOPページデザインシステム](./TOP_PAGE_DESIGN_SYSTEM.md#2-2-アイコンカラー体系詳細)を参照してください。

**主要なカラー体系**:

| カテゴリー | 用途 | カラー | Tailwindクラス | 実装例 |
|-----------|------|--------|----------------|--------|
| **デフォルト情報アイコン** | 一般的な情報表示 | Slate 500 | `text-slate-500` | User, Car, Clock, Tag, Folder, CarFront, Wrench |
| **重要な顧客フラグ（アクティブ）** | Starアイコン（マーク済み） | Yellow 500 | `text-yellow-500 hover:text-yellow-600` | 重要な顧客としてマーク済み |
| **重要な顧客フラグ（非アクティブ）** | Starアイコン（未マーク） | Slate 300 | `text-slate-300 hover:text-yellow-400` | 未マーク状態 |
| **クリック可能アイコン** | リンク・ボタン | Slate 500 → Blue 600 | `text-slate-500 hover:text-blue-600` | Folderアイコン、クリック可能な車両情報 |
| **入庫区分カテゴリー色** | 点検・検査系 | Cyan 600 | `text-cyan-600` | ShieldCheck, CalendarCheck（車検、12ヵ月点検） |
| | メンテナンス系 | Emerald 600 | `text-emerald-600` | Droplet, Circle, Wrench（エンジンオイル交換、タイヤ、その他メンテナンス） |
| | 修理・整備系 | Orange 600 | `text-orange-600` | Wrench, Paintbrush（修理・整備、板金・塗装） |
| | 診断・トラブル系 | Rose 600 | `text-rose-600` | Activity（故障診断） |
| | カスタマイズ・特殊作業系 | Violet 600 | `text-violet-600` | Sparkles, Zap, Package, Shield（レストア、チューニング、パーツ取付、コーティング） |
| **ステータスカラー** | 入庫待ち | Blue 600 | `text-blue-600` | Clockアイコン |
| | 診断待ち | Orange 600 | `text-orange-600` | Activityアイコン |
| | 見積作成待ち | Indigo 600 | `text-indigo-600` | FileTextアイコン |
| | お客様承認待ち | Amber 600 | `text-amber-600` | UserCheckアイコン |
| | 作業待ち | Orange 600 | `text-orange-600` | Wrenchアイコン |
| | 引渡待ち | Green 600 | `text-green-600` | Carアイコン |

---

## 10. 更新履歴

- 2025-01-XX: 初版作成
- 2025-01-XX: アイコンサイズ体系とカラー体系の詳細を追加、タイポグラフィの詳細なサイズ階層とカラー体系を追加

---

## 11. 関連ドキュメント

- [統合仕様書](./INTEGRATED_SPECIFICATION.md)
- [共通コンポーネントライブラリ](./COMMON_COMPONENTS_LIBRARY.md)
- [実装ガイド](./IMPLEMENTATION_GUIDE.md)

































