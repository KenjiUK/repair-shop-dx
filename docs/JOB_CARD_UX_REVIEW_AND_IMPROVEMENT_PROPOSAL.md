# JOBカードのUI/UXレビューと改善提案

## 現在の実装分析

### 現在の情報構造

#### 1. **ヘッダーエリア（CardHeader）**
- **顧客名**: アイコン + 名前（`text-lg font-semibold`）
- **変更申請バッジ**: 条件付き表示（`bg-amber-50`）
- **ステータスバッジ**: 常時表示（`bg-slate-100`）
- **車両情報**: アイコン + 車名（`text-base font-medium`）
- **入庫区分・時間・タグ**: 横並びバッジ/テキスト
- **代車・担当整備士**: 条件付き表示
- **アクションボタン**: 右側（PC）または下部（モバイル）

#### 2. **コンテンツエリア（CardContent）**
- **作業指示追加ボタン**: 条件付き（作業指示がない場合）
- **お客様入力情報**: 条件付き（`bg-blue-50`）
- **変更申請対応**: 条件付き（`bg-amber-50`）
- **作業指示**: 条件付き（`bg-amber-50`）
- **アクションボタン**: モバイル表示用

### 現在の問題点

#### 1. **情報密度が高い**
- **問題**: すべての情報が一度に表示され、視覚的に圧迫感がある
- **影響**: 
  - 重要な情報（顧客名、ステータス、アクション）が埋もれやすい
  - スクロールが必要な場合、全体像を把握しにくい
  - モバイル表示で特に問題が顕著

#### 2. **重要度が分かりにくい**
- **問題**: すべての情報が同じ視覚的重みで表示されている
- **影響**:
  - ユーザーが次に何をすべきか（アクション）が分かりにくい
  - 緊急度や優先度が視覚的に表現されていない
  - ステータスが重要だが、他の情報と同等に扱われている

#### 3. **アクションの明確化が不十分**
- **問題**: 
  - すべてのアクションボタンが同じスタイル（`bg-slate-900`）
  - 優先度に応じた視覚的強調がない
  - ボタンの位置がPCとモバイルで異なる（一貫性の問題）
- **影響**:
  - ユーザーが次に何をすべきか判断しにくい
  - 緊急度の高いアクションが目立たない

#### 4. **詳細情報の表示方法**
- **問題**: 
  - お客様入力情報、作業指示、変更申請が常に展開されている
  - 長いテキストの場合、カードが非常に長くなる
- **影響**:
  - 一覧表示で多くの情報が表示され、全体像を把握しにくい
  - 必要な情報だけを表示できない

#### 5. **視覚的階層の不足**
- **問題**: 
  - すべての情報が同じレベルで表示されている
  - ステータス、緊急度、優先度が視覚的に表現されていない
- **影響**:
  - ユーザーが重要な情報を素早く識別できない
  - 情報の関連性が分かりにくい

## 2025年のUI/UXベストプラクティス

### 1. **プログレッシブディスクロージャー（Progressive Disclosure）**
- 最重要情報を常に表示
- 詳細情報は折りたたみ可能にする
- ユーザーが必要な情報だけを表示できるようにする

### 2. **視覚的階層の明確化**
- **最重要**: 顧客名、ステータス、アクションボタン
- **重要**: 車両情報、入庫区分、時間
- **詳細**: お客様入力情報、作業指示、変更申請

### 3. **アクションの明確化**
- **プライマリアクション**: 大きく、目立つ色（例: 青、緑）
- **セカンダリアクション**: 小さく、控えめな色（例: グレー）
- **緊急度に応じた色分け**: 緊急（赤）、通常（青）、完了（グレー）

### 4. **カードベースのデザイン**
- 情報を論理的にグループ化
- 各グループを視覚的に分離
- 折りたたみ可能なセクションで情報密度を調整

### 5. **レスポンシブデザイン**
- PCとモバイルで一貫した情報構造
- タッチ操作を考慮したボタンサイズ
- モバイルでの情報密度を最適化

## 改善提案

### 提案A: 折りたたみ可能な詳細セクション（推奨）

#### 実装内容

