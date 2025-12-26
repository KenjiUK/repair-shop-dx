"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, X, ChevronDown, ChevronUp, Filter, Calendar, ArrowDownUp, Clock } from "lucide-react";
import { ZohoJob, ServiceKind } from "@/types";
import { cn } from "@/lib/utils";
import { fetchJobs } from "@/lib/api";
import { AppHeader } from "@/components/layout/app-header";
import { JobCard } from "@/components/features/job-card";
import { searchJobs } from "@/lib/search-utils";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchAllCourtesyCars } from "@/lib/api";
import { CourtesyCar } from "@/types";
import { FilterState, applyFilters, getActiveFilterCount } from "@/lib/filter-utils";
import { ShieldCheck, CalendarCheck, Droplet, Circle, Settings, Activity, Wrench, Zap, Package, Shield, Sparkles, Paintbrush, FileText } from "lucide-react";

/**
 * 履歴検索画面
 * 過去の作業記録を検索・閲覧するページ
 */
export default function JobHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // フィルター状態
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    serviceKind: [],
    mechanic: [],
    isUrgent: null,
    isImportant: null,
    partsProcurement: null,
    longPendingApproval: null,
    longPartsProcurement: null,
  });

  // 日付範囲フィルター
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: "",
    endDate: "",
  });

  // ソートオプション
  const [sortOption, setSortOption] = useState<"dateDesc" | "dateAsc" | "status" | "customer">("dateDesc");

  // 表示件数（「もっと見る」機能）
  const [displayCount, setDisplayCount] = useState(50);
  const DISPLAY_INCREMENT = 50;

  // フィルターセクションの展開状態管理（localStorageから読み込み）
  const [filterSectionsOpen, setFilterSectionsOpen] = useState<{
    dateRange: boolean;
    status: boolean;
    serviceKind: boolean;
    mechanic: boolean;
    additional: boolean;
  }>(() => {
    if (typeof window === "undefined") {
      return { dateRange: false, status: true, serviceKind: true, mechanic: false, additional: false };
    }
    try {
      const saved = localStorage.getItem("history-filter-sections-open");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to load filter sections state:", error);
    }
    return { dateRange: false, status: true, serviceKind: true, mechanic: false, additional: false };
  });

  // フィルターセクションの展開状態をlocalStorageに保存
  useEffect(() => {
    try {
      localStorage.setItem("history-filter-sections-open", JSON.stringify(filterSectionsOpen));
    } catch (error) {
      console.error("Failed to save filter sections state:", error);
    }
  }, [filterSectionsOpen]);

  // 全案件を取得（出庫済みも含む）
  const { data: jobs = [], isLoading: isJobsLoading } = useSWR<ZohoJob[]>(
    "all-jobs",
    async () => {
      const result = await fetchJobs();
      return result.success && result.data ? result.data : [];
    }
  );

  const { data: courtesyCars = [], isLoading: isCarsLoading } = useSWR<CourtesyCar[]>(
    "courtesy-cars",
    async () => {
      const result = await fetchAllCourtesyCars();
      return result.success && result.data ? result.data : [];
    }
  );

  // アクティブなフィルターがある場合、そのセクションは常に展開
  const isStatusFilterActive = filters.status && filters.status.length > 0;
  const isServiceKindFilterActive = filters.serviceKind && filters.serviceKind.length > 0;
  const isMechanicFilterActive = filters.mechanic && filters.mechanic.length > 0;
  const isDateRangeActive = !!dateRange.startDate || !!dateRange.endDate;
  const isAdditionalFilterActive = filters.isUrgent !== null || filters.isImportant !== null || filters.longPartsProcurement === true;

  const dateRangeSectionOpen = isDateRangeActive || filterSectionsOpen.dateRange;
  const statusSectionOpen = isStatusFilterActive || filterSectionsOpen.status;
  const serviceKindSectionOpen = isServiceKindFilterActive || filterSectionsOpen.serviceKind;
  const mechanicSectionOpen = isMechanicFilterActive || filterSectionsOpen.mechanic;
  const additionalSectionOpen = isAdditionalFilterActive || filterSectionsOpen.additional;

  // 検索・フィルターロジック
  const filteredJobs = useMemo(() => {
    if (!jobs) return [];

    let filtered = jobs;

    // 日付範囲フィルターを適用
    if (dateRange.startDate || dateRange.endDate) {
      filtered = filtered.filter((job) => {
        if (!job.field22) return false;
        const jobDate = new Date(job.field22);
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange.endDate ? new Date(dateRange.endDate + "T23:59:59") : null;

        if (startDate && jobDate < startDate) return false;
        if (endDate && jobDate > endDate) return false;
        return true;
      });
    }

    // フィルターを適用
    filtered = applyFilters(filtered, filters);

    // 検索フィルターを適用
    if (debouncedSearchQuery.trim()) {
      filtered = searchJobs(filtered, debouncedSearchQuery);
    }

    // ソートを適用
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "dateDesc":
          // 日付順（新しい順）
          const dateA = a.field22 ? new Date(a.field22).getTime() : 0;
          const dateB = b.field22 ? new Date(b.field22).getTime() : 0;
          return dateB - dateA;
        case "dateAsc":
          // 日付順（古い順）
          const dateAAsc = a.field22 ? new Date(a.field22).getTime() : 0;
          const dateBAsc = b.field22 ? new Date(b.field22).getTime() : 0;
          return dateAAsc - dateBAsc;
        case "status":
          // ステータス順
          const statusOrder: Record<string, number> = {
            "入庫待ち": 1,
            "入庫済み": 2,
            "診断待ち": 3,
            "見積作成待ち": 4,
            "見積提示済み": 5,
            "お客様承認待ち": 6,
            "作業待ち": 7,
            "出庫待ち": 8,
            "出庫済み": 9,
            "部品調達待ち": 10,
            "部品発注待ち": 11,
          };
          const statusA = statusOrder[a.field5] || 999;
          const statusB = statusOrder[b.field5] || 999;
          return statusA - statusB;
        case "customer":
          // 顧客名順
          const customerA = a.field4?.name || "";
          const customerB = b.field4?.name || "";
          return customerA.localeCompare(customerB, "ja");
        default:
          return 0;
      }
    });

    return filtered;
  }, [jobs, filters, debouncedSearchQuery, dateRange, sortOption]);

  // 表示用のジョブリスト（「もっと見る」機能）
  const displayedJobs = useMemo(() => {
    return filteredJobs.slice(0, displayCount);
  }, [filteredJobs, displayCount]);

  // すべてのフィルターをリセット
  const handleResetFilters = () => {
    setFilters({
      status: [],
      serviceKind: [],
      mechanic: [],
      isUrgent: null,
      isImportant: null,
      partsProcurement: null,
      longPendingApproval: null,
      longPartsProcurement: null,
    });
    setDateRange({ startDate: "", endDate: "" });
    setSearchQuery("");
  };

  // クイック日付範囲選択
  const handleQuickDateRange = (range: "week" | "month" | "3months" | "year") => {
    const today = new Date();
    const startDate = new Date();

    switch (range) {
      case "week":
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "3months":
        startDate.setMonth(today.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    setDateRange({
      startDate: startDate.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    });
  };

  if (isJobsLoading || isCarsLoading) {
    return (
      <div className="flex-1 bg-slate-50 overflow-auto">
        <AppHeader
          isTopPage={true}
          hideBrandOnScroll={false}
        />
        <main className="max-w-5xl mx-auto px-4 py-6">
          <Skeleton className="h-[600px] w-full" />
        </main>
      </div>
    );
  }

  // ステータス一覧（出庫済みを含む）
  const statusList = [
    "入庫待ち",
    "入庫済み",
    "診断待ち",
    "見積作成待ち",
    "見積提示済み",
    "お客様承認待ち",
    "作業待ち",
    "出庫待ち",
    "出庫済み",
    "部品調達待ち",
    "部品発注待ち",
  ];

  return (
    <div className="flex-1 bg-slate-50 overflow-auto">
      <AppHeader
        isTopPage={true}
        hideBrandOnScroll={false}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchJobs={jobs}
        onSuggestionSelect={(suggestion) => {
          setSearchQuery(suggestion.value);
        }}
      />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* ページタイトル */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Search className="h-5 w-5 text-slate-600 shrink-0" />
            履歴検索
          </h1>
          <p className="text-base text-slate-700 mt-2">
            過去の作業記録を検索・閲覧できます
          </p>
        </div>

        {/* フィルターセクション */}
        <Card className="border border-slate-300 rounded-xl shadow-md mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Filter className="h-5 w-5 text-slate-600 shrink-0" />
                フィルター
              </CardTitle>
              {(getActiveFilterCount(filters) > 0 || dateRange.startDate || dateRange.endDate || searchQuery.trim()) && (
                <Button
                  variant="ghost"
                  onClick={handleResetFilters}
                  className="gap-1 h-12 text-base font-medium"
                >
                  <X className="h-5 w-5 shrink-0" />
                  すべてリセット
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 日付範囲フィルター */}
            <Collapsible
              open={dateRangeSectionOpen}
              onOpenChange={(open) => {
                if (!isDateRangeActive) {
                  setFilterSectionsOpen((prev) => ({ ...prev, dateRange: open }));
                }
              }}
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full mb-2">
                  <Label className="text-base font-semibold text-slate-800 cursor-pointer flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-slate-600 shrink-0" />
                    日付範囲
                  </Label>
                  {dateRangeSectionOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-600 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-600 shrink-0" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-3">
                  {/* クイック選択 */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleQuickDateRange("week")}
                      className="h-12 text-base font-medium"
                    >
                      過去1週間
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleQuickDateRange("month")}
                      className="h-12 text-base font-medium"
                    >
                      過去1ヶ月
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleQuickDateRange("3months")}
                      className="h-12 text-base font-medium"
                    >
                      過去3ヶ月
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleQuickDateRange("year")}
                      className="h-12 text-base font-medium"
                    >
                      過去1年
                    </Button>
                  </div>
                  {/* 日付入力 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="start-date" className="text-base font-medium text-slate-700">
                        開始日
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                        className="mt-1.5 h-12 text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date" className="text-base font-medium text-slate-700">
                        終了日
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                        className="mt-1.5 h-12 text-base"
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* ステータスフィルター */}
            <Collapsible
              open={statusSectionOpen}
              onOpenChange={(open) => {
                if (!isStatusFilterActive) {
                  setFilterSectionsOpen((prev) => ({ ...prev, status: open }));
                }
              }}
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full mb-2">
                  <Label className="text-base font-semibold text-slate-800 cursor-pointer">
                    ステータス
                  </Label>
                  {statusSectionOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-600 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-600 shrink-0" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-wrap gap-2">
                  {statusList.map((status) => {
                    const count = jobs.filter((job) => job.field5 === status).length;
                    const isSelected = filters.status && filters.status.length > 0 && filters.status[0] === status;
                    return (
                      <Button
                        key={status}
                        variant={isSelected ? "default" : "outline"}
                        size="default"
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            status: isSelected ? [] : [status],
                          }));
                        }}
                        className={cn(
                          "h-12 text-base",
                          isSelected && "bg-slate-600 hover:bg-slate-700 text-white"
                        )}
                      >
                        {status}
                        {count > 0 && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "ml-1 text-base font-medium px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap tabular-nums",
                              isSelected
                                ? "bg-white/20 text-white border-white/30"
                                : "bg-slate-100 text-slate-700 border-slate-300"
                            )}
                          >
                            {count}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* 作業種類フィルター */}
            <Collapsible
              open={serviceKindSectionOpen}
              onOpenChange={(open) => {
                if (!isServiceKindFilterActive) {
                  setFilterSectionsOpen((prev) => ({ ...prev, serviceKind: open }));
                }
              }}
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full mb-2">
                  <Label className="text-base font-semibold text-slate-800 cursor-pointer">
                    入庫区分
                  </Label>
                  {serviceKindSectionOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-600 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-600 shrink-0" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-wrap gap-2">
                  {([
                    { kind: "車検" as ServiceKind, icon: ShieldCheck, color: "text-cyan-600" },
                    { kind: "12ヵ月点検" as ServiceKind, icon: CalendarCheck, color: "text-cyan-600" },
                    { kind: "エンジンオイル交換" as ServiceKind, icon: Droplet, color: "text-emerald-600" },
                    { kind: "タイヤ交換・ローテーション" as ServiceKind, icon: Circle, color: "text-emerald-600" },
                    { kind: "その他のメンテナンス" as ServiceKind, icon: Settings, color: "text-emerald-600" },
                    { kind: "故障診断" as ServiceKind, icon: Activity, color: "text-rose-600" },
                    { kind: "修理・整備" as ServiceKind, icon: Wrench, color: "text-orange-600" },
                    { kind: "チューニング" as ServiceKind, icon: Zap, color: "text-violet-600" },
                    { kind: "パーツ取付" as ServiceKind, icon: Package, color: "text-violet-600" },
                    { kind: "コーティング" as ServiceKind, icon: Shield, color: "text-violet-600" },
                    { kind: "レストア" as ServiceKind, icon: Sparkles, color: "text-violet-600" },
                    { kind: "板金・塗装" as ServiceKind, icon: Paintbrush, color: "text-violet-600" },
                    { kind: "その他" as ServiceKind, icon: FileText, color: "text-slate-700" },
                  ]).map(({ kind: serviceKind, icon: Icon, color }) => {
                    const count = jobs.filter((job) => {
                      const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
                      return serviceKinds.includes(serviceKind);
                    }).length;
                    const isSelected = filters.serviceKind && filters.serviceKind.length > 0 && filters.serviceKind[0] === serviceKind;
                    return (
                      <Button
                        key={serviceKind}
                        variant={isSelected ? "default" : "outline"}
                        size="default"
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            serviceKind: isSelected ? [] : [serviceKind],
                          }));
                        }}
                        className={cn(
                          "h-12 text-base font-medium flex items-center gap-2",
                          isSelected && "bg-cyan-600 hover:bg-cyan-700 text-white"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-white" : color)} />
                        {serviceKind}
                        {count > 0 && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "ml-1 text-base font-medium px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap tabular-nums",
                              isSelected
                                ? "bg-white/20 text-white border-white/30"
                                : "bg-slate-100 text-slate-700 border-slate-300"
                            )}
                          >
                            {count}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* 整備士フィルター */}
            <Collapsible
              open={mechanicSectionOpen}
              onOpenChange={(open) => {
                if (!isMechanicFilterActive) {
                  setFilterSectionsOpen((prev) => ({ ...prev, mechanic: open }));
                }
              }}
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full mb-2">
                  <Label className="text-base font-semibold text-slate-800 cursor-pointer">
                    整備士
                  </Label>
                  {mechanicSectionOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-600 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-600 shrink-0" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const mechanicCounts = jobs.reduce((acc, job) => {
                      const mechanicName = job.assignedMechanic || "未割り当て";
                      acc[mechanicName] = (acc[mechanicName] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);

                    const sortedMechanics = Object.entries(mechanicCounts)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 10);

                    return sortedMechanics.map(([mechanicName, count]) => {
                      const isSelected = filters.mechanic && filters.mechanic.length > 0 && filters.mechanic[0] === mechanicName;
                      return (
                        <Button
                          key={mechanicName}
                          variant={isSelected ? "default" : "outline"}
                          size="default"
                          onClick={() => {
                            setFilters((prev) => ({
                              ...prev,
                              mechanic: isSelected ? [] : [mechanicName],
                            }));
                          }}
                          className={cn(
                            "h-12 text-base font-medium",
                            isSelected && "bg-purple-600 hover:bg-purple-700 text-white"
                          )}
                        >
                          {mechanicName}
                          <Badge
                            variant="secondary"
                            className={cn(
                              "ml-1 text-base font-medium px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap tabular-nums",
                              isSelected
                                ? "bg-white/20 text-white border-white/30"
                                : "bg-slate-100 text-slate-700 border-slate-300"
                            )}
                          >
                            {count}
                          </Badge>
                        </Button>
                      );
                    });
                  })()}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* 追加フィルター */}
            <Collapsible
              open={additionalSectionOpen}
              onOpenChange={(open) => {
                if (!isAdditionalFilterActive) {
                  setFilterSectionsOpen((prev) => ({ ...prev, additional: open }));
                }
              }}
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full mb-2">
                  <Label className="text-base font-semibold text-slate-800 cursor-pointer">
                    追加フィルター
                  </Label>
                  {additionalSectionOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-600 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-600 shrink-0" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filters.isImportant === true ? "default" : "outline"}
                    size="default"
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        isImportant: prev.isImportant === true ? null : true,
                      }));
                    }}
                    className={cn(
                      "h-12 text-base font-medium",
                      filters.isImportant === true && "bg-amber-500 hover:bg-amber-600 text-white"
                    )}
                  >
                    重要顧客のみ
                    {filters.isImportant === true && filteredJobs.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 text-base font-medium px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap tabular-nums bg-white/20 text-white border-white/30"
                      >
                        {filteredJobs.length}
                      </Badge>
                    )}
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* アクティブフィルター表示 */}
            {getActiveFilterCount(filters) > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                {filters.status && filters.status.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer hover:bg-slate-200 text-base font-medium px-2.5 py-1"
                    onClick={() => setFilters((prev) => ({ ...prev, status: [] }))}
                  >
                    {filters.status[0]}
                    <X className="h-4 w-4 shrink-0" />
                  </Badge>
                )}
                {filters.serviceKind && filters.serviceKind.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer hover:bg-slate-200 text-base font-medium px-2.5 py-1"
                    onClick={() => setFilters((prev) => ({ ...prev, serviceKind: [] }))}
                  >
                    {filters.serviceKind[0]}
                    <X className="h-4 w-4 shrink-0" />
                  </Badge>
                )}
                {filters.mechanic && filters.mechanic.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer hover:bg-slate-200 text-base font-medium px-2.5 py-1"
                    onClick={() => setFilters((prev) => ({ ...prev, mechanic: [] }))}
                  >
                    {filters.mechanic[0]}
                    <X className="h-4 w-4 shrink-0" />
                  </Badge>
                )}
                {(dateRange.startDate || dateRange.endDate) && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer hover:bg-slate-200 text-base font-medium px-2.5 py-1"
                    onClick={() => setDateRange({ startDate: "", endDate: "" })}
                  >
                    日付範囲
                    <X className="h-4 w-4 shrink-0" />
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 検索結果サマリーとソート */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-3 py-1.5 rounded-full tabular-nums"
            >
              検索結果: {filteredJobs.length}件
            </Badge>
            {debouncedSearchQuery.trim() && (
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-700 border-blue-300 text-base font-medium px-3 py-1.5 rounded-full"
              >
                「{debouncedSearchQuery}」で検索中
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sort-select" className="text-base text-slate-700 font-medium flex items-center gap-2">
              <ArrowDownUp className="h-5 w-5 text-slate-600 shrink-0" />
              並び替え:
            </Label>
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as typeof sortOption)}>
              <SelectTrigger id="sort-select" className="w-48 h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dateDesc">日付順（新しい順）</SelectItem>
                <SelectItem value="dateAsc">日付順（古い順）</SelectItem>
                <SelectItem value="status">ステータス順</SelectItem>
                <SelectItem value="customer">顧客名順</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 案件リスト */}
        {filteredJobs.length === 0 ? (
          <Card className="border border-slate-300 rounded-xl shadow-md">
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-base text-slate-700 mb-2">
                {debouncedSearchQuery.trim() || getActiveFilterCount(filters) > 0 || dateRange.startDate || dateRange.endDate
                  ? "該当する案件が見つかりませんでした"
                  : "検索キーワードを入力するか、フィルターを設定してください"}
              </p>
              {(debouncedSearchQuery.trim() || getActiveFilterCount(filters) > 0 || dateRange.startDate || dateRange.endDate) && (
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="mt-4 gap-1 h-12 text-base font-medium"
                >
                  <X className="h-5 w-5 shrink-0" />
                  フィルターをリセット
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {displayedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onCheckIn={(job) => {
                    // 履歴検索ページでは入庫処理は無効（閲覧専用）
                  }}
                  courtesyCars={courtesyCars}
                />
              ))}
            </div>

            {/* 「もっと見る」ボタン */}
            {filteredJobs.length > displayCount && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => setDisplayCount((prev) => prev + DISPLAY_INCREMENT)}
                  className="h-12 text-base font-medium"
                >
                  <Clock className="h-5 w-5 mr-2 shrink-0" />
                  もっと見る（あと{filteredJobs.length - displayCount}件）
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
