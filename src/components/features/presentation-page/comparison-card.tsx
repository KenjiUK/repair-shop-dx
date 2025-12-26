"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ComparisonCardProps {
  itemName: string;
  category: string;
  beforeUrl: string;
  afterUrl: string;
}

/**
 * Before/After比較カードコンポーネント
 */
export function ComparisonCard({
  itemName,
  category,
  beforeUrl,
  afterUrl,
}: ComparisonCardProps) {
  const [viewMode, setViewMode] = useState<"split" | "before" | "after">("split");

  return (
    <Card className="overflow-hidden border border-slate-300 rounded-xl shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">{itemName}</CardTitle>
            <Badge variant="outline" className="mt-1 text-base font-medium px-2.5 py-1">{category}</Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "before" ? "default" : "ghost"}
              onClick={() => setViewMode("before")}
              className="h-12 text-base font-medium"
            >
              作業前
            </Button>
            <Button
              variant={viewMode === "split" ? "default" : "ghost"}
              onClick={() => setViewMode("split")}
              className="h-12 w-12 p-0"
            >
              <ArrowLeftRight className="h-5 w-5" />
            </Button>
            <Button
              variant={viewMode === "after" ? "default" : "ghost"}
              onClick={() => setViewMode("after")}
              className="h-12 text-base font-medium"
            >
              作業後
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {viewMode === "split" ? (
          <div className="grid grid-cols-2 gap-1 p-2">
            <div className="relative">
              <Image
                src={beforeUrl}
                alt="作業前"
                width={400}
                height={300}
                className="w-full aspect-[4/3] object-cover rounded"
                loading="lazy"
                quality={85}
                unoptimized
              />
              <Badge className="absolute top-2 left-2 bg-slate-800 text-base font-medium px-2.5 py-1">作業前</Badge>
            </div>
            <div className="relative">
              <Image
                src={afterUrl}
                alt="作業後"
                width={400}
                height={300}
                className="w-full aspect-[4/3] object-cover rounded"
                loading="lazy"
                quality={85}
                unoptimized
              />
              <Badge className="absolute top-2 left-2 bg-green-600 text-base font-medium px-2.5 py-1">作業後</Badge>
            </div>
          </div>
        ) : (
          <div className="relative p-2">
            <Image
              src={viewMode === "before" ? beforeUrl : afterUrl}
              alt={viewMode === "before" ? "作業前" : "作業後"}
              width={800}
              height={600}
              className="w-full aspect-[4/3] object-cover rounded"
              loading="lazy"
              quality={85}
              unoptimized
            />
            <Badge
              className={cn(
                "absolute top-4 left-4 text-base font-medium px-2.5 py-1",
                viewMode === "before" ? "bg-slate-800" : "bg-green-600"
              )}
            >
              {viewMode === "before" ? "作業前" : "作業後"}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}