1. **基本情報エリア（常時表示）**
   - 顧客名
   - ステータスバッジ（視覚的強調）
   - 車両情報
   - 入庫区分・時間・タグ
   - **プライマリアクションボタン**（大きく、目立つ色）

2. **詳細情報エリア（折りたたみ可能）**
   - 「詳細を表示」ボタン/トグル
   - 折りたたみ可能なセクション:
     - お客様入力情報
     - 作業指示
     - 変更申請
     - 代車・担当整備士
     - 作業指示追加ボタン

#### メリット
- 情報密度が大幅に削減される
- 最重要情報（顧客名、ステータス、アクション）が常に見える
- ユーザーが必要な情報だけを表示できる
- 一覧表示で全体像を把握しやすい

### 提案B: 優先度に応じた視覚的強調

#### 実装内容

1. **ステータスバッジの色分け**
   - **緊急・要対応**: 赤系（`bg-red-50 text-red-700 border-red-200`）
     - 「入庫待ち」（受付が必要）
     - 「見積作成待ち」（見積が必要）
     - 「作業待ち」（作業が必要）
   - **進行中**: 青系（`bg-blue-50 text-blue-700 border-blue-200`）
     - 「入庫済み」（診断中）
   - **待機中**: 黄系（`bg-yellow-50 text-yellow-700 border-yellow-200`）
     - 「見積提示済み」（顧客承認待ち）
   - **完了**: グレー系（`bg-gray-50 text-gray-500 border-gray-200`）
     - 「出庫済み」

2. **アクションボタンの優先度別スタイル**
   - **プライマリアクション**（最重要）:
     - サイズ: `h-12`（大きめ）
     - 色: `bg-blue-600 hover:bg-blue-700`（青系）
     - 例: 「受付を開始」「診断を開始」「見積を開始」「作業を開始」
   - **セカンダリアクション**（補助的）:
     - サイズ: `h-10`（標準）
     - 色: `bg-slate-900 hover:bg-slate-800`（現在のスタイル）
     - 例: 「引渡しを開始」
   - **完了状態**:
     - バッジ表示（ボタンなし）
     - 色: `bg-gray-100 text-gray-500`

3. **緊急度インジケーター**
   - 緊急度が高い場合、カードの左側に色付きバーを表示
   - 例: 入庫待ちが長時間経過している場合

#### メリット
- ユーザーが次に何をすべきかが一目で分かる
- 緊急度や優先度が視覚的に表現される
- アクションボタンの重要性が明確になる

### 提案C: アクションの明確化

#### 実装内容

1. **アクションボタンの統一**
   - PCとモバイルで同じ位置・スタイル
   - カードの右上（PC）または下部（モバイル）に統一

2. **ボタンサイズの階層化**
   - **プライマリアクション**: `h-12`（大きめ）
   - **セカンダリアクション**: `h-10`（標準）
   - **テキストリンク**: `text-sm`（小さめ）

3. **アイコンの明確化**
   - 各アクションに対応するアイコンを統一
   - アイコンのサイズを適切に設定（`h-5 w-5`）

#### メリット
- アクションが明確になり、ユーザーが迷わない
- PCとモバイルで一貫した体験
- ボタンの重要性が視覚的に表現される

### 提案D: 情報の階層化

#### 実装内容

1. **第1階層（最重要）**: 常時表示
   - 顧客名
   - ステータスバッジ（色分け）
   - プライマリアクションボタン

2. **第2階層（重要）**: 常時表示
   - 車両情報
   - 入庫区分・時間・タグ

3. **第3階層（詳細）**: 折りたたみ可能
   - お客様入力情報
   - 作業指示
   - 変更申請
   - 代車・担当整備士

#### メリット
- 情報の重要度が明確になる
- ユーザーが必要な情報だけを表示できる
- 一覧表示で全体像を把握しやすい

## 推奨実装

**提案A + 提案B + 提案C + 提案D の組み合わせを推奨**

### 実装詳細

#### 1. **基本構造の変更**

