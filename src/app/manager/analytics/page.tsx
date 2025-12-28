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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchAnalyticsData, fetchRevenueAnalyticsData, fetchCustomerAnalyticsData, fetchEfficiencyAnalyticsData } from "@/lib/api";
import {
  getStartOfMonth,
  getEndOfMonth,
  getStartOfWeek,
  getEndOfWeek,
  AnalyticsData,
  RevenueAnalyticsData,
  CustomerAnalyticsData,
  EfficiencyAnalyticsData,
} from "@/lib/analytics-utils";
import { AppHeader } from "@/components/layout/app-header";
import { Calendar, TrendingUp, BarChart3, AlertCircle, DollarSign, Users, Clock, Repeat } from "lucide-react";

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
 * 金額をフォーマット
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * 業務分析ページ
 */
export default function BusinessAnalyticsPage() {
  const [dateRange, setDateRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");
  const [activeTab, setActiveTab] = useState<"business" | "revenue" | "customer" | "efficiency">("business");

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
  const { data: analyticsResponse, isLoading: isBusinessLoading } = useSWR(
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

  // 売上分析データを取得
  const { data: revenueResponse, isLoading: isRevenueLoading } = useSWR(
    `revenue-analytics-${dateRange}-${selectedPeriod.start.toISOString()}-${selectedPeriod.end.toISOString()}`,
    () =>
      fetchRevenueAnalyticsData(
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

  const revenueData: RevenueAnalyticsData | undefined =
    revenueResponse?.success && revenueResponse.data
      ? revenueResponse.data
      : undefined;

  // 顧客分析データを取得
  const { data: customerResponse, isLoading: isCustomerLoading } = useSWR(
    `customer-analytics-${selectedPeriod.start.toISOString()}-${selectedPeriod.end.toISOString()}`,
    () =>
      fetchCustomerAnalyticsData(
        selectedPeriod.start,
        selectedPeriod.end
      ),
    {
      revalidateOnFocus: false,
    }
  );

  // 業務効率分析データを取得
  const { data: efficiencyResponse, isLoading: isEfficiencyLoading } = useSWR(
    `efficiency-analytics-${selectedPeriod.start.toISOString()}-${selectedPeriod.end.toISOString()}`,
    () =>
      fetchEfficiencyAnalyticsData(
        selectedPeriod.start,
        selectedPeriod.end
      ),
    {
      revalidateOnFocus: false,
    }
  );

  const customerData: CustomerAnalyticsData | undefined =
    customerResponse?.success && customerResponse.data
      ? customerResponse.data
      : undefined;

  const efficiencyData: EfficiencyAnalyticsData | undefined =
    efficiencyResponse?.success && efficiencyResponse.data
      ? efficiencyResponse.data
      : undefined;

  return (
    <div className="flex-1 bg-slate-50 overflow-auto">
      <AppHeader
        isTopPage={true}
        hideBrandOnScroll={false}
        maxWidthClassName="max-w-7xl"
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ページタイトル */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-600 shrink-0" />
            レポート・分析
          </h1>
        </div>

        <div className="space-y-6">
        {/* タブ */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4 h-12">
            <TabsTrigger value="business" className="text-base">
              業務分析
            </TabsTrigger>
            <TabsTrigger value="revenue" className="text-base">
              売上分析
            </TabsTrigger>
            <TabsTrigger value="customer" className="text-base">
              顧客分析
            </TabsTrigger>
            <TabsTrigger value="efficiency" className="text-base">
              業務効率
            </TabsTrigger>
          </TabsList>

          {/* 期間選択 */}
          <Card className="border border-slate-300 rounded-xl shadow-md mt-6">
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

          {/* 業務分析タブ */}
          <TabsContent value="business" className="space-y-6 mt-6">
            {isBusinessLoading ? (
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
          </TabsContent>

          {/* 売上分析タブ */}
          <TabsContent value="revenue" className="space-y-6 mt-6">
            {isRevenueLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            ) : revenueData ? (
              <>
                {/* 主要指標カード */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border border-slate-300 rounded-xl shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-medium text-slate-700 mb-1">
                            平均単価
                          </p>
                          <p className="text-2xl font-bold text-slate-900 tabular-nums">
                            {formatPrice(revenueData.averagePrice)}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-300 rounded-xl shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-medium text-slate-700 mb-1">
                            推奨作業承認率
                          </p>
                          <p className="text-2xl font-bold text-slate-900 tabular-nums">
                            {revenueData.recommendedApprovalRate.toFixed(1)}%
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-300 rounded-xl shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-medium text-slate-700 mb-1">
                            総売上
                          </p>
                          <p className="text-2xl font-bold text-slate-900 tabular-nums">
                            {formatPrice(revenueData.totalRevenue)}
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 日次・週次・月次売上グラフ */}
                <Card className="border border-slate-300 rounded-xl shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                      <TrendingUp className="h-5 w-5 shrink-0" />
                      売上トレンド
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData.revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 14, fill: "#475569" }}
                          stroke="#cbd5e1"
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 14, fill: "#475569" }}
                          stroke="#cbd5e1"
                          tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 14, fill: "#475569" }}
                          stroke="#cbd5e1"
                        />
                        <Tooltip
                          contentStyle={{
                            fontSize: "14px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number | undefined, name: string | undefined) => {
                            if (value === undefined) return "";
                            if (name === "売上") {
                              return formatPrice(value);
                            }
                            return `${value}件`;
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "14px" }} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#3b82f6"
                          name="売上"
                          strokeWidth={2}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="count"
                          stroke="#10b981"
                          name="案件数"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 作業区分別売上 */}
                <Card className="border border-slate-300 rounded-xl shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                      <BarChart3 className="h-5 w-5 shrink-0" />
                      作業区分別売上
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueData.serviceKindRevenue}>
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
                          tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                        />
                        <Tooltip
                          contentStyle={{
                            fontSize: "14px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number | undefined) => value !== undefined ? formatPrice(value) : ""}
                        />
                        <Legend wrapperStyle={{ fontSize: "14px" }} />
                        <Bar dataKey="revenue" fill="#3b82f6" name="売上" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 部品売上 vs 工賃売上 */}
                <Card className="border border-slate-300 rounded-xl shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                      <BarChart3 className="h-5 w-5 shrink-0" />
                      部品売上 vs 工賃売上
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-base font-medium text-blue-700 mb-1">
                            部品売上
                          </div>
                          <div className="text-2xl font-bold text-blue-900 tabular-nums">
                            {formatPrice(revenueData.partsVsLabor.partsRevenue)}
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-base font-medium text-green-700 mb-1">
                            工賃売上
                          </div>
                          <div className="text-2xl font-bold text-green-900 tabular-nums">
                            {formatPrice(revenueData.partsVsLabor.laborRevenue)}
                          </div>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "部品売上",
                                value: revenueData.partsVsLabor.partsRevenue,
                              },
                              {
                                name: "工賃売上",
                                value: revenueData.partsVsLabor.laborRevenue,
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: { name?: string; percent?: number }) =>
                              `${name || ""}: ${percent !== undefined ? (percent * 100).toFixed(1) : "0.0"}%`
                            }
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            <Cell fill="#3b82f6" />
                            <Cell fill="#10b981" />
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              fontSize: "14px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number | undefined) => value !== undefined ? formatPrice(value) : ""}
                          />
                          <Legend wrapperStyle={{ fontSize: "14px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 技術者別生産性 */}
                {revenueData.mechanicProductivity.length > 0 && (
                  <Card className="border border-slate-300 rounded-xl shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                        <Users className="h-5 w-5 shrink-0" />
                        技術者別生産性
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueData.mechanicProductivity}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="mechanicName"
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            tick={{ fontSize: 14, fill: "#475569" }}
                            stroke="#cbd5e1"
                          />
                          <YAxis
                            tick={{ fontSize: 14, fill: "#475569" }}
                            stroke="#cbd5e1"
                            tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                          />
                          <Tooltip
                            contentStyle={{
                              fontSize: "14px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number | undefined) => value !== undefined ? formatPrice(value) : ""}
                          />
                          <Legend wrapperStyle={{ fontSize: "14px" }} />
                          <Bar dataKey="revenue" fill="#3b82f6" name="売上" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
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
          </TabsContent>

          {/* 顧客分析タブ */}
          <TabsContent value="customer" className="space-y-6 mt-6">
            {isCustomerLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            ) : customerData ? (
              <>
                {/* 主要指標カード */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border border-slate-300 rounded-xl shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-medium text-slate-700 mb-1">
                            リピート率
                          </p>
                          <p className="text-2xl font-bold text-slate-900 tabular-nums">
                            {customerData.repeatRate.toFixed(1)}%
                          </p>
                        </div>
                        <Repeat className="h-8 w-8 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-300 rounded-xl shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-medium text-slate-700 mb-1">
                            リピート顧客数
                          </p>
                          <p className="text-2xl font-bold text-slate-900 tabular-nums">
                            {customerData.repeatCustomers}人
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-300 rounded-xl shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-medium text-slate-700 mb-1">
                            新規顧客数
                          </p>
                          <p className="text-2xl font-bold text-slate-900 tabular-nums">
                            {customerData.newCustomers}人
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 顧客分析詳細 */}
                <Card className="border border-slate-300 rounded-xl shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                      <Users className="h-5 w-5 shrink-0" />
                      顧客分析詳細
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="text-base font-medium text-slate-700 mb-1">
                            総顧客数
                          </div>
                          <div className="text-2xl font-bold text-slate-900 tabular-nums">
                            {customerData.totalCustomers}人
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="text-base font-medium text-slate-700 mb-1">
                            顧客あたりの平均案件数
                          </div>
                          <div className="text-2xl font-bold text-slate-900 tabular-nums">
                            {customerData.averageJobsPerCustomer.toFixed(1)}件
                          </div>
                        </div>
                      </div>
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
          </TabsContent>

          {/* 業務効率分析タブ */}
          <TabsContent value="efficiency" className="space-y-6 mt-6">
            {isEfficiencyLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            ) : efficiencyData ? (
              <>
                {/* 主要指標カード */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border border-slate-300 rounded-xl shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-medium text-slate-700 mb-1">
                            平均作業時間
                          </p>
                          <p className="text-2xl font-bold text-slate-900 tabular-nums">
                            {efficiencyData.averageWorkDuration.toFixed(1)}分
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-300 rounded-xl shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-medium text-slate-700 mb-1">
                            総作業時間
                          </p>
                          <p className="text-2xl font-bold text-slate-900 tabular-nums">
                            {Math.round(efficiencyData.totalWorkDuration / 60)}時間
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-300 rounded-xl shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-medium text-slate-700 mb-1">
                            総作業記録数
                          </p>
                          <p className="text-2xl font-bold text-slate-900 tabular-nums">
                            {efficiencyData.totalWorkRecords}件
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 工程別ボトルネック分析 */}
                {efficiencyData.phaseBottlenecks.length > 0 && (
                  <Card className="border border-slate-300 rounded-xl shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        工程別ボトルネック分析
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={efficiencyData.phaseBottlenecks}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="phase"
                            angle={-45}
                            textAnchor="end"
                            height={120}
                            tick={{ fontSize: 14, fill: "#475569" }}
                            stroke="#cbd5e1"
                          />
                          <YAxis
                            tick={{ fontSize: 14, fill: "#475569" }}
                            stroke="#cbd5e1"
                            tickFormatter={(value) => `${value.toFixed(1)}時間`}
                          />
                          <Tooltip
                            contentStyle={{
                              fontSize: "14px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(1)}時間` : ""}
                          />
                          <Legend wrapperStyle={{ fontSize: "14px" }} />
                          <Bar dataKey="averageDuration" fill="#ef4444" name="平均滞留時間" />
                        </BarChart>
                      </ResponsiveContainer>

                      {/* ボトルネック詳細テーブル */}
                      <div className="mt-6 space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">
                          工程別詳細
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b-2 border-slate-300">
                                <th className="text-left p-3 text-base font-semibold text-slate-900">
                                  工程
                                </th>
                                <th className="text-right p-3 text-base font-semibold text-slate-900">
                                  平均滞留時間
                                </th>
                                <th className="text-right p-3 text-base font-semibold text-slate-900">
                                  最大滞留時間
                                </th>
                                <th className="text-right p-3 text-base font-semibold text-slate-900">
                                  最小滞留時間
                                </th>
                                <th className="text-right p-3 text-base font-semibold text-slate-900">
                                  案件数
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {efficiencyData.phaseBottlenecks.map((phase, index) => (
                                <tr
                                  key={phase.phase}
                                  className={`border-b border-slate-200 ${
                                    index % 2 === 0 ? "bg-white" : "bg-slate-50"
                                  }`}
                                >
                                  <td className="p-3 text-base text-slate-900">
                                    {phase.phase}
                                  </td>
                                  <td className="p-3 text-base text-right text-slate-900 tabular-nums">
                                    {phase.averageDuration.toFixed(1)}時間
                                  </td>
                                  <td className="p-3 text-base text-right text-slate-700 tabular-nums">
                                    {phase.maxDuration.toFixed(1)}時間
                                  </td>
                                  <td className="p-3 text-base text-right text-slate-700 tabular-nums">
                                    {phase.minDuration.toFixed(1)}時間
                                  </td>
                                  <td className="p-3 text-base text-right text-slate-700 tabular-nums">
                                    {phase.jobCount}件
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
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
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  );
}
