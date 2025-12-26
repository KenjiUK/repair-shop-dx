"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

interface InvoiceTabProps {
  customerName: string;
  onShowInvoice: () => void;
}

/**
 * 請求書タブコンポーネント
 */
export function InvoiceTab({ customerName, onShowInvoice }: InvoiceTabProps) {
  return (
    <Card className="border border-slate-300 rounded-xl shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <FileText className="h-5 w-5 shrink-0" />
          請求書
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
          <FileText className="h-10 w-10 text-slate-700" />
        </div>
        <p className="text-base text-slate-700 mb-4">
          基幹システムで発行した請求書PDFを表示します
        </p>
        <Button onClick={onShowInvoice} className="gap-2 h-12 text-base font-medium">
          <Download className="h-5 w-5 shrink-0" />
          請求書PDFを表示
        </Button>
        <p className="text-base text-slate-700 mt-4">
          ファイル名: {customerName}様_請求書.pdf
        </p>
      </CardContent>
    </Card>
  );
}








