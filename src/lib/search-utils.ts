/**
 * 検索機能のユーティリティ
 * 改善提案 #2: 検索機能の実装
 */

import { ZohoJob } from "@/types";

/**
 * 検索候補の型定義
 */
export interface SearchSuggestion {
  type: "customer" | "vehicle" | "plate" | "tag";
  label: string;
  value: string;
  count: number;
}

/**
 * 検索ロジック（お客様名、車両情報、ナンバープレート、タグIDで検索）
 */
export function searchJobs(jobs: ZohoJob[], query: string): ZohoJob[] {
  if (!query.trim()) return jobs;
  
  const searchQuery = query.toLowerCase().trim();
  
  return jobs.filter((job) => {
    // お客様名での検索（部分一致）
    const customerName = job.field4?.name?.toLowerCase() || "";
    if (customerName.includes(searchQuery)) return true;
    
    // 車両情報での検索
    const vehicleInfo = job.field6?.name?.toLowerCase() || "";
    if (vehicleInfo.includes(searchQuery)) return true;
    
    // ナンバープレートでの検索（車両情報から抽出）
    const plateNumber = vehicleInfo.split(" / ")[1]?.toLowerCase() || "";
    if (plateNumber.includes(searchQuery)) return true;
    
    // タグIDでの検索
    const tagId = job.tagId?.toLowerCase() || "";
    if (tagId.includes(searchQuery)) return true;
    
    // ジョブIDでの検索
    if (job.id.toLowerCase().includes(searchQuery)) return true;
    
    return false;
  });
}

/**
 * オートコンプリート候補を生成
 */
export function generateSearchSuggestions(
  jobs: ZohoJob[],
  query: string,
  maxSuggestions: number = 10
): SearchSuggestion[] {
  if (!query.trim() || query.length < 2) return [];
  
  const searchQuery = query.toLowerCase();
  const suggestions: SearchSuggestion[] = [];
  
  // お客様名の候補
  const customerNames = new Set<string>();
  jobs.forEach((job) => {
    const name = job.field4?.name || "";
    if (name.toLowerCase().includes(searchQuery) && name.trim()) {
      customerNames.add(name);
    }
  });
  
  // 車両情報の候補
  const vehicleInfos = new Set<string>();
  jobs.forEach((job) => {
    const info = job.field6?.name || "";
    if (info.toLowerCase().includes(searchQuery) && info.trim()) {
      vehicleInfos.add(info);
    }
  });
  
  // ナンバープレートの候補
  const plateNumbers = new Set<string>();
  jobs.forEach((job) => {
    const vehicleInfo = job.field6?.name || "";
    const plate = vehicleInfo.split(" / ")[1]?.trim() || "";
    if (plate.toLowerCase().includes(searchQuery) && plate.trim()) {
      plateNumbers.add(plate);
    }
  });
  
  // カテゴリー別に候補を追加（最大10件）
  Array.from(customerNames).slice(0, 5).forEach((name) => {
    suggestions.push({
      type: "customer",
      label: name,
      value: name,
      count: jobs.filter((j) => j.field4?.name === name).length,
    });
  });
  
  Array.from(vehicleInfos).slice(0, 3).forEach((info) => {
    suggestions.push({
      type: "vehicle",
      label: info,
      value: info,
      count: jobs.filter((j) => j.field6?.name === info).length,
    });
  });
  
  Array.from(plateNumbers).slice(0, 2).forEach((plate) => {
    suggestions.push({
      type: "plate",
      label: plate,
      value: plate,
      count: jobs.filter((j) => {
        const vehicleInfo = j.field6?.name || "";
        return vehicleInfo.split(" / ")[1]?.trim() === plate;
      }).length,
    });
  });
  
  return suggestions.slice(0, maxSuggestions);
}

/**
 * マッチしたテキストをハイライト
 */
export function highlightMatch(text: string, query: string): string | React.ReactNode {
  if (!query.trim()) return text;
  
  // React.ReactNodeを返すために、JSXを返す必要がある
  // ただし、この関数は文字列としても使用される可能性があるため、
  // 実際の実装では、コンポーネント内で使用する
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  
  // 文字列として返す（コンポーネント内でJSXに変換）
  return text;
}


