import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { validateCredentials } from "@/lib/users";
import { getAuthSecret } from "@/lib/secret";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider(
      {

        authorize: async (credentials) => {
          // 多用户校验：USERS 环境变量（JSON 数组）+ 兼容旧的 BASIC_USER/REGULAR_USER
          const user = validateCredentials(credentials?.username, credentials?.password);
          if (!user) {
            return Promise.resolve(null);
          }
          return {
            id: user.id,
            name: user.username,
            email: `${user.username}@example.com`,
            role: user.role,
            createdAt: new Date().toISOString()
          };
        }
      })
  ],
  pages: {
    signIn: '/login', // 登录页面的路径
    signOut: '/'
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 会话的过期时间，单位为秒，这里设置为24小时
  },
  // 必须在环境变量中配置 SECRET，未配置时登录不可用（宁可失败也不使用公开的默认密钥）
  secret: getAuthSecret(),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role; 
        token.createdAt = user.createdAt; 
      }
      return token;
    },
    async session({ session, token }) {

      session.user.id = token.id;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.role = token.role; 
      session.user.createdAt = token.createdAt; 
      return session;
    },
    async authorized({ auth, req }) {
      const isAuthenticated = !!auth?.user;


      return isAuthenticated;
    },

  },
  trustHost: true
});


