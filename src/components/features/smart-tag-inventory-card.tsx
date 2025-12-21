"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";
import { SmartTag } from "@/types";

interface SmartTagInventoryCardProps {
  tags: SmartTag[];
}

/**
 * スマートタグ在庫カード
 */
export function SmartTagInventoryCard({ tags }: SmartTagInventoryCardProps) {
  const availableCount = tags.filter((t) => t.status === "available").length;
  const inUseCount = tags.filter((t) => t.status === "in_use").length;
  const totalCount = tags.length;

  // 空きタグIDを取得（最大3つまで表示）
  const availableTagIds = tags
    .filter((t) => t.status === "available")
    .map((t) => t.tagId)
    .slice(0, 3);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center">
            <Tag className="h-3 w-3 text-white" />
          </div>
          スマートタグ
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-2 flex-1">
          {/* 在庫サマリー */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">空き</span>
              <span className="text-base font-bold text-green-600">
                {availableCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">使用中</span>
              <span className="text-base font-bold text-orange-600">
                {inUseCount}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
              <span className="text-sm text-slate-600">全</span>
              <span className="text-base font-bold text-slate-900">
                {totalCount}
              </span>
            </div>
          </div>

          {/* 空きタグIDバッジ */}
          {availableTagIds.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 mt-auto">
              {availableTagIds.map((tagId) => (
                <Badge
                  key={tagId}
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 font-semibold"
                >
                  {tagId}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
