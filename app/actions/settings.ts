'use server';

import { prisma } from '@/lib/prisma';
import { getBotGuilds, getGuildChannels } from '@/lib/discord';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { logAction } from '@/lib/logger';

export async function getSettings() {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'SUPER_ADMIN') {
        throw new Error("Unauthorized");
    }
    return await prisma.settings.findFirst();
}

export async function saveSettings(data: { discordGuildId: string; announcementChannelId: string; notificationGuideChannelId?: string; timeZone: string }) {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');

    // Upsert the singleton settings row
    // We can use a fixed ID or check if one exists.
    const existing = await prisma.settings.findFirst();

    if (existing) {
        await prisma.settings.update({
            where: { id: existing.id },
            data: {
                discordGuildId: data.discordGuildId,
                announcementChannelId: data.announcementChannelId,
                notificationGuideChannelId: data.notificationGuideChannelId,
                timeZone: data.timeZone,
            },
        });
    } else {
        await prisma.settings.create({
            data: {
                discordGuildId: data.discordGuildId,
                announcementChannelId: data.announcementChannelId,
                notificationGuideChannelId: data.notificationGuideChannelId,
                timeZone: data.timeZone,
            },
        });
    }

    await logAction("UPDATE", "Settings", existing?.id || "new", { changes: data });
    revalidatePath('/admin/settings');
}

export async function sendNotificationGuide() {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');

    const settings = await prisma.settings.findFirst();
    if (!settings?.notificationGuideChannelId) {
        return { error: "Notification Guide Channel not configured." };
    }

    const { sendGuideDiscord } = await import('@/lib/discord');
    const success = await sendGuideDiscord(settings.notificationGuideChannelId);

    if (success) {
        return { success: true };
    } else {
        return { error: "Failed to send guide message." };
    }
}

export async function fetchGuilds() {
    // Only Admin
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'SUPER_ADMIN') return [];
    return await getBotGuilds();
}

export async function fetchChannels(guildId: string) {
    // Only Admin
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'SUPER_ADMIN') return [];
    return await getGuildChannels(guildId);
}
