import { REST } from '@discordjs/rest';
import { Routes, APIGuild, APIChannel, ChannelType } from 'discord-api-types/v10';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN!;
// We might need to look at bot folder's .env if not passed to web, 
// but usually we should add DISCORD_TOKEN to web/.env as well for this API to work.
// For now, I'll assume we add it to web/.env.

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

export async function getBotGuilds(): Promise<APIGuild[]> {
    try {
        const guilds = await rest.get(Routes.userGuilds()) as APIGuild[];
        return guilds;
    } catch (error) {
        console.error('Failed to fetch bot guilds:', error);
        return [];
    }
}

export async function getGuildChannels(guildId: string): Promise<APIChannel[]> {
    try {
        const channels = await rest.get(Routes.guildChannels(guildId)) as APIChannel[];
        return channels.filter(c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement);
    } catch (error) {
        console.error(`Failed to fetch channels for guild ${guildId}:`, error);
        return [];
    }
}

import { APIGuildMember } from 'discord-api-types/v10';

export async function searchGuildMembers(guildId: string, query: string): Promise<APIGuildMember[]> {
    if (!query) return [];
    try {
        const members = await rest.get(Routes.guildMembersSearch(guildId), {
            query: new URLSearchParams({ query, limit: '20' }),
        }) as APIGuildMember[];
        return members;
    } catch (error) {
        console.error(`Failed to search members for guild ${guildId}:`, error);
        return [];
    }
}

import { APIUser } from 'discord-api-types/v10';

export async function getDiscordUser(userId: string): Promise<APIUser | null> {
    try {
        const user = await rest.get(Routes.user(userId)) as APIUser;
        return user;
    } catch (error) {
        console.error(`Failed to fetch user ${userId}:`, error);
        return null;
    }
}

import {
    RESTPostAPIChannelMessageResult,
    RESTPostAPIChannelMessageJSONBody,
    ButtonStyle,
    ComponentType,
    APIMessage
} from 'discord-api-types/v10';

export async function getDiscordGuildMember(guildId: string, userId: string): Promise<APIGuildMember | null> {
    try {
        const member = await rest.get(Routes.guildMember(guildId, userId)) as APIGuildMember;
        return member;
    } catch (error) {
        // console.error(`Failed to fetch member ${userId} for guild ${guildId}:`, error);
        return null;
    }
}

export function getDiscordAvatarUrl(userId: string, hash: string | null): string | null {
    if (!hash) return null;
    return `https://cdn.discordapp.com/avatars/${userId}/${hash}.png`;
}


