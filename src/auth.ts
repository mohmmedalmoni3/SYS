import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import { compare } from "bcryptjs";
import { z } from "zod";
import type { RoleLite } from "@/lib/types";
import { getUserAuthData } from "@/server/repository";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: RoleLite;
      permissions: string[];
      title: string;
      avatarHue: number;
      points: number;
      level: number;
    } & DefaultSession["user"];
  }

  interface User {
    role?: RoleLite;
    permissions?: string[];
    title?: string;
    avatarHue?: number;
    points?: number;
    level?: number;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string;
    role?: RoleLite;
    permissions?: string[];
    title?: string;
    avatarHue?: number;
    points?: number;
    level?: number;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const discordConfigured = Boolean(
  process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const data = await getUserAuthData(parsed.data.email);
        if (!data) return null;

        const valid = await compare(parsed.data.password, data.passwordHash);
        if (!valid) return null;

        return {
          id: data.id,
          name: data.name,
          email: data.email,
          image: data.image,
          role: data.role,
          permissions: data.permissions,
          title: data.title,
          avatarHue: data.avatarHue,
          points: data.points,
          level: data.level,
        };
      },
    }),
    ...(discordConfigured
      ? [
          Discord({
            clientId: process.env.AUTH_DISCORD_ID,
            clientSecret: process.env.AUTH_DISCORD_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "discord") {
        if (!user.email) return false;
        const data = await getUserAuthData(user.email);
        if (!data) return false;
        user.id = data.id;
        user.role = data.role;
        user.permissions = data.permissions;
        user.title = data.title;
        user.avatarHue = data.avatarHue;
        user.points = data.points;
        user.level = data.level;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
        token.title = user.title;
        token.avatarHue = user.avatarHue;
        token.points = user.points;
        token.level = user.level;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.uid ?? "";
      session.user.role = token.role ?? {
        id: "role_guest",
        name: "ضيف",
        nameEn: "Guest",
        color: "#94A3B8",
        icon: "eye",
        level: 10,
      };
      session.user.permissions = token.permissions ?? [];
      session.user.title = token.title ?? "";
      session.user.avatarHue = token.avatarHue ?? 220;
      session.user.points = token.points ?? 0;
      session.user.level = token.level ?? 1;
      return session;
    },
  },
});
