import { prisma } from "@/lib/prisma";
import { getDiscordUser, getDiscordAvatarUrl } from "@/lib/discord";
import { Event, User, NotificationSettings, NotificationType } from "@prisma/client";

const DISCORD_API_BASE = 'https://discord.com/api/v10';

async function sendDM(discordId: string, content: any) {
    const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN; // Ensure we grab correct one
    if (!token) return false;

    try {
        // 1. Create DM Channel
        const dmResponse = await fetch(`${DISCORD_API_BASE}/users/@me/channels`, {
            method: 'POST',
            headers: {
                Authorization: `Bot ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ recipient_id: discordId }),
        });

        if (!dmResponse.ok) {
            console.error(`Failed to open DM with ${discordId}: ${dmResponse.statusText}`);
            return false;
        }

        const channel = await dmResponse.json();

        // 2. Send Message
        const msgResponse = await fetch(`${DISCORD_API_BASE}/channels/${channel.id}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Bot ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(content),
        });

        return msgResponse.ok;
    } catch (e) {
        console.error("Error sending DM:", e);
        return false;
    }
}

export async function sendEventNotification(
    event: Event & { createdBy: User },
    type: NotificationType,
    recipientIds: string[] // Changed from full User objects to just Discord IDs
) {
    if (recipientIds.length === 0) return;

    // Fetch existing settings for these users
    const existingSettings = await prisma.notificationSettings.findMany({
        where: { discordUserId: { in: recipientIds } }
    });

    // Map settings by Discord ID for quick lookup
    const settingsMap = new Map<string, NotificationSettings>();
    existingSettings.forEach(s => settingsMap.set(s.discordUserId, s));

    // Filter targets
    const targets = recipientIds.filter(discordId => {
        let s = settingsMap.get(discordId);

        // If no settings exist yet, use defaults (ALL TRUE based on user request)
        if (!s) {
            // Virtual default settings for unregistered users
            return true; // Default to receiving everything
        }

        switch (type) {
            case 'PRE_3D': return s.preEvent3Days;
            case 'PRE_24H': return s.preEvent24Hours;
            case 'PRE_1H': return s.preEvent1Hour;
            case 'UPDATE': return s.eventUpdates;
            case 'ATTENDANCE_CHECK': return s.attendanceReminder;
            default: return false;
        }
    });

    console.log(`Sending ${type} notification for event ${event.name} to ${targets.length} users (out of ${recipientIds.length} potential recipients).`);

    for (const discordId of targets) {
        const s = settingsMap.get(discordId);
        const lang = s?.language === 'hu' ? 'hu' : 'en';

        const t = getTranslations(lang);
        const content = formatMessage(event, type, t);

        const success = await sendDM(discordId, content);
        if (!success) {
            console.warn(`Failed to send DM to ${discordId} (User might have DMs disabled)`);
        }
    }

    // Log the batch
    await prisma.eventNotificationLog.create({
        data: {
            eventId: event.id,
            type,
            recipientCount: targets.length
        }
    });
}

function getTranslations(lang: 'en' | 'hu') {
    if (lang === 'hu') {
        return {
            pre_3d: "🔔 **Közelgő Esemény: 3 Nap Múlva**",
            pre_24h: "🔔 **Közelgő Esemény: Holnap**",
            pre_1h: "🔔 **Közelgő Esemény: 1 Óra Múlva**",
            update: "📝 **Esemény Frissítés**",
            attend: "❓ **Jelenlét Megerősítése**",
            time: "Időpont",
            description: "Leírás",
            details: "Részletek",
            confirm: "Megerősítem",
            decline: "Nem tudok jönni",
            footer: "Az értesítési beállításaidat a /notifications paranccsal módosíthatod."
        };
    }
    return {
        pre_3d: "🔔 **Upcoming Event: In 3 Days**",
        pre_24h: "🔔 **Upcoming Event: Tomorrow**",
        pre_1h: "🔔 **Upcoming Event: In 1 Hour**",
        update: "📝 **Event Update**",
        attend: "❓ **Attendance Confirmation**",
        time: "Time",
        description: "Description",
        details: "Details",
        confirm: "Confirm Attendance",
        decline: "Decline",
        footer: "Manage your notification preferences with /notifications."
    };
}

function formatMessage(event: Event, type: NotificationType, t: any) {
    let title = t.update;
    if (type === 'PRE_3D') title = t.pre_3d;
    if (type === 'PRE_24H') title = t.pre_24h;
    if (type === 'PRE_1H') title = t.pre_1h;
    if (type === 'ATTENDANCE_CHECK') title = t.attend;

    const timeString = new Date(event.startTime).toLocaleString('en-GB', {
        timeZone: 'UTC',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) + ' UTC';

    const embed = {
        title: event.name,
        description: event.description ? event.description.substring(0, 200) + (event.description.length > 200 ? '...' : '') : '',
        fields: [
            { name: t.time, value: timeString, inline: true },
        ],
        footer: { text: t.footer }
    };

    if (event.bannerUrl) {
        // @ts-ignore
        embed.image = { url: event.bannerUrl };
    }

    const payload: any = {
        content: title,
        embeds: [embed]
    };

    // Add buttons for attendance check
    if (type === 'ATTENDANCE_CHECK') {
        payload.components = [
            {
                type: 1, // ActionRow
                components: [
                    {
                        type: 2, // Button
                        style: 1, // Primary
                        label: t.confirm,
                        custom_id: `attend:confirm:${event.id}`
                    },
                    {
                        type: 2, // Button
                        style: 4, // Danger
                        label: t.decline,
                        custom_id: `attend:decline:${event.id}`
                    }
                ]
            }
        ];
    }

    return payload;
}
