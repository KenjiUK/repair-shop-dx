/**
 * メーカーアイコンコンポーネント
 * 
 * Simple Iconsを使用して自動車メーカーのロゴを表示
 */

"use client";

import { extractManufacturer } from "@/lib/vehicle-manufacturer";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";
import * as simpleIcons from "simple-icons";

interface ManufacturerIconProps {
  /** 車両名 */
  vehicleName: string;
  /** アイコンのサイズ（デフォルト: h-5 w-5） */
  className?: string;
  /** フォールバックアイコンのサイズクラス（デフォルト: h-5 w-5） */
  fallbackClassName?: string;
  /** カスタムスタイル */
  style?: React.CSSProperties;
}

/**
 * Simple Iconsからメーカーロゴを取得
 */
function getManufacturerIcon(slug: string): { path: string; viewBox: string } | null {
  try {
    // simple-iconsパッケージからアイコンを取得
    // スラッグをキャメルケースに変換（例: "toyota" -> "siToyota"）
    const camelCaseSlug = `si${slug.charAt(0).toUpperCase() + slug.slice(1)}`;
    
    const icon = (simpleIcons as Record<string, { path: string; viewBox?: string }>)[camelCaseSlug];
    
    if (!icon || !icon.path) {
      return null;
    }

    return {
      path: icon.path,
      viewBox: icon.viewBox || "0 0 24 24",
    };
  } catch (error) {
    console.warn(`Manufacturer icon not found for: ${slug}`, error);
    return null;
  }
}

/**
 * 車両名からメーカーを特定し、メーカーロゴを表示
 * メーカーが特定できない場合はデフォルトのCarアイコンを表示
 */
export function ManufacturerIcon({
  vehicleName,
  className = "h-5 w-5",
  fallbackClassName = "h-5 w-5",
  style,
}: ManufacturerIconProps) {
  const manufacturer = extractManufacturer(vehicleName);

  // デバッグ用（開発環境のみ）
  if (process.env.NODE_ENV === "development" && vehicleName.includes("メルセデス")) {
    console.log("ManufacturerIcon Debug:", {
      vehicleName,
      manufacturer,
    });
  }

  if (!manufacturer) {
    return (
      <Car
        className={cn("text-slate-700 shrink-0", fallbackClassName)}
        strokeWidth={2}
        style={style}
      />
    );
  }

  const iconData = getManufacturerIcon(manufacturer);
  
  // デバッグ用（開発環境のみ）
  if (process.env.NODE_ENV === "development" && vehicleName.includes("メルセデス")) {
    console.log("ManufacturerIcon IconData:", {
      manufacturer,
      iconData,
      camelCase: `si${manufacturer.charAt(0).toUpperCase() + manufacturer.slice(1)}`,
    });
  }

  if (!iconData) {
    return (
      <Car
        className={cn("text-slate-700 shrink-0", fallbackClassName)}
        strokeWidth={2}
        style={style}
      />
    );
  }

  return (
    <svg
      className={cn("shrink-0 text-slate-700", className)}
      viewBox={iconData.viewBox}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      aria-label={`${manufacturer} logo`}
    >
      <path d={iconData.path} />
    </svg>
  );
}

