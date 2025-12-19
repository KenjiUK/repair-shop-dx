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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          請求書
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
          <FileText className="h-10 w-10 text-slate-400" />
        </div>
        <p className="text-slate-600 mb-4">
          基幹システムで発行した請求書PDFを表示します
        </p>
        <Button onClick={onShowInvoice} size="lg" className="gap-2">
          <Download className="h-5 w-5" />
          📄 請求書PDFを表示
        </Button>
        <p className="text-sm text-slate-400 mt-4">
          ファイル名: {customerName}様_請求書.pdf
        </p>
      </CardContent>
    </Card>
  );
}
