"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, QrCode, User, Car, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ZohoJob } from "@/types";
import { SearchSuggestion, generateSearchSuggestions } from "@/lib/search-utils";
import { getSearchHistory } from "@/lib/search-history";

interface JobSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onScanClick?: () => void;
  jobs?: ZohoJob[]; // オートコンプリート用
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  /** 検索バーの幅を制御（デフォルト: レスポンシブ） */
  className?: string;
}

/**
 * 案件検索バー（常時表示 + タグスキャン統合 + オートコンプリート + キーボードショートカット）
 * 最新のUI/UXベストプラクティスに基づく実装
 */
export function JobSearchBar({
  value,
  onChange,
  placeholder = "顧客名・車名・ナンバー・タグIDで検索",
  onScanClick,
  jobs = [],
  onSuggestionSelect,
  className,
}: JobSearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // オートコンプリート候補を生成
  const searchSuggestions = useMemo(() => {
    if (!value.trim() || value.length < 2 || !jobs.length) return [];
    return generateSearchSuggestions(jobs, value, 10);
  }, [jobs, value]);

  // 検索履歴を取得
  const searchHistory = useMemo(() => {
    if (value.trim().length > 0) return [];
    return getSearchHistory().slice(0, 5);
  }, [value]);

  // キーボードショートカット（Cmd/Ctrl + K）で検索バーにフォーカス
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K で検索バーにフォーカス
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setShowSuggestions(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // キーボードナビゲーション（候補リスト内）
  useEffect(() => {
    if (!showSuggestions) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 候補リストが表示されている場合のみ処理
      if (searchSuggestions.length === 0 && searchHistory.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const maxIndex = searchSuggestions.length > 0 
          ? searchSuggestions.length - 1 
          : searchHistory.length - 1;
        setSelectedSuggestionIndex((prev) =>
          prev < maxIndex ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        if (searchSuggestions.length > 0 && selectedSuggestionIndex < searchSuggestions.length) {
          const suggestion = searchSuggestions[selectedSuggestionIndex];
          if (onSuggestionSelect) {
            onSuggestionSelect(suggestion);
          } else {
            onChange(suggestion.value);
          }
        } else if (searchHistory.length > 0) {
          const historyIndex = selectedSuggestionIndex - searchSuggestions.length;
          if (historyIndex >= 0 && historyIndex < searchHistory.length) {
            onChange(searchHistory[historyIndex].query);
          }
        }
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSuggestions, searchSuggestions, searchHistory, selectedSuggestionIndex, onChange, onSuggestionSelect]);

  // 外部クリックで候補を閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSuggestions]);

  return (
    <div ref={searchBarRef} className={cn("relative flex-1 min-w-0", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 pointer-events-none z-10" strokeWidth={2.5} />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
          setSelectedSuggestionIndex(-1);
          // 入力時にテキストの最後にスクロール（モバイル対応）
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.scrollLeft = inputRef.current.scrollWidth;
            }
          }, 0);
        }}
        onFocus={() => {
          if (value.trim().length >= 2 || searchHistory.length > 0) {
            setShowSuggestions(true);
          }
          // フォーカス時にテキストの最後にスクロール
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.scrollLeft = inputRef.current.scrollWidth;
            }
          }, 0);
        }}
        onBlur={(e) => {
          // 候補リストをクリックした場合は閉じない
          if (searchBarRef.current?.contains(e.relatedTarget as Node)) {
            return;
          }
          // 少し遅延させてから閉じる（候補クリックを確実に処理）
          setTimeout(() => {
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
          }, 200);
        }}
        placeholder={placeholder}
        className={cn(
          "pl-12 h-12 text-base overflow-x-auto rounded-full",
          onScanClick ? "pr-14" : "pr-4"
        )}
      />
      
      {/* QRコードスキャンボタン（検索バー内の右端） */}
      {onScanClick && (
        <button
          type="button"
          onClick={onScanClick}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 z-10"
          aria-label="QRコードをスキャン"
          title="QRコードをスキャン"
        >
          <QrCode className="h-5 w-5 text-slate-600" strokeWidth={2.5} />
        </button>
      )}
            
        {/* オートコンプリート候補ドロップダウン */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
            {/* 検索候補 */}
            {searchSuggestions.length > 0 && (
              <>
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.type}-${suggestion.value}-${index}`}
                    className={cn(
                      "px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors",
                      selectedSuggestionIndex === index && "bg-slate-100"
                    )}
                    onClick={() => {
                      if (onSuggestionSelect) {
                        onSuggestionSelect(suggestion);
                      } else {
                        onChange(suggestion.value);
                      }
                      setShowSuggestions(false);
                      setSelectedSuggestionIndex(-1);
                    }}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {suggestion.type === "customer" && <User className="h-5 w-5 text-slate-700 shrink-0" />}
                        {suggestion.type === "vehicle" && <Car className="h-5 w-5 text-slate-700 shrink-0" />}
                        {suggestion.type === "plate" && <FileText className="h-5 w-5 text-slate-700 shrink-0" />}
                        <span className="text-base truncate">
                          {(() => {
                            const parts = suggestion.label.split(new RegExp(`(${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
                            return (
                              <>
                                {parts.map((part, idx) => (
                                  <span
                                    key={idx}
                                    className={part.toLowerCase() === value.toLowerCase() ? "font-bold bg-amber-200" : ""}
                                  >
                                    {part}
                                  </span>
                                ))}
                              </>
                            );
                          })()}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-base font-medium px-2 py-0.5 rounded-full shrink-0 ml-2">
                        {suggestion.count}件
                      </Badge>
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {/* 検索履歴（検索クエリが空の場合） */}
            {value.trim().length === 0 && searchHistory.length > 0 && (
              <>
                {searchSuggestions.length > 0 && (
                  <div className="border-t border-slate-200" />
                )}
                <div className="px-4 py-2 border-b border-slate-200 bg-slate-50">
                  <span className="text-base font-medium text-slate-700">最近の検索</span>
                </div>
                {searchHistory.map((item, index) => {
                  const historyIndex = searchSuggestions.length + index;
                  return (
                    <div
                      key={item.timestamp}
                      className={cn(
                        "px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors",
                        selectedSuggestionIndex === historyIndex && "bg-slate-100"
                      )}
                      onClick={() => {
                        onChange(item.query);
                        setShowSuggestions(false);
                        setSelectedSuggestionIndex(-1);
                      }}
                      onMouseEnter={() => setSelectedSuggestionIndex(historyIndex)}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-slate-700 shrink-0" />
                        <span className="text-base truncate">{item.query}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            
            {/* 候補がない場合 */}
            {searchSuggestions.length === 0 && value.trim().length >= 2 && (
              <div className="px-4 py-3 text-base text-slate-600 text-center">
                該当する候補がありません
              </div>
            )}
          </div>
        )}
    </div>
  );
}
