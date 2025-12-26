/**
 * NextAuth.js 設定ファイル
 * 
 * Google OAuth ログインを実装
 * @ymworks.com ドメインのメールのみ許可
 */

import NextAuth, { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * NextAuth 設定
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  callbacks: {
    /**
     * サインイン時のコールバック
     * @ymworks.com ドメインのメールのみ許可
     */
    async signIn({ user, account, profile }) {
      // Google OAuth の場合のみドメインチェック
      if (account?.provider === "google") {
        const email = user.email;
        
        // メールアドレスが存在するかチェック
        if (!email) {
          console.error("[Auth] Email not provided");
          return false;
        }
        
        // @ymworks.com ドメインのみ許可
        if (!email.endsWith("@ymworks.com")) {
          console.error("[Auth] Email domain not allowed:", email);
          return false;
        }
        
        return true;
      }
      
      return false;
    },
    /**
     * JWT トークン生成時のコールバック
     */
    async jwt({ token, user, account }) {
      // 初回サインイン時
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      
      return token;
    },
    /**
     * セッション生成時のコールバック
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      
      return session;
    },
  },
};

/**
 * NextAuth ハンドラー
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

