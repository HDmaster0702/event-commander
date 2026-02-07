import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/');
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                // Role handling will be done in the full auth config or fetched here if token has it
                // Note: In edge middleware, we might not reach DB easily for session callback details if not careful,
                // but session callback usually runs on server (Node) for the client.
                // However, this file is imported by middleware, so keep it safe.
                // We will move the DB-dependant session logic to auth.ts if possible, or keep it minimal.
                // Actually, session/jwt callbacks running in middleware is rare/limited.
                // Let's keep the simple authorized logic here.
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.email = user.email; // Ensure email is in token
            }
            return token;
        }
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