```tsx
<Card className="transition-all hover:shadow-md">
  {/* 第1階層: 最重要情報（常時表示） */}
  <CardHeader className="pb-3">
    <div className="flex items-start justify-between gap-4">
      {/* 左側: 顧客名・ステータス */}
      <div className="flex-1 min-w-0">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <User className="h-5 w-5 text-slate-500" />
          <span className="truncate">{customerName}</span>
          {/* ステータスバッジ（色分け） */}
          <StatusBadge status={job.field5} />
        </CardTitle>
        
        {/* 第2階層: 重要情報（常時表示） */}
        <div className="mt-2 space-y-1.5">
          {/* 車両情報 */}
          <div className="flex items-center gap-2 text-base">
            <Car className="h-4 w-4 text-slate-500" />
            <span className="truncate">{vehicleInfo}</span>
          </div>
          
          {/* 入庫区分・時間・タグ */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* 入庫区分バッジ */}
            {/* 時間 */}
            {/* タグ */}
          </div>
        </div>
      </div>
      
      {/* 右側: プライマリアクション */}
      <div className="hidden sm:block">
        <PrimaryActionButton job={job} />
      </div>
    </div>
  </CardHeader>

  <CardContent className="pt-0">
    {/* 第3階層: 詳細情報（折りたたみ可能） */}
    <CollapsibleDetails
      hasPreInput={hasPreInput}
      hasWorkOrder={hasWorkOrder}
      hasChangeRequest={hasChangeRequest}
      job={job}
    />
    
    {/* モバイル用アクションボタン */}
    <div className="sm:hidden mt-4">
      <PrimaryActionButton job={job} className="w-full" />
    </div>
  </CardContent>
</Card>
```

#### 2. **ステータスバッジの色分け**

```tsx
function StatusBadge({ status }: { status: string }) {
  const getStatusStyle = () => {
    switch (status) {
      case "入庫待ち":
      case "見積作成待ち":
      case "作業待ち":
        return "bg-red-50 text-red-700 border-red-200";
      case "入庫済み":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "見積提示済み":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "出庫済み":
        return "bg-gray-50 text-gray-500 border-gray-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };
  
  return (
    <Badge variant="outline" className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full", getStatusStyle())}>
      {status}
    </Badge>
  );
}
```

#### 3. **プライマリアクションボタン**

```tsx
function PrimaryActionButton({ job, className }: { job: ZohoJob; className?: string }) {
  const getActionConfig = () => {
    switch (job.field5) {
      case "入庫待ち":
        return {
          label: "受付を開始",
          icon: Key,
          href: null,
          onClick: handleCheckIn,
          priority: "high", // プライマリアクション
        };
      case "入庫済み":
        return {
          label: "診断を開始",
          icon: Activity,
          href: `/mechanic/diagnosis/${job.id}`,
          priority: "high",
        };
      case "見積作成待ち":
        return {
          label: "見積を開始",
          icon: FileText,
          href: `/admin/estimate/${job.id}`,
          priority: "high",
        };
      case "作業待ち":
        return {
          label: "作業を開始",
          icon: Wrench,
          href: `/mechanic/work/${job.id}`,
          priority: "high",
        };
      case "出庫待ち":
        return {
          label: "引渡しを開始",
          icon: Car,
          href: `/presentation/${job.id}`,
          priority: "medium", // セカンダリアクション
        };
      default:
        return null;
    }
  };
  
  const config = getActionConfig();
  if (!config) return null;
  
  const isPrimary = config.priority === "high";
  
  return (
    <Button
      asChild={config.href ? true : false}
      onClick={config.onClick}
      className={cn(
        isPrimary 
          ? "bg-blue-600 hover:bg-blue-700 text-white h-12" 
          : "bg-slate-900 hover:bg-slate-800 text-white h-10",
        className
      )}
    >
      {/* ... */}
    </Button>
  );
}
```

#### 4. **折りたたみ可能な詳細セクション**

