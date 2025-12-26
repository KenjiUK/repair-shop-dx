import { BackButton } from "@/components/layout/back-button";

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">404</h1>
        <p className="text-slate-700 mb-8">ページが見つかりませんでした</p>
        <div className="flex justify-center">
          <BackButton />
        </div>
      </div>
    </div>
  );
}








