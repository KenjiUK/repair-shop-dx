# バージョン管理ガイド

**作成日:** 2025-12-23  
**対象:** デジタルガレージ (Repair Shop DX Platform)

---

## 📋 バージョン管理のベストプラクティス

### 1. セマンティックバージョニング (Semantic Versioning)

**形式:** `MAJOR.MINOR.PATCH` (例: `1.0.0`)

- **MAJOR (メジャー):** 破壊的変更（APIの変更、データ構造の大幅な変更など）
- **MINOR (マイナー):** 新機能追加（後方互換性を保つ）
- **PATCH (パッチ):** バグ修正、小さな改善

**例:**
- `1.0.0` → 初回リリース
- `1.0.1` → バグ修正
- `1.1.0` → 新機能追加（お知らせ管理など）
- `2.0.0` → 破壊的変更（データ構造の変更など）

### 2. プレリリースバージョン

**形式:** `MAJOR.MINOR.PATCH-IDENTIFIER` (例: `1.0.0-beta.1`)

- **alpha:** 内部テスト版
- **beta:** 公開テスト版
- **rc (release candidate):** リリース候補版

**例:**
- `1.0.0-alpha.1` → 内部テスト版
- `1.0.0-beta.1` → 公開テスト版（現在の状態）
- `1.0.0-rc.1` → リリース候補版
- `1.0.0` → 正式リリース

### 3. バージョン情報の管理場所

#### 3.1. package.json
```json
{
  "version": "1.0.0-beta.1",
  "name": "repair-shop-dx"
}
```

#### 3.2. バージョン情報ファイル
- `src/lib/version.ts` - アプリケーション内で使用するバージョン情報
- `CHANGELOG.md` - 変更履歴

#### 3.3. 環境変数
- `.env.local` - ビルド時のバージョン情報（オプション）

---

## 🎯 実装方法

### 方法1: シンプルなバージョン表示

アプリケーション内でバージョンを表示する場合：

```typescript
// src/lib/version.ts
export const APP_VERSION = "1.0.0-beta.1";
export const APP_NAME = "デジタルガレージ";
export const APP_ENV = process.env.NODE_ENV === "production" ? "production" : "development";
```

### 方法2: package.jsonから自動取得

ビルド時にpackage.jsonから自動的にバージョンを取得：

```typescript
// src/lib/version.ts
import packageJson from "../../package.json";

export const APP_VERSION = packageJson.version;
export const APP_NAME = packageJson.name;
```

### 方法3: ビルド時に環境変数で注入

Next.jsのビルド時にバージョンを注入：

```typescript
// next.config.js
const packageJson = require("./package.json");

module.exports = {
  env: {
    APP_VERSION: packageJson.version,
    APP_NAME: "デジタルガレージ",
  },
};
```

---

## 📝 CHANGELOG.md の書き方

変更履歴を記録する標準的な形式：

```markdown
# Changelog

## [1.0.0-beta.1] - 2025-12-23

### Added
- お知らせバナー機能の追加
- お知らせ管理ページの実装
- テスト版公開のお知らせ自動表示

### Changed
- デザインシステムの統一化
- トースト通知の位置調整

### Fixed
- ロゴ表示のサイズ調整
- メッセージトーストの重なり問題

## [0.1.0] - 2025-12-01

### Added
- 初回リリース
- 基本的なワークフロー機能
```

---

## 🔄 バージョンアップの手順

### 1. バージョン番号の更新

```bash
# package.jsonのバージョンを更新
# 例: 1.0.0-beta.1 → 1.0.0-beta.2
```

### 2. CHANGELOG.mdの更新

変更内容を記録

### 3. Gitタグの作成

```bash
git tag -a v1.0.0-beta.1 -m "Release version 1.0.0-beta.1"
git push origin v1.0.0-beta.1
```

### 4. リリースノートの作成

GitHub Releasesなどでリリースノートを作成

---

## 💡 推奨される運用フロー

### 開発フェーズ

1. **開発中:** `1.0.0-alpha.X` (内部テスト)
2. **テスト版公開:** `1.0.0-beta.X` (現在の状態)
3. **リリース候補:** `1.0.0-rc.X`
4. **正式リリース:** `1.0.0`

### リリース後の運用

1. **パッチリリース:** `1.0.0` → `1.0.1` (バグ修正)
2. **マイナーリリース:** `1.0.0` → `1.1.0` (新機能追加)
3. **メジャーリリース:** `1.0.0` → `2.0.0` (破壊的変更)

---

## 🎨 UIでの表示例

### フッターに表示

```tsx
<footer className="text-xs text-slate-500">
  デジタルガレージ v{APP_VERSION}
</footer>
```

### 設定画面に表示

```tsx
<div>
  <h3>アプリケーション情報</h3>
  <p>バージョン: {APP_VERSION}</p>
  <p>環境: {APP_ENV}</p>
</div>
```

### お知らせバナーで表示

```tsx
<AnnouncementBanner
  message={`🚀 デジタルガレージ ${APP_VERSION} を公開中です`}
/>
```

---

## 📚 参考資料

- [Semantic Versioning 2.0.0](https://semver.org/lang/ja/)
- [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

**更新履歴:**
- 2025-12-23: バージョン管理ガイドを作成




