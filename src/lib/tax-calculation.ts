/**
 * 消費税計算ユーティリティ
 * 見積画面で使用する消費税計算ロジックを提供
 */

import { getNumericalMasterConfig } from "./numerical-master-config";

/**
 * 消費税計算結果
 */
export interface TaxCalculationResult {
  /** 税抜き金額 */
  subtotal: number;
  /** 消費税額 */
  tax: number;
  /** 税込金額 */
  total: number;
  /** 消費税率（%） */
  taxRate: number;
}

/**
 * 消費税を計算
 * 
 * @param subtotal - 税抜き金額
 * @param taxRate - 消費税率（%）。省略時は設定から取得
 * @returns 消費税計算結果
 */
export function calculateTax(
  subtotal: number,
  taxRate?: number
): TaxCalculationResult {
  const config = getNumericalMasterConfig();
  const rate = taxRate ?? config.tax.taxRate;
  
  // 消費税額を計算（小数点以下切り捨て）
  const tax = Math.floor(subtotal * (rate / 100));
  const total = subtotal + tax;
  
  return {
    subtotal,
    tax,
    total,
    taxRate: rate,
  };
}

/**
 * 税込金額から税抜き金額を計算
 * 
 * @param total - 税込金額
 * @param taxRate - 消費税率（%）。省略時は設定から取得
 * @returns 税抜き金額
 */
export function calculateSubtotalFromTotal(
  total: number,
  taxRate?: number
): number {
  const config = getNumericalMasterConfig();
  const rate = taxRate ?? config.tax.taxRate;
  
  // 税込金額から税抜き金額を計算（小数点以下切り捨て）
  return Math.floor(total / (1 + rate / 100));
}

/**
 * 消費税率を取得
 * 
 * @returns 消費税率（%）
 */
export function getTaxRate(): number {
  const config = getNumericalMasterConfig();
  return config.tax.taxRate;
}