export async function announceEventDiscord(
    channelId: string,
    eventData: {
        name: string;
        description: string;
        startTime: Date;
        bannerUrl?: string | null;
        sitrepUrl?: string | null;
        rosterUrl?: string | null;
        modlistUrl?: string | null;
        author?: { name: string; iconUrl?: string | null };
    }
): Promise<string | null> { // Returns messageId or null
    try {
        const components: any[] = [];
        const buttons: any[] = [];
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const getAbsoluteUrl = (url: string) => {
            if (!url) return url;
            if (url.startsWith('http://') || url.startsWith('https://')) return url;
            const cleanBase = baseUrl.replace(/\/$/, '');
            const cleanUrl = url.startsWith('/') ? url : `/${url}`;
            return `${cleanBase}${cleanUrl}`;
        };

        if (eventData.sitrepUrl) {
            buttons.push({
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                label: 'SITREP',
                url: getAbsoluteUrl(eventData.sitrepUrl),
                emoji: { name: '📄' } // Page facing up
            });
        }

        if (eventData.rosterUrl) {
            buttons.push({
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                label: 'Roster',
                url: getAbsoluteUrl(eventData.rosterUrl),
                emoji: { name: '👥' } // Busts in silhouette
            });
        }

        // Add Modlist button if exists (optional, not strictly asked but good for completion based on UI)
        if (eventData.modlistUrl) {
            buttons.push({
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                label: 'Modlist',
                url: getAbsoluteUrl(eventData.modlistUrl),
                emoji: { name: '🛠️' }
            });
        }

        if (buttons.length > 0) {
            components.push({
                type: ComponentType.ActionRow,
                components: buttons
            });
        }

        // Handle Banner URL
        // Note: Localhost URLs won't render on Discord. 
        // In a real prod env, this should be a public URL or an attachment.
        const image = eventData.bannerUrl && eventData.bannerUrl.startsWith('http')
            ? { url: eventData.bannerUrl }
            : undefined;

        // Construct Embed
        const embed = {
            title: eventData.name,
            description: eventData.description,
            color: 0x00b0f4, // #00b0f4
            image: image,
            author: eventData.author ? {
                name: eventData.author.name,
                icon_url: eventData.author.iconUrl || undefined
            } : undefined,
            fields: [
                {
                    name: 'Time',
                    value: `<t:${Math.floor(eventData.startTime.getTime() / 1000)}:F> (<t:${Math.floor(eventData.startTime.getTime() / 1000)}:R>)`,
                    inline: true
                }
            ],
            footer: {
                text: 'Reforger Event System'
            },
            timestamp: new Date().toISOString()
        };

        const body: RESTPostAPIChannelMessageJSONBody = {
            content: '@everyone',
            embeds: [embed],
            components: components
        };

        const message = await rest.post(Routes.channelMessages(channelId), {
            body: body
        }) as APIMessage;

        // Add Reactions
        const messageId = message.id;
        const reactions = ['✅', '❌', '🕒'];

        // We do this asynchronously to not block the return
        // But for server actions it might be better to await or just fire-and-forget
        (async () => {
            for (const emoji of reactions) {
                try {
                    // Start URL encoding the emoji for the route
                    const encodedEmoji = encodeURIComponent(emoji);
                    await rest.put(Routes.channelMessageOwnReaction(channelId, messageId, encodedEmoji));
                } catch (err) {
                    console.error(`Failed to react with ${emoji}:`, err);
                }
            }
        })();

        return messageId;

    } catch (error) {
        console.error('Failed to announce event:', error);
        return null;
    }
}

export async function updateEventDiscord(
    channelId: string,
    messageId: string,
    eventData: {
        name: string;
        description: string;
        startTime: Date;
        bannerUrl?: string | null;
        sitrepUrl?: string | null;
        rosterUrl?: string | null;
        modlistUrl?: string | null;
        author?: { name: string; iconUrl?: string | null };
    }
): Promise<boolean> {
    try {
        const components: any[] = [];
        const buttons: any[] = [];
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const getAbsoluteUrl = (url: string) => {
            if (!url) return url;
            if (url.startsWith('http://') || url.startsWith('https://')) return url;
            const cleanBase = baseUrl.replace(/\/$/, '');
            const cleanUrl = url.startsWith('/') ? url : `/${url}`;
            return `${cleanBase}${cleanUrl}`;
        };

        if (eventData.sitrepUrl) {
            buttons.push({
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                label: 'SITREP',
                url: getAbsoluteUrl(eventData.sitrepUrl),
                emoji: { name: '📄' }
            });
        }

        if (eventData.rosterUrl) {
            buttons.push({
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                label: 'Roster',
                url: getAbsoluteUrl(eventData.rosterUrl),
                emoji: { name: '👥' }
            });
        }

        if (eventData.modlistUrl) {
            buttons.push({
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                label: 'Modlist',
                url: getAbsoluteUrl(eventData.modlistUrl),
                emoji: { name: '🛠️' }
            });
        }

        if (buttons.length > 0) {
            components.push({
                type: ComponentType.ActionRow,
                components: buttons
            });
        }

        const image = eventData.bannerUrl && eventData.bannerUrl.startsWith('http')
            ? { url: eventData.bannerUrl }
            : undefined;

        const embed = {
            title: eventData.name,
            description: eventData.description,
            color: 0x00b0f4,
            image: image,
            author: eventData.author ? {
                name: eventData.author.name,
                icon_url: eventData.author.iconUrl || undefined
            } : undefined,
            fields: [
                {
                    name: 'Time',
                    value: `<t:${Math.floor(eventData.startTime.getTime() / 1000)}:F> (<t:${Math.floor(eventData.startTime.getTime() / 1000)}:R>)`,
                    inline: true
                }
            ],
            footer: {
                text: 'Reforger Event System'
            },
            timestamp: new Date().toISOString()
        };

        const body: RESTPostAPIChannelMessageJSONBody = {
            content: '@everyone', // Discord API requires content to be present or it might clear it, but usually patch updates mostly merge or replace. For safety we keep it.
            embeds: [embed],
            components: components
        };

        await rest.patch(Routes.channelMessage(channelId, messageId), {
            body: body
        });

        return true;

    } catch (error) {
        console.error('Failed to update event announcement:', error);
        return false;
    }
}

