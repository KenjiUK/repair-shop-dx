"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getSession,
  getCurrentUser,
  clearSession,
  isSessionValid,
  login as loginApi,
  logout as logoutApi,
  refreshSession,
} from "@/lib/auth";
import { LoginRequest, User, Session } from "@/types/auth";

/**
 * 認証フック
 *
 * セッション管理とユーザー情報の取得
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化: セッションを読み込む
  useEffect(() => {
    const loadSession = () => {
      const currentSession = getSession();
      const currentUser = getCurrentUser();

      if (currentSession && isSessionValid(currentSession)) {
        setSession(currentSession);
        setUser(currentUser || currentSession.user);
      } else {
        // セッションが無効な場合はクリア
        clearSession();
        setSession(null);
        setUser(null);
      }

      setIsLoading(false);
    };

    loadSession();

    // 定期的にセッションの有効性をチェック（5分ごと）
    const interval = setInterval(() => {
      const currentSession = getSession();
      if (currentSession && !isSessionValid(currentSession)) {
        clearSession();
        setSession(null);
        setUser(null);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // ログイン
  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await loginApi(credentials);
      setSession(response.session);
      setUser(response.session.user);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ログアウト
  const logout = useCallback(async () => {
    if (session) {
      await logoutApi(session.sessionId);
    }
    clearSession();
    setSession(null);
    setUser(null);
  }, [session]);

  // セッション更新
  const refresh = useCallback(async () => {
    if (session) {
      const updatedSession = await refreshSession(session.sessionId);
      if (updatedSession) {
        setSession(updatedSession);
        setUser(updatedSession.user);
      } else {
        // セッション更新に失敗した場合はログアウト
        await logout();
      }
    }
  }, [session, logout]);

  return {
    /** 現在のユーザー */
    user,
    /** 現在のセッション */
    session,
    /** ローディング中かどうか */
    isLoading,
    /** 認証済みかどうか */
    isAuthenticated: !!user && !!session,
    /** ログイン */
    login,
    /** ログアウト */
    logout,
    /** セッション更新 */
    refresh,
  };
}
















