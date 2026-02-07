'use server';

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { logAction } from "@/lib/logger";

/**
 * Searches for Discord users in the guild who are not yet registered.
 * @param query Search string (username)
 */
export async function searchDiscordUsers(query: string) {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        throw new Error("Unauthorized");
    }

    if (!query || query.length < 2) return [];

    const token = process.env.DISCORD_BOT_TOKEN;
    const guildId = (await prisma.settings.findFirst())?.discordGuildId;

    if (!token || !guildId) {
        throw new Error("Discord configuration missing");
    }

    // 1. Fetch guild members (search)
    // Discord API "search" for members is: /guilds/{guild.id}/members/search?query={query}&limit=20
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/search?query=${encodeURIComponent(query)}&limit=20`, {
        headers: { Authorization: `Bot ${token}` }
    });

    if (!response.ok) {
        throw new Error(`Discord API Error: ${response.statusText}`);
    }

    const members = await response.json();

    // 2. Filter out existing users
    // Get all Discord IDs from our DB that match the found members
    const memberIds = members.map((m: any) => m.user.id);
    const existingUsers = await prisma.user.findMany({
        where: { discordId: { in: memberIds } },
        select: { discordId: true, isActive: true }
    });

    // Only filter out ACTIVE users. Disabled users should be selectable so we can re-enable them.
    const activeUserIds = new Set(existingUsers.filter(u => u.isActive).map(u => u.discordId));

    // Return filtered list formatted for UI
    return members
        .filter((m: any) => !activeUserIds.has(m.user.id) && !m.user.bot)
        .map((m: any) => ({
            id: m.user.id,
            username: m.user.username,
            globalName: m.user.global_name,
            avatar: m.user.avatar
                ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png`
                : null
        }));
}

/**
 * Creates an invitation record and attempts to DM the user.
 */
export async function createInvitation(discordId: string, role: Role) {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        throw new Error("Unauthorized");
    }

    // Check if user already exists (double check)
    const existing = await prisma.user.findUnique({ where: { discordId } });
    if (existing) {
        return { error: "User already exists" };
    }

    // Create Invitation
    // Auto-expire in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
        data: {
            discordId,
            role,
            expiresAt
        }
    });

    await logAction("INVITE", "User", null, { discordId, role, invitationId: invitation.id });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.id}`;

    // Attempt to DM the user
    let dmSent = false;
    try {
        const token = process.env.DISCORD_BOT_TOKEN;
        // Create DM Channel
        const dmChannelRes = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
            method: 'POST',
            headers: {
                Authorization: `Bot ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recipient_id: discordId })
        });

        if (dmChannelRes.ok) {
            const channel = await dmChannelRes.json();
            // Send Message
            const msgRes = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bot ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: `You have been invited to join the Reforger Bot Dashboard as a **${role}**.\n\nClick here to set up your account: ${inviteLink}\n\nThis link expires in 7 days.`
                })
            });

            if (msgRes.ok) dmSent = true;
        }
    } catch (e) {
        console.error("Failed to send DM:", e);
    }

    return {
        success: true,
        dmSent,
        inviteLink
    };
}

/**
 * Validates an invitation token (id).
 */
export async function validateInvitation(token: string) {
    const invite = await prisma.invitation.findUnique({
        where: { id: token }
    });

    if (!invite) return { valid: false, error: "Invitation not found" };
    if (invite.expiresAt < new Date()) return { valid: false, error: "Invitation expired" };

    return { valid: true, invite };
}

/**
 * Accepts an invitation and creates the user account.
 */
export async function acceptInvitation(token: string, formData: FormData) {
    const invite = await prisma.invitation.findUnique({
        where: { id: token }
    });

    if (!invite || invite.expiresAt < new Date()) {
        throw new Error("Invalid or expired invitation");
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Basic Validation
    if (!name || !email || !password || password.length < 6) {
        return { error: "Invalid input data" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            discordId: invite.discordId,
            role: invite.role,
            isActive: true,
            // We could try to fetch their current avatar here too, but it's optional
        }
    });

    await logAction("CREATE", "User", user.id, { name, email, discordId: invite.discordId, role: invite.role });

    // Delete Invite
    await prisma.invitation.delete({ where: { id: invite.id } });

    // Redirect to login (or auto-login if we could, but redirect is safer)
    redirect("/login?verified=true");
}

/**
 * Checks if a Discord user exists in our DB and returns their status.
 */
export async function checkDiscordUserStatus(discordId: string) {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
        where: { discordId },
        select: { id: true, name: true, isActive: true }
    });

    return user;
}

/**
 * Reactivates a disabled user account.
 */
export async function reactivateUser(discordId: string) {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
        where: { discordId }
    });

    if (!user) {
        return { error: "User not found" };
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { isActive: true }
    });

    await logAction("ENABLE", "User", user.id, { discordId });

    revalidatePath('/admin/users');
    return { success: true };
}
