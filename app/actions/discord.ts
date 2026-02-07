'use server';

import { searchGuildMembers, getDiscordUser, getDiscordAvatarUrl } from '@/lib/discord';
import { getSettings } from './settings';
import { auth } from '@/auth';

export async function getDiscordProfile() {
    const session = await auth();
    const discordId = (session?.user as any)?.discordId;

    if (!discordId) return null;

    const user = await getDiscordUser(discordId);
    if (!user) return null;

    const avatarUrl = getDiscordAvatarUrl(user.id, user.avatar);

    return {
        ...user,
        avatarUrl
    };
}

export async function searchDiscordMembers(query: string) {
    const settings = await getSettings();
    if (!settings?.discordGuildId) {
        return [];
    }

    const members = await searchGuildMembers(settings.discordGuildId, query);
    return { members, guildId: settings.discordGuildId };
}
