/**
 * 業務分析ページ
 * 改善提案 #8: 業務分析機能の実装
 *
 * 機能:
 * - 月次・週次の業務量を分析
 * - 業務の傾向を把握
 * - 繁忙期・閑散期の比較
 * - 入庫区分別の業務量分析
 */

"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchAnalyticsData } from "@/lib/api";
import {
  getStartOfMonth,
  getEndOfMonth,
  getStartOfWeek,
  getEndOfWeek,
  AnalyticsData,
} from "@/lib/analytics-utils";
import { AppHeader } from "@/components/layout/app-header";
import { Calendar, TrendingUp, BarChart3, AlertCircle } from "lucide-react";

/**
 * 日付をフォーマット
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * 業務分析ページ
 */
export default function BusinessAnalyticsPage() {
  const [dateRange, setDateRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");

  // 期間の計算
  const selectedPeriod = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case "week":
        return {
          start: getStartOfWeek(now),
          end: getEndOfWeek(now),
        };
      case "month":
        return {
          start: getStartOfMonth(now),
          end: getEndOfMonth(now),
        };
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        return {
          start: new Date(now.getFullYear(), quarter * 3, 1),
          end: new Date(now.getFullYear(), (quarter + 1) * 3, 0),
        };
      case "year":
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31),
        };
    }
  }, [dateRange]);

  // 業務量データを取得
  const { data: analyticsResponse, isLoading } = useSWR(
    `analytics-${dateRange}-${selectedPeriod.start.toISOString()}-${selectedPeriod.end.toISOString()}`,
    () =>
      fetchAnalyticsData(
        dateRange,
        selectedPeriod.start,
        selectedPeriod.end
      ),
    {
      revalidateOnFocus: false,
    }
  );

  const analyticsData: AnalyticsData | undefined =
    analyticsResponse?.success && analyticsResponse.data
      ? analyticsResponse.data
      : undefined;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader maxWidthClassName="max-w-7xl">
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 shrink-0" />
            業務分析
          </h1>
        </div>
      </AppHeader>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 期間選択 */}
        <Card className="border border-slate-300 rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Calendar className="h-5 w-5 shrink-0" />
              期間選択
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">集計単位</Label>
                <Select
                  value={dateRange}
                  onValueChange={(value) =>
                    setDateRange(value as typeof dateRange)
                  }
                >
                  <SelectTrigger className="w-32 h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">週次</SelectItem>
                    <SelectItem value="month">月次</SelectItem>
                    <SelectItem value="quarter">四半期</SelectItem>
                    <SelectItem value="year">年次</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <Label className="text-base font-medium">期間</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={formatDate(selectedPeriod.start)
                      .replace(/\//g, "-")
                      .split("-")
                      .reverse()
                      .join("-")}
                    disabled
                    className="flex-1 h-12 text-base"
                  />
                  <span className="text-base text-slate-700">〜</span>
                  <Input
                    type="date"
                    value={formatDate(selectedPeriod.end)
                      .replace(/\//g, "-")
                      .split("-")
                      .reverse()
                      .join("-")}
                    disabled
                    className="flex-1 h-12 text-base"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : analyticsData ? (
          <>
            {/* 業務量トレンドグラフ */}
            <Card className="border border-slate-300 rounded-xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                  <TrendingUp className="h-5 w-5 shrink-0" />
                  業務量トレンド
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 14, fill: "#475569" }}
                      stroke="#cbd5e1"
                    />
                    <YAxis 
                      tick={{ fontSize: 14, fill: "#475569" }}
                      stroke="#cbd5e1"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        fontSize: "14px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: "14px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      name="案件数"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="inProgress"
                      stroke="#f59e0b"
                      name="進行中"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#10b981"
                      name="完了"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 入庫区分別業務量 */}
            <Card className="border border-slate-300 rounded-xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                  <BarChart3 className="h-5 w-5 shrink-0" />
                  入庫区分別業務量
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.serviceKindData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="serviceKind" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tick={{ fontSize: 14, fill: "#475569" }}
                      stroke="#cbd5e1"
                    />
                    <YAxis 
                      tick={{ fontSize: 14, fill: "#475569" }}
                      stroke="#cbd5e1"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        fontSize: "14px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: "14px" }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" name="案件数" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 繁忙期・閑散期の比較 */}
            <Card className="border border-slate-300 rounded-xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  繁忙期・閑散期の比較
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-base font-medium text-slate-700">平均案件数</div>
                      <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                        {Math.round(analyticsData.busyVsQuietData.average)}件
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-base font-medium text-red-700">繁忙期</div>
                      <div className="text-2xl font-bold text-red-700 tabular-nums mt-1">
                        {analyticsData.busyVsQuietData.busyPeriods.length}週
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-base font-medium text-blue-700">閑散期</div>
                      <div className="text-2xl font-bold text-blue-700 tabular-nums mt-1">
                        {analyticsData.busyVsQuietData.quietPeriods.length}週
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.busyVsQuietData.weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="week" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        tick={{ fontSize: 14, fill: "#475569" }}
                        stroke="#cbd5e1"
                      />
                      <YAxis 
                        tick={{ fontSize: 14, fill: "#475569" }}
                        stroke="#cbd5e1"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          fontSize: "14px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: "14px" }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" name="案件数" />
                      <Line
                        type="monotone"
                        dataKey={() => analyticsData.busyVsQuietData.average}
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        name="平均"
                        strokeWidth={2}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border border-slate-300 rounded-xl shadow-md">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-base text-slate-700">
                データがありません
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
