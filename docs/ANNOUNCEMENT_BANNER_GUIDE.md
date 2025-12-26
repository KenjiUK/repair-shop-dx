# お知らせバナー操作ガイド

**作成日:** 2025-12-23  
**対象:** 管理者、店長

---

## 📍 お知らせバナーの表示場所

お知らせバナーは、**トップページ（ダッシュボード）のヘッダーの下、サマリーセクションの上**に全画面幅で表示されます。

**表示位置:**
```
┌─────────────────────────────┐
│ ヘッダー（ロゴ + デジタルガレージ）│
├─────────────────────────────┤
│ 【お知らせバナー】 ← ここに表示 │
│ キャンペーン実施中!...      [×] │
├─────────────────────────────┤
│ サマリーセクション            │
│ ┌─────┐ ┌─────┐ ┌─────┐   │
│ │本日の│ │入庫区分│ │整備士│   │
│ │状況  │ │別    │ │別   │   │
│ └─────┘ └─────┘ └─────┘   │
└─────────────────────────────┘
```

---

## ✏️ お知らせの登録方法

お知らせは `src/lib/announcement-config.ts` ファイルで管理されています。

### 1. ファイルを開く

エディタで以下のファイルを開きます：
```
src/lib/announcement-config.ts
```

### 2. お知らせを追加

`getActiveAnnouncements()` 関数内の `announcements` 配列に、新しいお知らせオブジェクトを追加します。

**例:**
```typescript
const announcements: AnnouncementConfig[] = [
  // キャンペーン告知の例（コメントアウトを解除して使用）
  {
    id: "campaign-2025-06",
    message: "キャンペーン実施中!G'ZOXパートナープログラム登録記念、6月末日予約分まで。",
    backgroundColor: "bg-teal-500",
    textColor: "text-white",
    expiresAt: "2025-06-30T23:59:59+09:00",
    priority: 10,
  },
  // 新しいお知らせを追加
  {
    id: "maintenance-2025-12",
    message: "システムメンテナンスのお知らせ: 12月25日 22:00-24:00",
    backgroundColor: "bg-orange-500",
    textColor: "text-white",
    expiresAt: "2025-12-25T23:59:59+09:00",
    priority: 5,
  },
];
```

### 3. パラメータの説明

| パラメータ | 説明 | 必須 | 例 |
|-----------|------|------|-----|
| `id` | お知らせの一意のID（localStorageのキーとして使用） | ✅ | `"campaign-2025-06"` |
| `message` | 表示するメッセージ（1行で表示） | ✅ | `"キャンペーン実施中!..."` |
| `backgroundColor` | バナーの背景色（Tailwind CSSクラス） | ❌ | `"bg-teal-500"`（デフォルト: `bg-teal-500`） |
| `textColor` | テキストの色（Tailwind CSSクラス） | ❌ | `"text-white"`（デフォルト: `text-white`） |
| `expiresAt` | 有効期限（ISO8601形式、`null`で無期限） | ❌ | `"2025-06-30T23:59:59+09:00"` |
| `priority` | 優先度（数値が大きいほど優先、複数表示時の順序） | ❌ | `10`（デフォルト: `0`） |

### 4. 色のカスタマイズ

Tailwind CSSの色クラスを使用できます：

**背景色の例:**
- `bg-teal-500` - ティール（デフォルト）
- `bg-blue-500` - 青
- `bg-green-500` - 緑
- `bg-orange-500` - オレンジ
- `bg-red-500` - 赤
- `bg-purple-500` - 紫

**テキスト色の例:**
- `text-white` - 白（デフォルト）
- `text-gray-900` - 濃いグレー
- `text-blue-900` - 濃い青

---

## 🎯 操作方法

### お知らせバナーの表示

1. **自動表示**: お知らせが登録されている場合、トップページを開くと自動的に表示されます
2. **複数表示**: 複数のお知らせがある場合、優先度順（高い順）に表示されます

### お知らせバナーを閉じる

1. **×ボタンをクリック**: バナーの右上にある×ボタンをクリック
2. **自動保存**: 閉じた状態はブラウザのlocalStorageに保存され、次回からは表示されません

### 閉じたお知らせを再度表示する

ブラウザの開発者ツール（F12）で以下を実行：

```javascript
// 特定のお知らせを再度表示
localStorage.removeItem('announcement-banner-{お知らせID}-closed');

// 例: campaign-2025-06のお知らせを再度表示
localStorage.removeItem('announcement-banner-campaign-2025-06-closed');

// すべてのお知らせを再度表示
Object.keys(localStorage)
  .filter(key => key.startsWith('announcement-banner-') && key.endsWith('-closed'))
  .forEach(key => localStorage.removeItem(key));
```

その後、ページをリロード（F5）してください。

---

## 📝 実装例

### 例1: キャンペーン告知

```typescript
{
  id: "campaign-2025-06",
  message: "キャンペーン実施中!G'ZOXパートナープログラム登録記念、6月末日予約分まで。",
  backgroundColor: "bg-teal-500",
  textColor: "text-white",
  expiresAt: "2025-06-30T23:59:59+09:00",
  priority: 10,
}
```

### 例2: メンテナンス告知

```typescript
{
  id: "maintenance-2025-12-25",
  message: "システムメンテナンスのお知らせ: 12月25日 22:00-24:00",
  backgroundColor: "bg-orange-500",
  textColor: "text-white",
  expiresAt: "2025-12-25T23:59:59+09:00",
  priority: 15, // メンテナンスは高優先度
}
```

### 例3: 無期限のお知らせ

```typescript
{
  id: "important-notice-2025",
  message: "重要: 新しい機能が追加されました。詳細はこちらをご確認ください。",
  backgroundColor: "bg-blue-500",
  textColor: "text-white",
  expiresAt: null, // 無期限
  priority: 5,
}
```

---

## 🔧 技術的な詳細

### ファイル構成

- **設定ファイル**: `src/lib/announcement-config.ts`
- **コンポーネント**: `src/components/features/announcement-banner.tsx`
- **表示場所**: `src/app/page.tsx`（トップページ）

### データの保存場所

- **閉じた状態**: ブラウザのlocalStorage
- **キー形式**: `announcement-banner-{id}-closed`
- **値**: `"true"`（文字列）

### 有効期限の処理

- `expiresAt`が設定されている場合、現在日時と比較して有効期限をチェック
- 期限切れのお知らせは自動的に非表示になります
- `expiresAt`が`null`の場合、無期限で表示されます

### 優先度の処理

- 複数のお知らせがある場合、`priority`の値が大きい順に表示されます
- 同じ優先度の場合は、配列の順序に従います

---

## ⚠️ 注意事項

1. **IDの一意性**: 各お知らせの`id`は一意である必要があります
2. **日時形式**: `expiresAt`はISO8601形式（`YYYY-MM-DDTHH:mm:ss+09:00`）で指定してください
3. **メッセージの長さ**: 1行で表示されるため、長すぎるメッセージは折り返される可能性があります
4. **localStorageの制限**: ブラウザごとにlocalStorageの容量制限があります（通常5-10MB）

---

## 🚀 今後の拡張予定

将来的には以下の機能を追加予定：
- 管理画面からのお知らせ登録
- API経由でのお知らせ管理
- お知らせのクリックで詳細ページへ遷移
- お知らせの統計情報（表示回数、クリック数など）

---

## 📞 サポート

お知らせバナーに関する質問や問題がある場合は、開発チームまでお問い合わせください。

---

**更新履歴:**
- 2025-12-23: お知らせバナー操作ガイドを作成




