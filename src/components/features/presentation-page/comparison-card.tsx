"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{itemName}</CardTitle>
            <Badge variant="outline" className="mt-1">{category}</Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "before" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("before")}
            >
              Before
            </Button>
            <Button
              variant={viewMode === "split" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("split")}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "after" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("after")}
            >
              After
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {viewMode === "split" ? (
          <div className="grid grid-cols-2 gap-1 p-2">
            <div className="relative">
              <img
                src={beforeUrl}
                alt="Before"
                className="w-full aspect-[4/3] object-cover rounded"
              />
              <Badge className="absolute top-2 left-2 bg-slate-800">Before</Badge>
            </div>
            <div className="relative">
              <img
                src={afterUrl}
                alt="After"
                className="w-full aspect-[4/3] object-cover rounded"
              />
              <Badge className="absolute top-2 left-2 bg-green-600">After</Badge>
            </div>
          </div>
        ) : (
          <div className="relative p-2">
            <img
              src={viewMode === "before" ? beforeUrl : afterUrl}
              alt={viewMode}
              className="w-full aspect-[4/3] object-cover rounded"
            />
            <Badge
              className={cn(
                "absolute top-4 left-4",
                viewMode === "before" ? "bg-slate-800" : "bg-green-600"
              )}
            >
              {viewMode === "before" ? "Before" : "After"}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
