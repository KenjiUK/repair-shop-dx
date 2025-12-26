# UI/UXドキュメント整理計画

**作成日**: 2025-01-XX  
**目的**: UI/UX関連ドキュメントを整理し、`DESIGN_SYSTEM.md`（統合版）を唯一のソースとして確立する

---

## 📋 整理方針

### 1. メインドキュメント（保持）

✅ **`docs/DESIGN_SYSTEM.md`** - **統合版デザインシステム**
- このドキュメントが唯一のソース
- すべてのデザインシステム情報を包含
- タイポグラフィ、カラーパレット、ボタンサイズ、フォーム要素、スペーシング、アイコンなど全てを含む

✅ **`docs/UIチェックリスト.md`** - UIチェック用チェックリスト
- `DESIGN_SYSTEM.md`を参照
- 実装確認用のチェックリストとして保持

---

## 📦 アーカイブ対象（docs/archive/に移動推奨）

### 統合済み（DESIGN_SYSTEM.mdに統合）

- ❌ `docs/UI_UX_GUIDELINES.md` → 統合済み
- ❌ `docs/TOP_PAGE_DESIGN_SYSTEM.md` → 統合済み（主要部分）
- ❌ `docs/STATUS_COLOR_RULES.md` → 統合済み（10-1に統合）
- ❌ `docs/SERVICE_KIND_COLOR_RULES.md` → 統合済み（10-2に統合）
- ❌ `docs/ACTION_BUTTON_COLOR_RULES.md` → 統合済み（6-3に統合）
- ❌ `docs/TYPOGRAPHY_HIERARCHY_IMPROVEMENT_IMPLEMENTATION_STATUS.md` → 統合済み（2-2に統合）
- ❌ `docs/color-universal-design-guide.md` → 統合済み（10-4に統合）

### 実装状況・進捗記録（アーカイブ推奨）

- 📦 `docs/UIUX_IMPROVEMENT_PROGRESS_SUMMARY.md`
- 📦 `docs/UIUX_IMPROVEMENT_WORKFLOW.md`
- 📦 `docs/UIUX_IMPROVEMENT_PROGRESS.md`
- 📦 `docs/UIUX_IMPROVEMENT_CHECKLIST.md`
- 📦 `docs/FINAL_UIUX_IMPROVEMENT_PROPOSAL.md`
- 📦 `docs/UIUX_IMPLEMENTATION_PLAN.md`
- 📦 `docs/UIUX_REVIEW_COMPREHENSIVE.md`
- 📦 `docs/COLOR_UX_IMPROVEMENT_IMPLEMENTATION_STATUS.md`
- 📦 `docs/JOB_CARD_UX_IMPROVEMENT_IMPLEMENTATION_STATUS.md`
- 📦 `docs/SUMMARY_CARDS_UX_IMPROVEMENT_IMPLEMENTATION_STATUS.md`
- 📦 `docs/FILTER_UX_IMPROVEMENT_IMPLEMENTATION_STATUS.md`
- 📦 `docs/TYPOGRAPHY_HIERARCHY_IMPROVEMENT_IMPLEMENTATION_STATUS.md`

### 提案・レビュー（アーカイブ推奨）

- 📦 `docs/SUMMARY_CARDS_UI_PATTERN_PROPOSAL.md`
- 📦 `docs/SUMMARY_CARDS_UX_REDESIGN_PROPOSAL.md`
- 📦 `docs/TOP_PAGE_ZERO_BASE_DESIGN.md`
- 📦 `docs/BADGE_DESIGN_IMPROVEMENT_IMPLEMENTATION_STATUS.md`
- 📦 `docs/COMPACT_JOB_HEADER_DESIGN.md`
- 📦 `docs/DESIGN_SYSTEM_APPLICATION_PLAN.md`
- 📦 `docs/DESIGN_SYSTEM_APPLICATION_SUMMARY.md`
- 📦 `docs/ESTIMATE_UI_IMPROVEMENT_PROPOSAL.md`

---

## 🔄 既にアーカイブ済み（確認のみ）

以下のドキュメントは既に`docs/archive/`にあります：
- `archive/TYPOGRAPHY_HIERARCHY_REDESIGN.md`
- `archive/FRONT_OFFICE_PORTAL_DESIGN_ANALYSIS.md`
- その他多数

---

## ✅ 実行手順

1. **確認**: `DESIGN_SYSTEM.md`の内容を確認
2. **アーカイブ**: 上記のアーカイブ対象を`docs/archive/`に移動
3. **参照更新**: 他のドキュメントから古いドキュメントへの参照を`DESIGN_SYSTEM.md`に更新
4. **削除確認**: 不要な重複ドキュメントを削除（慎重に）

---

## 📝 注意事項

- **実装状況・進捗記録**は削除せず、`archive/`に移動（履歴として保持）
- **提案・レビュー**も削除せず、`archive/`に移動（参考として保持）
- **重要な情報**はすべて`DESIGN_SYSTEM.md`に統合済み

---

## 🎯 目標

- **1つのメインドキュメント**: `DESIGN_SYSTEM.md`
- **1つのチェックリスト**: `UIチェックリスト.md`（`DESIGN_SYSTEM.md`を参照）
- **アーカイブ**: 過去の実装記録・提案は`archive/`に保管




