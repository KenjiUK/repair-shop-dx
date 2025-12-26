"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ListTodo, Settings, Users, AlertTriangle, ShieldCheck, CalendarCheck, Droplet, Circle, Activity, Wrench, Zap, Package, Sparkles, Paintbrush, Shield, FileText } from "lucide-react";
import { ZohoJob, ServiceKind } from "@/types";
import { FilterState } from "@/lib/filter-utils";
import { isImportantCustomer } from "@/lib/important-customer-flag";

interface JobFilterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filterModalType: "status" | "serviceKind" | "mechanic" | "additional" | null;
    setFilterModalType: (type: "status" | "serviceKind" | "mechanic" | "additional" | null) => void;
    jobs: ZohoJob[];
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export function JobFilterDialog({
    open,
    onOpenChange,
    filterModalType,
    setFilterModalType,
    jobs,
    filters,
    setFilters,
}: JobFilterDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                        {filterModalType === "status" && (
                            <>
                                <ListTodo className="h-5 w-5 text-slate-600 shrink-0" />
                                ステータス
                            </>
                        )}
                        {filterModalType === "serviceKind" && (
                            <>
                                <Settings className="h-5 w-5 text-slate-600 shrink-0" />
                                入庫区分
                            </>
                        )}
                        {filterModalType === "mechanic" && (
                            <>
                                <Users className="h-5 w-5 text-slate-600 shrink-0" />
                                整備士
                            </>
                        )}
                        {filterModalType === "additional" && (
                            <>
                                <AlertTriangle className="h-5 w-5 text-slate-600 shrink-0" />
                                特殊条件
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-base text-slate-700">
                        フィルターを選択してください（複数選択可能）
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 mt-4">
                    {filterModalType === "status" && (
                        <>
                            {[
                                { label: "入庫待ち", value: "入庫待ち" },
                                { label: "診断待ち", value: "入庫済み" },
                                { label: "見積作成待ち", value: "見積作成待ち" },
                                { label: "お客様承認待ち", value: "見積提示済み" },
                                { label: "作業待ち", value: "作業待ち" },
                                { label: "引渡待ち", value: "出庫待ち" },
                                { label: "部品調達待ち", value: "部品調達待ち" },
                                { label: "部品発注待ち", value: "部品発注待ち" },
                            ].map(({ label, value }) => {
                                const count = (jobs ?? []).filter((j) => j.field5 === value).length;
                                const isSelected = filters.status.includes(value);
                                return (
                                    <label
                                        key={value}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-slate-50 transition-colors",
                                            isSelected && "bg-blue-50 border-blue-500"
                                        )}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(checked) => {
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    status: checked
                                                        ? [...prev.status, value]
                                                        : prev.status.filter((s) => s !== value),
                                                }));
                                            }}
                                        />
                                        <span className="flex-1 text-base font-medium text-slate-900">{label}</span>
                                        {count > 0 && (
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-0.5 rounded-full">
                                                {count}
                                            </Badge>
                                        )}
                                    </label>
                                );
                            })}
                        </>
                    )}

                    {filterModalType === "serviceKind" && (
                        <>
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
                                const count = (jobs ?? []).filter((j) => {
                                    const serviceKinds = j.field_service_kinds || (j.serviceKind ? [j.serviceKind] : []);
                                    return serviceKinds.includes(serviceKind);
                                }).length;
                                const isSelected = filters.serviceKind.includes(serviceKind);
                                return (
                                    <label
                                        key={serviceKind}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-slate-50 transition-colors",
                                            isSelected && "bg-blue-50 border-blue-500"
                                        )}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(checked) => {
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    serviceKind: checked
                                                        ? [...prev.serviceKind, serviceKind]
                                                        : prev.serviceKind.filter((s) => s !== serviceKind),
                                                }));
                                            }}
                                        />
                                        <Icon className={cn("h-4 w-4 shrink-0", color)} />
                                        <span className="flex-1 text-base font-medium text-slate-900">{serviceKind}</span>
                                        {count > 0 && (
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-0.5 rounded-full">
                                                {count}
                                            </Badge>
                                        )}
                                    </label>
                                );
                            })}
                        </>
                    )}

                    {filterModalType === "mechanic" && (
                        <>
                            {(() => {
                                const mechanicCounts = (jobs ?? []).reduce((acc, job) => {
                                    const mechanicName = job.assignedMechanic || "未割り当て";
                                    acc[mechanicName] = (acc[mechanicName] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>);

                                const sortedMechanics = Object.entries(mechanicCounts)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 10);

                                return sortedMechanics.map(([mechanicName, count]) => {
                                    const isSelected = filters.mechanic.includes(mechanicName);
                                    return (
                                        <label
                                            key={mechanicName}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-slate-50 transition-colors",
                                                isSelected && "bg-blue-50 border-blue-500"
                                            )}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) => {
                                                    setFilters((prev) => ({
                                                        ...prev,
                                                        mechanic: checked
                                                            ? [...prev.mechanic, mechanicName]
                                                            : prev.mechanic.filter((m) => m !== mechanicName),
                                                    }));
                                                }}
                                            />
                                            <span className="flex-1 text-base font-medium text-slate-900">{mechanicName}</span>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-0.5 rounded-full">
                                                {count}
                                            </Badge>
                                        </label>
                                    );
                                });
                            })()}
                        </>
                    )}

                    {filterModalType === "additional" && (
                        <>
                            {(() => {
                                const urgentCount = (jobs ?? []).filter((j) => j.field?.includes("緊急") || false).length;
                                const importantCount = (jobs ?? []).filter((j) => {
                                    const customerId = j.field4?.id;
                                    return customerId ? isImportantCustomer(customerId) : false;
                                }).length;
                                const longPartsCount = (jobs ?? []).filter((j) => {
                                    return j.field5 === "部品調達待ち" && j.field22 && (new Date().getTime() - new Date(j.field22).getTime()) > 7 * 24 * 60 * 60 * 1000;
                                }).length;

                                return (
                                    <>
                                        <label
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-slate-50 transition-colors",
                                                filters.isUrgent === true && "bg-blue-50 border-blue-500"
                                            )}
                                        >
                                            <Checkbox
                                                checked={filters.isUrgent === true}
                                                onCheckedChange={(checked) => {
                                                    setFilters((prev) => ({
                                                        ...prev,
                                                        isUrgent: checked ? true : null,
                                                    }));
                                                }}
                                            />
                                            <span className="flex-1 text-base font-medium text-slate-900">緊急案件のみ</span>
                                            {urgentCount > 0 && (
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-0.5 rounded-full">
                                                    {urgentCount}
                                                </Badge>
                                            )}
                                        </label>

                                        <label
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-slate-50 transition-colors",
                                                filters.isImportant === true && "bg-blue-50 border-blue-500"
                                            )}
                                        >
                                            <Checkbox
                                                checked={filters.isImportant === true}
                                                onCheckedChange={(checked) => {
                                                    setFilters((prev) => ({
                                                        ...prev,
                                                        isImportant: checked ? true : null,
                                                    }));
                                                }}
                                            />
                                            <span className="flex-1 text-base font-medium text-slate-900">重要顧客のみ</span>
                                            {importantCount > 0 && (
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-0.5 rounded-full">
                                                    {importantCount}
                                                </Badge>
                                            )}
                                        </label>

                                        <label
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-slate-50 transition-colors",
                                                filters.longPartsProcurement === true && "bg-blue-50 border-blue-500"
                                            )}
                                        >
                                            <Checkbox
                                                checked={filters.longPartsProcurement === true}
                                                onCheckedChange={(checked) => {
                                                    setFilters((prev) => ({
                                                        ...prev,
                                                        longPartsProcurement: checked ? true : null,
                                                    }));
                                                }}
                                            />
                                            <span className="flex-1 text-base font-medium text-slate-900">長期化部品調達</span>
                                            {longPartsCount > 0 && (
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-0.5 rounded-full">
                                                    {longPartsCount}
                                                </Badge>
                                            )}
                                        </label>
                                    </>
                                );
                            })()}
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-200">
                    <Button
                        variant="outline"
                        size="default"
                        onClick={() => {
                            if (filterModalType === "status") {
                                setFilters((prev) => ({ ...prev, status: [] }));
                            } else if (filterModalType === "serviceKind") {
                                setFilters((prev) => ({ ...prev, serviceKind: [] }));
                            } else if (filterModalType === "mechanic") {
                                setFilters((prev) => ({ ...prev, mechanic: [] }));
                            } else if (filterModalType === "additional") {
                                setFilters((prev) => ({
                                    ...prev,
                                    isUrgent: null,
                                    isImportant: null,
                                    longPartsProcurement: null,
                                }));
                            }
                        }}
                    >
                        クリア
                    </Button>
                    <Button
                        size="default"
                        onClick={() => setFilterModalType(null)}
                    >
                        閉じる
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