export async function cancelEventDiscord(
    channelId: string,
    messageId: string,
    eventName: string
): Promise<boolean> {
    try {
        const embed = {
            title: `[CANCELLED] ${eventName}`,
            description: "This event has been cancelled.",
            color: 0xed4245, // Red
            footer: {
                text: 'Reforger Event System'
            },
            timestamp: new Date().toISOString()
        };

        await rest.patch(Routes.channelMessage(channelId, messageId), {
            body: {
                content: '',
                embeds: [embed],
                components: []
            }
        });

        // Optionally clear reactions
        // await rest.deleteAllMessageReactions(channelId, messageId);

        return true;
    } catch (error) {
        console.error('Failed to cancel event announcement:', error);
        return false;
    }
}

export async function sendGuideDiscord(channelId: string): Promise<boolean> {
    try {
        const embed = {
            title: "🔔 Notifications Guide / Értesítési Útmutató",
            description: "🇬🇧 **English Guide**\nCustomize your alerts to stay updated on events you care about!",
            color: 0x5865F2, // Blurple
            fields: [
                {
                    name: "🔧 How to Configure",
                    value: "Use the command `/notifications` or click the button below to open your settings.",
                },
                {
                    name: "📋 Notification Types",
                    value: `
**3-Day / 24-Hour / 1-Hour Reminder**
Sent before the event starts. Only for events you marked as **Attending** (✅).

**Event Updates**
Changes to time, description, or cancellation of events you are attending.

**Attendance Check**
A check-in message sent at 5 PM the day before the event to confirm you can still make it.
                    `.trim()
                },
                {
                    name: "⚠️ Note",
                    value: "Reminders are personal (DM). Make sure you allow Direct Messages from this server."
                },
                {
                    name: " ",
                    value: "──────────────"
                },
                {
                    name: "🇭🇺 Magyar Útmutató",
                    value: "Szabd személyre az értesítéseket az eseményekről!"
                },
                {
                    name: "🔧 Beállítás",
                    value: "Használd a `/notifications` parancsot vagy kattints a gombra a beállításokhoz.",
                },
                {
                    name: "📋 Értesítés Típusok",
                    value: `
**3 Napos / 24 Órás / 1 Órás Emlékeztető** (Időzített)
Csak azokról az eseményekről kapsz emlékeztetőt, amikre jelentkeztél (✅).

**Változások** (Event Updates)
Értesítés időpont változásról vagy törlésről résztvevő eseményeknél.

**Jelenlét Ellenőrzés** (Attendance Check)
Jelenlét megerősítő üzenet az esemény előtti napon 17:00-kor.
                    `.trim()
                },
                {
                    name: "⚠️ Megjegyzés",
                    value: "Az emlékeztetők privát üzenetben (DM) érkeznek. Engedélyezd a privát üzeneteket erről a szerverről."
                }
            ],
            footer: {
                text: 'Event Commander'
            },
            timestamp: new Date().toISOString()
        };

        /* 
           Ideally we would add a button here to open settings directly, 
           but we can't trigger an ephemeral command from a persistent message button easily 
           unless we have a persistent interaction handler for a specific customId.
           The current handler checks `notif:start`? No, it handles slash command.
           We can add a button with customId `open_settings` and handle it in bot/index.ts
           to reply with the ephemeral settings menu!
           Let's do that.
        */
        const components = [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Primary,
                        label: "Open Settings / Beállítások Megnyitása",
                        custom_id: "open_notification_settings",
                        emoji: { name: "🔔" }
                    }
                ]
            }
        ];

        await rest.post(Routes.channelMessages(channelId), {
            body: {
                embeds: [embed],
                components: components
            }
        });

        return true;
    } catch (error) {
        console.error('Failed to send guide:', error);
        return false;
    }
}
