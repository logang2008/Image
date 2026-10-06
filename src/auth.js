import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { validateCredentials } from "@/lib/users";

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
  secret: process.env.SECRET || '00Fv/YUm0enwy04IgP4KoNOWLODe2iJ1tvBzr+4kEZ8=', // 替换为你的安全密钥
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


