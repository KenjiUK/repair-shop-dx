/**
 * 整備士スキルレベル管理ストレージ
 * 改善提案 #5: 詳細情報の表示機能の強化
 * 
 * localStorage を使用して整備士のスキルレベルを管理
 */

import { MechanicSkill, SkillItem } from "@/types";

const STORAGE_KEY = "mechanic_skills";

/**
 * 全整備士のスキル情報を取得
 */
export function getAllMechanicSkills(): MechanicSkill[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const skills = JSON.parse(stored) as MechanicSkill[];
    return skills;
  } catch (error) {
    console.error("[MechanicSkillStorage] データの取得に失敗:", error);
    return [];
  }
}

/**
 * 整備士のスキル情報を取得
 */
export function getMechanicSkill(mechanicName: string): MechanicSkill | null {
  const allSkills = getAllMechanicSkills();
  return allSkills.find((s) => s.mechanicName === mechanicName) || null;
}

/**
 * 整備士のスキル情報を保存
 */
export function saveMechanicSkill(skill: MechanicSkill): void {
  if (typeof window === "undefined") return;
  
  try {
    const allSkills = getAllMechanicSkills();
    const existingIndex = allSkills.findIndex((s) => s.mechanicName === skill.mechanicName);
    
    const updatedSkill: MechanicSkill = {
      ...skill,
      lastUpdatedAt: new Date().toISOString(),
      // 全体のスキルレベルを自動計算（skillsの平均値）
      overallLevel: skill.skills.length > 0
        ? Math.round(skill.skills.reduce((sum, s) => sum + s.level, 0) / skill.skills.length)
        : 0,
    };
    
    if (existingIndex >= 0) {
      allSkills[existingIndex] = updatedSkill;
    } else {
      allSkills.push(updatedSkill);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSkills));
  } catch (error) {
    console.error("[MechanicSkillStorage] データの保存に失敗:", error);
    throw error;
  }
}

/**
 * 整備士のスキル情報を削除
 */
export function deleteMechanicSkill(mechanicName: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const allSkills = getAllMechanicSkills();
    const filtered = allSkills.filter((s) => s.mechanicName !== mechanicName);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("[MechanicSkillStorage] データの削除に失敗:", error);
    throw error;
  }
}

/**
 * 初期スキル項目を作成
 */
export function createInitialSkillItem(category: string): SkillItem {
  return {
    category,
    level: 0,
    experience: 0,
    certifications: [],
  };
}

/**
 * 初期整備士スキル情報を作成
 */
export function createInitialMechanicSkill(mechanicName: string): MechanicSkill {
  const defaultCategories = [
    "エンジン",
    "ブレーキ",
    "電装",
    "足回り",
    "エアコン",
    "板金",
    "塗装",
  ];
  
  return {
    mechanicId: mechanicName,
    mechanicName,
    skills: defaultCategories.map((cat) => createInitialSkillItem(cat)),
    overallLevel: 0,
    lastUpdatedAt: new Date().toISOString(),
  };
}

