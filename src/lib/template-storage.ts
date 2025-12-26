/**
 * テンプレートストレージ管理
 * 改善提案 #7: テンプレート機能の実装
 *
 * localStorageを使用してテンプレートを保存・読み込み
 */

import {
  DiagnosisTemplate,
  EstimateTemplate,
} from "@/types";
import { getCurrentMechanicName } from "@/lib/auth";

const DIAGNOSIS_TEMPLATES_KEY = "diagnosis-templates";
const ESTIMATE_TEMPLATES_KEY = "estimate-templates";

/**
 * 診断結果テンプレートを取得
 */
export function getDiagnosisTemplates(): DiagnosisTemplate[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(DIAGNOSIS_TEMPLATES_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as DiagnosisTemplate[];
  } catch (error) {
    console.error("診断結果テンプレートの取得エラー:", error);
    return [];
  }
}

/**
 * 診断結果テンプレートを保存
 */
export function saveDiagnosisTemplate(template: DiagnosisTemplate): void {
  if (typeof window === "undefined") return;
  
  try {
    const templates = getDiagnosisTemplates();
    const existingIndex = templates.findIndex((t) => t.id === template.id);
    
    if (existingIndex >= 0) {
      // 既存のテンプレートを更新
      templates[existingIndex] = {
        ...template,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // 新しいテンプレートを追加
      templates.push(template);
    }
    
    localStorage.setItem(DIAGNOSIS_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error("診断結果テンプレートの保存エラー:", error);
    throw error;
  }
}

/**
 * 診断結果テンプレートを削除
 */
export function deleteDiagnosisTemplate(templateId: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const templates = getDiagnosisTemplates();
    const filtered = templates.filter((t) => t.id !== templateId);
    localStorage.setItem(DIAGNOSIS_TEMPLATES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("診断結果テンプレートの削除エラー:", error);
    throw error;
  }
}

/**
 * 見積項目テンプレートを取得
 */
export function getEstimateTemplates(): EstimateTemplate[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(ESTIMATE_TEMPLATES_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as EstimateTemplate[];
  } catch (error) {
    console.error("見積項目テンプレートの取得エラー:", error);
    return [];
  }
}

/**
 * 見積項目テンプレートを保存
 */
export function saveEstimateTemplate(template: EstimateTemplate): void {
  if (typeof window === "undefined") return;
  
  try {
    const templates = getEstimateTemplates();
    const existingIndex = templates.findIndex((t) => t.id === template.id);
    
    if (existingIndex >= 0) {
      // 既存のテンプレートを更新
      templates[existingIndex] = {
        ...template,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // 新しいテンプレートを追加
      templates.push(template);
    }
    
    localStorage.setItem(ESTIMATE_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error("見積項目テンプレートの保存エラー:", error);
    throw error;
  }
}

/**
 * 見積項目テンプレートを削除
 */
export function deleteEstimateTemplate(templateId: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const templates = getEstimateTemplates();
    const filtered = templates.filter((t) => t.id !== templateId);
    localStorage.setItem(ESTIMATE_TEMPLATES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("見積項目テンプレートの削除エラー:", error);
    throw error;
  }
}

/**
 * テンプレートIDを生成
 */
export function generateTemplateId(): string {
  return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 現在のユーザー名を取得（テンプレート作成者用）
 */
export function getCurrentUser(): string {
  return getCurrentMechanicName() || "システム";
}




