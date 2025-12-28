"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateInspectionRecordPDF, InspectionRecordData } from '@/lib/inspection-pdf-generator';
import { getEstimatePdfBlobUrl, EstimatePdfOptions } from '@/lib/pdf-generator';
import { generateWorkOrderPDF } from '@/lib/work-order-pdf-generator';
import { WorkOrderPDFData } from '@/types';
import { generateInspectionTemplatePDF, InspectionTemplateType } from '@/lib/inspection-template-pdf-generator';

export default function PdfTestPage() {
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateInspection = async () => {
        setLoading('inspection');
        setError(null);
        try {
            const mockData: InspectionRecordData = {
                vehicle: {
                    ownerName: "山田 太郎",
                    vehicleName: "プリウス ZVW30",
                    licensePlate: "品川 300 あ 1234",
                    engineType: "2ZR-3JM",
                    firstRegistrationYear: "平成25年",
                    chassisNumber: "ZVW30-1234567"
                },
                inspectionItems: [
                    { id: "engine-room-001", name: "パワー・ステアリング", category: "engine_room", status: "green" },
                    { id: "engine-room-002", name: "冷却装置", category: "engine_room", status: "yellow", comment: "冷却水少なめ" },
                    { id: "chassis-004", name: "ブレーキパッド（前）", category: "chassis", status: "green", measurementValue: 8.5, measurement: { unit: "mm", type: 'number' } as any },
                ],
                replacementParts: [
                    { name: "エンジンオイル", quantity: 4.0, unit: "L" },
                    { name: "オイルエレメント", quantity: 1, unit: "個" }
                ],
                mechanicName: "鈴木 一郎",
                mileage: 54321,
                inspectionDate: new Date().toISOString(),
            };

            const result = await generateInspectionRecordPDF(mockData);
            if (result.success && result.data) {
                const url = URL.createObjectURL(result.data);
                window.open(url, '_blank');
            } else {
                setError(result.error?.message || "Generation failed");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(null);
        }
    };

    const handleGenerateEstimate = async () => {
        setLoading('estimate');
        setError(null);
        try {
            const mockOptions: EstimatePdfOptions = {
                customerName: "山田 太郎",
                vehicleName: "プリウス",
                licensePlate: "品川 300 あ 1234",
                items: [
                    { id: "1", name: "エンジンオイル交換", quantity: 1, unitPrice: 0, partUnitPrice: 0, partQuantity: 0, laborCost: 3000, priority: "required" },
                    { id: "2", name: "オイルフィルター", quantity: 1, unitPrice: 0, partUnitPrice: 1500, partQuantity: 1, laborCost: 1000, priority: "required" },
                    { id: "3", name: "ワイパーゴム交換", quantity: 2, unitPrice: 0, partUnitPrice: 800, partQuantity: 2, laborCost: 500, priority: "recommended" },
                ],
                estimateDate: new Date(),
                validUntil: new Date(new Date().setDate(new Date().getDate() + 14)),
                note: "テスト備考です。\n複数行のテスト。\n以上"
            };

            const url = await getEstimatePdfBlobUrl(mockOptions);
            window.open(url, '_blank');
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(null);
        }
    };

    const handleGenerateWorkOrder = async () => {
        setLoading('workorder');
        setError(null);
        try {
            const mockData: WorkOrderPDFData = {
                jobId: "JOB-12345",
                customerName: "山田 太郎",
                vehicleInfo: {
                    name: "プリウス",
                    licensePlate: "品川 300 あ 1234"
                },
                entryDate: new Date().toISOString(),
                serviceKind: "車検",
                assignedMechanic: "佐藤 次郎",
                generatedAt: new Date().toISOString(),
                mileage: 50000,
                customerNotes: "ブレーキから異音がする気がする。\n詳しく見てほしい。",
                workOrder: "特になし",
                historicalJobs: [
                    { date: "2024/01/01", serviceKind: "12ヶ月点検", summary: "プリウス - 12ヶ月点検" }
                ],
                courtesyCar: null,
                approvedWorkItems: null
            };

            const result = await generateWorkOrderPDF(mockData);
            if (result.success && result.data) {
                const url = URL.createObjectURL(result.data);
                window.open(url, '_blank');
            } else {
                setError(result.error?.message || "Generation failed");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(null);
        }
    };

    const handleGenerateTemplate = async (type: InspectionTemplateType) => {
        setLoading(`template-${type}`);
        setError(null);
        try {
            const mockData: InspectionRecordData = {
                vehicle: {
                    ownerName: "山田 太郎",
                    vehicleName: "プリウス",
                    licensePlate: "品川 300 あ 1234",
                    engineType: "2ZR",
                    firstRegistrationYear: "25",
                    chassisNumber: "ZVW30-000000"
                },
                inspectionItems: [
                    { id: "engine-room-001", name: "", category: "engine_room", status: "green" },
                    { id: "engine-room-002", name: "", category: "engine_room", status: "yellow" },
                    { id: "interior-001", name: "", category: "interior", status: "green" },
                ],
                replacementParts: [],
                mechanicName: "点検 太郎",
                mileage: 12345,
                inspectionDate: new Date().toISOString(),
                measurements: {
                    brakePadFrontLeft: 8.5,
                    brakePadFrontRight: 8.4,
                }
            };

            const result = await generateInspectionTemplatePDF(mockData, type);
            if (result.success && result.data) {
                const url = URL.createObjectURL(result.data);
                window.open(url, '_blank');
            } else {
                setError(result.error?.message || "Generation failed");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="container mx-auto p-8 space-y-8">
            <h1 className="text-3xl font-bold mb-4">PDF Generation Test</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Inspection Record PDF</CardTitle>
                        <CardDescription>Generates a new blank sheet with filled data</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleGenerateInspection}
                            disabled={loading === 'inspection'}
                            className="w-full"
                        >
                            {loading === 'inspection' ? 'Generating...' : 'Generate PDF'}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Estimate PDF</CardTitle>
                        <CardDescription>Generates estimate document</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleGenerateEstimate}
                            disabled={loading === 'estimate'}
                            className="w-full"
                        >
                            {loading === 'estimate' ? 'Generating...' : 'Generate PDF'}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Work Order PDF</CardTitle>
                        <CardDescription>Generates internal work order</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleGenerateWorkOrder}
                            disabled={loading === 'workorder'}
                            className="w-full"
                        >
                            {loading === 'workorder' ? 'Generating...' : 'Generate PDF'}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>12 Month Template</CardTitle>
                        <CardDescription>Fills 12-month inspection template</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => handleGenerateTemplate('12month')}
                            disabled={loading === 'template-12month'}
                            className="w-full"
                        >
                            {loading === 'template-12month' ? 'Generating...' : 'Generate PDF'}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>24 Month Template</CardTitle>
                        <CardDescription>Fills 24-month inspection template</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => handleGenerateTemplate('24month')}
                            disabled={loading === 'template-24month'}
                            className="w-full"
                        >
                            {loading === 'template-24month' ? 'Generating...' : 'Generate PDF'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