```tsx
function CollapsibleDetails({ hasPreInput, hasWorkOrder, hasChangeRequest, job }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasDetails = hasPreInput || hasWorkOrder || hasChangeRequest;
  
  if (!hasDetails) return null;
  
  return (
    <div className="mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm text-slate-600 hover:text-slate-900 py-2"
      >
        <span className="flex items-center gap-2">
          <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
          詳細情報
        </span>
        <Badge variant="outline" className="text-xs">
          {[hasPreInput, hasWorkOrder, hasChangeRequest].filter(Boolean).length}件
        </Badge>
      </button>
      
      {isExpanded && (
        <div className="space-y-3 mt-2">
          {/* お客様入力情報 */}
          {hasPreInput && <PreInputSection content={job.field7} />}
          
          {/* 作業指示 */}
          {hasWorkOrder && <WorkOrderSection content={job.field} />}
          
          {/* 変更申請 */}
          {hasChangeRequest && <ChangeRequestSection job={job} />}
        </div>
      )}
    </div>
  );
}
```

## 視覚的な効果

### 改善前
- 情報密度: 高い（すべての情報が一度に表示）
- 重要度: 不明確（すべて同じ視覚的重み）
- アクション: 統一されているが優先度が不明確
- 詳細情報: 常に展開されている

### 改善後
- 情報密度: 低い（最重要情報のみ常時表示）
- 重要度: 明確（階層化と色分け）
- アクション: 優先度に応じた視覚的強調
- 詳細情報: 折りたたみ可能

## 結論

提案A + B + C + Dの組み合わせにより、JOBカードのUI/UXが大幅に改善されます：

1. **情報密度の削減**: 折りたたみ可能な詳細セクションで、最重要情報が常に見える
2. **重要度の明確化**: 階層化と色分けで、ユーザーが重要な情報を素早く識別できる
3. **アクションの明確化**: 優先度に応じた視覚的強調で、ユーザーが次に何をすべきかが分かる
4. **一貫性の向上**: PCとモバイルで一貫した情報構造とアクション配置

この改善により、ユーザーは効率的に案件を処理でき、重要な情報を見逃すことがなくなります。

---

## 現在の実装状況（2025-01-XX更新）

### ✅ 実装済み

以下の改善提案が実装されています：

1. **折りたたみ可能な詳細セクション（提案A）**: ✅ 実装済み
   - 詳細情報（お客様入力情報、作業指示、変更申請、承認済み作業内容）が折りたたみ可能
   - ChevronDownアイコンで展開/折りたたみを制御
   - 詳細情報バッジをクリックして展開可能

2. **アクションの明確化（提案C）**: ✅ 実装済み
   - アクションボタンはステージ別の色分けが実装済み
     - 入庫待ち: `bg-slate-600`
     - 入庫済み: `bg-blue-600`
     - 見積作成待ち: `bg-orange-600`
     - 作業待ち: `bg-emerald-600`
     - 出庫待ち: `bg-violet-600`
   - 優先度に応じたボタンサイズ（high: `h-12`, medium: `h-10`）

3. **情報の階層化（提案D）**: ✅ 実装済み
   - 第1階層に重要な顧客フラグ（Starアイコン）とお客様共有フォルダ（Folderアイコン）を追加
   - 情報階層が明確に定義され、視覚的階層が実現されている

4. **視覚的階層の明確化（提案B）**: ✅ 実装済み
   - 第1階層: 顧客名（`text-lg font-semibold`）、重要な顧客フラグ、共有フォルダ、ステータスバッジ
   - 第2階層: 車両情報（`text-base font-medium`）、入庫区分、入庫日時
   - 第3階層: タグ、代車、担当整備士（`text-sm`）
   - 第4階層: アクションボタン

### 参考情報

詳細なデザイン仕様については、[TOPページデザインシステム](./TOP_PAGE_DESIGN_SYSTEM.md)を参照してください。

- 情報階層の詳細: [セクション1-2. ジョブカードの情報階層](./TOP_PAGE_DESIGN_SYSTEM.md#1-2-ジョブカードの情報階層)
- アイコンサイズ体系: [セクション2-1. 標準アイコンサイズ](./TOP_PAGE_DESIGN_SYSTEM.md#2-1-標準アイコンサイズ)
- アクションボタンの色ルール: [ACTION_BUTTON_COLOR_RULES.md](./ACTION_BUTTON_COLOR_RULES.md)

