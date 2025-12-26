/**
 * フィードバック機能のユーティリティ
 * テスト版専用機能
 */

/**
 * フィードバックのカテゴリ
 */
export type FeedbackCategory =
  | "bug"           // 🐛 バグ報告
  | "uiux"          // 💡 UI/UX改善提案
  | "feature"       // ✨ 機能要望
  | "question"      // ❓ 質問・不明点
  | "positive"      // 👍 良い点
  | "other";        // その他

/**
 * フィードバックの緊急度
 */
export type FeedbackUrgency = "low" | "medium" | "high";

/**
 * フィードバックデータ
 */
export interface FeedbackData {
  category: FeedbackCategory;
  content: string;
  urgency: FeedbackUrgency;
  screenshotUrl?: string;
}

/**
 * 画面名のマッピング
 */
const PAGE_NAME_MAP: Record<string, string> = {
  "/": "トップページ",
  "/mechanic/diagnosis/[id]": "診断画面",
  "/mechanic/work/[id]": "作業画面",
  "/admin/estimate/[id]": "見積作成画面",
  "/customer/dashboard": "顧客ダッシュボード",
  "/customer/approval/[id]": "顧客承認画面",
  "/manager/analytics": "業務分析画面",
  "/presentation/[id]": "プレゼン画面",
};

/**
 * パスから画面名を取得
 */
export function getPageNameFromPath(pathname: string): string {
  // 動的ルートのパターンを正規化
  const normalizedPath = pathname.replace(/\/\d+/g, "/[id]").replace(/\/[a-zA-Z0-9-]+/g, (match, offset) => {
    // 最初のスラッシュ以外の部分をチェック
    if (offset === 0) return match;
    // UUIDやIDのような形式を [id] に置換
    if (/^\/[a-f0-9-]{36}$/i.test(match) || /^\/[A-Z0-9-]+$/i.test(match)) {
      return "/[id]";
    }
    return match;
  });

  // 完全一致をチェック
  if (PAGE_NAME_MAP[normalizedPath]) {
    return PAGE_NAME_MAP[normalizedPath];
  }

  // 部分一致をチェック
  for (const [pattern, name] of Object.entries(PAGE_NAME_MAP)) {
    if (normalizedPath.startsWith(pattern.replace("/[id]", ""))) {
      return name;
    }
  }

  // デフォルト: パスから推測
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "トップページ";
  
  const lastSegment = segments[segments.length - 1];
  const segmentNames: Record<string, string> = {
    "mechanic": "整備士画面",
    "admin": "管理者画面",
    "customer": "顧客画面",
    "manager": "管理者画面",
  };

  return segmentNames[segments[0]] || lastSegment || "不明な画面";
}

/**
 * 画面情報を取得
 */
export function getPageInfo(): {
  pathname: string;
  pageName: string;
  jobId?: string;
  customerName?: string;
  vehicleInfo?: string;
} {
  if (typeof window === "undefined") {
    return {
      pathname: "/",
      pageName: "不明な画面",
    };
  }

  const pathname = window.location.pathname;
  const pageName = getPageNameFromPath(pathname);

  // ジョブIDを抽出（パスから）
  const jobIdMatch = pathname.match(/\/([a-zA-Z0-9-]+)$/);
  const jobId = jobIdMatch ? jobIdMatch[1] : undefined;

  // 顧客名・車両情報は、必要に応じてDOMやグローバル状態から取得
  // ここでは簡易実装として、localStorageやsessionStorageから取得を試みる
  let customerName: string | undefined;
  let vehicleInfo: string | undefined;

  try {
    // 現在のジョブ情報があれば取得（将来の拡張用）
    const currentJob = sessionStorage.getItem("currentJob");
    if (currentJob) {
      const job = JSON.parse(currentJob);
      customerName = job.customerName;
      vehicleInfo = job.vehicleInfo;
    }
  } catch {
    // エラーは無視
  }

  return {
    pathname,
    pageName,
    jobId,
    customerName,
    vehicleInfo,
  };
}

/**
 * ブラウザ情報を取得
 */
export function getBrowserInfo(): {
  userAgent: string;
  screenSize: string;
} {
  if (typeof window === "undefined") {
    return {
      userAgent: "Unknown",
      screenSize: "Unknown",
    };
  }

  return {
    userAgent: navigator.userAgent,
    screenSize: `${window.screen.width}x${window.screen.height}`,
  };
}

/**
 * ユーザー名を取得
 */
export function getUserName(): string {
  if (typeof window === "undefined") return "未設定";

  try {
    // localStorageからユーザー名を取得（将来の認証システム実装時に拡張）
    const userName = localStorage.getItem("userName");
    if (userName) return userName;

    // 整備士名があれば使用
    const mechanicName = localStorage.getItem("currentMechanic");
    if (mechanicName) return mechanicName;

    return "未設定";
  } catch {
    return "未設定";
  }
}

/**
 * カテゴリの表示名を取得
 */
export function getCategoryLabel(category: FeedbackCategory): string {
  const labels: Record<FeedbackCategory, string> = {
    bug: "バグ報告",
    uiux: "UI/UX改善提案",
    feature: "機能要望",
    question: "質問・不明点",
    positive: "良い点",
    other: "その他",
  };
  return labels[category];
}

/**
 * 緊急度の表示名を取得
 */
export function getUrgencyLabel(urgency: FeedbackUrgency): string {
  const labels: Record<FeedbackUrgency, string> = {
    low: "低",
    medium: "中",
    high: "高",
  };
  return labels[urgency];
}

/**
 * フィードバックが有効かどうかを判定
 */
export function isFeedbackEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_FEEDBACK === "true";
}

