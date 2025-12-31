# リファクタリングTODO

## コンポーネント名の統一

### JobCard → IncomingJobCard への変更（将来実装）

**理由:**
- 用語定義（`TERMINOLOGY_REDEFINITION.md`）では「ジョブ」という用語を避けるべきとされている
- `ZohoJob`は「入庫案件」として定義されている
- UI表示用語では「案件カード」が`ZohoJob`を表示するカード

**影響範囲:**
- 12ファイルで使用されている
  - `src/components/features/job-card.tsx` (定義)
  - `src/app/page.tsx`
  - `src/components/features/job-list.tsx`
  - `src/app/projects/long-term/page.tsx`
  - `src/app/mechanic/diagnosis/[id]/page.tsx`
  - `src/app/customer/dashboard/page.tsx`
  - `src/app/mechanic/work/[id]/page.tsx`
  - `src/app/admin/estimate/[id]/page.tsx`
  - `src/components/layout/compact-job-header.tsx`
  - `src/app/jobs/history/page.tsx`
  - `src/components/features/status-quick-filter.tsx`
  - `src/components/features/work-order-card.tsx`

**変更内容:**
1. ファイル名: `job-card.tsx` → `incoming-job-card.tsx`
2. コンポーネント名: `JobCard` → `IncomingJobCard`
3. すべてのインポート文を更新
4. 型定義: `JobCardProps` → `IncomingJobCardProps`

**優先度:** 低（現時点では機能的な問題はない）

**実装時期:** 大規模リファクタリング時または用語統一の徹底が必要になった時

