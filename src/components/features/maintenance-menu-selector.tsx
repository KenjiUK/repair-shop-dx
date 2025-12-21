"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MaintenanceType,
  getMaintenanceMenuList,
  getMaintenanceMenuConfig,
} from "@/lib/maintenance-menu-config";
import { Wrench } from "lucide-react";

// =============================================================================
// Props
// =============================================================================

interface MaintenanceMenuSelectorProps {
  /** 選択されたメニュー */
  selectedMenu?: MaintenanceType | null;
  /** メニュー選択変更ハンドラ */
  onMenuChange?: (menu: MaintenanceType | null) => void;
  /** 無効化 */
  disabled?: boolean;
  /** 必須か */
  required?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function MaintenanceMenuSelector({
  selectedMenu,
  onMenuChange,
  disabled = false,
  required = false,
}: MaintenanceMenuSelectorProps) {
  const menuList = getMaintenanceMenuList();
  const selectedConfig = selectedMenu ? getMaintenanceMenuConfig(selectedMenu) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="h-5 w-5" />
          メンテナンスメニュー選択
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="maintenance-menu">
            メニューを選択
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Select
            value={selectedMenu || ""}
            onValueChange={(value) => {
              if (onMenuChange) {
                onMenuChange(value ? (value as MaintenanceType) : null);
              }
            }}
            disabled={disabled}
            required={required}
          >
            <SelectTrigger id="maintenance-menu">
              <SelectValue placeholder="メニューを選択してください" />
            </SelectTrigger>
            <SelectContent>
              {menuList.map((menu) => (
                <SelectItem key={menu} value={menu}>
                  {menu}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 選択されたメニューの情報表示 */}
        {selectedConfig && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">
                {selectedConfig.name}
              </span>
              <span className="text-xs text-slate-600">
                所要時間: 約{selectedConfig.duration}分
              </span>
            </div>
            <div className="text-xs text-slate-600">
              <p>検査項目: {selectedConfig.inspectionItems.length}項目</p>
              {selectedConfig.measurementFields.length > 0 && (
                <p>測定値: {selectedConfig.measurementFields.length}項目</p>
              )}
              {selectedConfig.requiresPhoto && (
                <p className="text-amber-600">写真撮影が必要です</p>
              )}
              {selectedConfig.requiresParts && (
                <p className="text-blue-600">部品が必要です</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}









