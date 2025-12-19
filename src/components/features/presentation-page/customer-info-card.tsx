"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Car, Tag, Calendar, User } from "lucide-react";

interface CustomerInfoCardProps {
  customerName: string;
  vehicleName: string;
  tagId: string;
  completedAtText: string;
}

/**
 * 顧客・車両情報カードコンポーネント
 */
export function CustomerInfoCard({
  customerName,
  vehicleName,
  tagId,
  completedAtText,
}: CustomerInfoCardProps) {
  return (
    <Card className="mb-6 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
      <CardContent className="py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <User className="h-7 w-7" />
            </div>
            <div>
              <p className="text-white/70 text-sm">お客様</p>
              <p className="text-2xl font-bold">{customerName} 様</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-white/70" />
              <div>
                <p className="text-white/70">車両</p>
                <p className="font-medium">{vehicleName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-white/70" />
              <div>
                <p className="text-white/70">タグ</p>
                <p className="font-medium">No.{tagId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-white/70" />
              <div>
                <p className="text-white/70">完了日時</p>
                <p className="font-medium">{completedAtText}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
