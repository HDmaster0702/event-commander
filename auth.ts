import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { compare } from 'bcryptjs';
import { authConfig } from './auth.config';
import { logAction } from '@/lib/logger';

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig,
    callbacks: {
        ...authConfig.callbacks,
        async session({ session, token }) {
            // console.log("Session Callback - Token:", JSON.stringify(token, null, 2));
            if (token.sub && session.user) {
                session.user.id = token.sub;
                try {
                    const user = await getUser(session.user.email || ''); // Ensure email is not undefined
                    if (user) {
                        // console.log("Session Callback - User Found:", user.email);
                        (session.user as any).role = user.role;
                        (session.user as any).discordId = user.discordId;
                        (session.user as any).isActive = user.isActive;
                        (session.user as any).timeZone = user.timeZone;

                        // NEW: Try to fetch Guild Avatar if available
                        let finalAvatarUrl = user.image;
                        try {
                            const settings = await prisma.settings.findFirst({ select: { discordGuildId: true } });
                            if (settings?.discordGuildId && user.discordId) {
                                // Dynamic import to avoid circular dep if any, or just good practice in callbacks
                                const { getDiscordGuildMember } = await import('@/lib/discord');
                                const member = await getDiscordGuildMember(settings.discordGuildId, user.discordId);

                                if (member?.avatar) {
                                    // Guild specific avatar
                                    finalAvatarUrl = `https://cdn.discordapp.com/guilds/${settings.discordGuildId}/users/${user.discordId}/avatars/${member.avatar}.png`;
                                } else if (member?.user?.avatar) {
                                    // Fallback to updated global avatar from member fetch
                                    finalAvatarUrl = member.user.avatar;
                                }
                            }
                        } catch (err) {
                            console.error("Failed to fetch guild avatar in session:", err);
                        }

                        // Fix: Construct full URL if stored value is a hash (and we didn't get a guild one/it wasn't a URL)
                        if (finalAvatarUrl && !finalAvatarUrl.startsWith('http') && user.discordId) {
                            session.user.image = `https://cdn.discordapp.com/avatars/${user.discordId}/${finalAvatarUrl}.png`;
                        } else {
                            session.user.image = finalAvatarUrl;
                        }
                    } else {
                        console.log("Session Callback - User NOT Found for email:", session.user.email);
                    }
                } catch (e) {
                    console.error("Session Callback Error:", e);
                }
            }
            return session;
        },
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;

                    // Default to true if isActive is undefined (e.g. stale Prisma cache)
                    const isActive = user.isActive ?? true;

                    if (!isActive) {
                        throw new Error('This account has been disabled.');
                    }

                    const passwordsMatch = await compare(password, user.password);
                    if (passwordsMatch) {
                        await logAction("LOGIN", "User", user.id, { email: user.email }, user.id);
                        return user;
                    }
                }

                return null;
            },
        }),
    ],
});
