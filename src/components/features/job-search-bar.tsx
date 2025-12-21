"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface JobSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * 案件検索バー
 */
export function JobSearchBar({
  value,
  onChange,
  placeholder = "顧客名・車名・ナンバー・タグIDで検索",
}: JobSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 h-12 text-base"
      />
    </div>
  );
}
