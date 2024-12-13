import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/prisma";
import GoogleProvider from "next-auth/providers/google";
import NextAuth, { NextAuthOptions, type DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
        } & DefaultSession["user"];
    }
}

export const authOptions : NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET as string,
        }),
    ],
    pages: {
        signIn: "/auth/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            user && (token.user = user);
            return token;
        },
        async session({ session, user }) {
            session = {
                ...session,
                user: {
                    //@ts-expect-error
                    id: user.id,
                    ...session.user,
                },
            };
            return session;
        },
        redirect() {
            return "/";
        },
    },
};

export const authHandler = NextAuth(authOptions);
export default authHandler;
