import { prisma } from "@/lib/prisma";
import { EventStatus } from "@prisma/client";

/**
 * Syncs reactions for all active events.
 * Active events are those that are ANNOUNCED and are either upcoming or recently started/ended.
 * We fetch the full state of reactions from Discord and upsert them to our DB.
 */
export async function syncTelemetry() {
    console.log("[Telemetry] Starting sync...");

    try {
        // Find events that need syncing
        // Criteria: Status is ANNOUNCED.
        // Optimization: We could filter by date to stop syncing old events, e.g., 24h after start time.
        const activeEvents = await prisma.event.findMany({
            where: {
                status: EventStatus.ANNOUNCED,
                discordMessageId: { not: null },
                // Sync for up to 24 hours after start time
                startTime: {
                    gt: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        });

        console.log(`[Telemetry] Found ${activeEvents.length} active events to sync.`);

        for (const event of activeEvents) {
            if (!event.discordMessageId || !event.announcementChannelId) continue;

            try {
                await syncEventReactions(event.id, event.announcementChannelId, event.discordMessageId);
            } catch (error) {
                console.error(`[Telemetry] Failed to sync event ${event.id}:`, error);
            }
        }
    } catch (error) {
        console.error("[Telemetry] Global sync failed:", error);
    }
}

async function syncEventReactions(eventId: string, channelId: string, messageId: string) {
    // We need to fetch the message and its reactions from Discord.
    // Since this runs on the server, we can use the Bot token.

    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
        throw new Error("DISCORD_BOT_TOKEN is not set");
    }

    // 1. Fetch the message to get list of reactions (emoji counts/types)
    const messageResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
        headers: { Authorization: `Bot ${token}` }
    });

    if (!messageResponse.ok) {
        if (messageResponse.status === 404) {
            console.warn(`[Telemetry] Message ${messageId} not found for event ${eventId}. Stopping sync for this event.`);
            // Optional: Mark event as COMPLETED or similar if message is gone?
            return;
        }
        throw new Error(`Failed to fetch message: ${messageResponse.statusText}`);
    }

    const message = await messageResponse.json();
    const reactions = message.reactions || [];

    // 2. For each reaction type, fetch the users
    for (const reaction of reactions) {
        const emoji = reaction.emoji.id ? `${reaction.emoji.name}:${reaction.emoji.id}` : reaction.emoji.name;
        // Use the emoji name/char for storage if standard, or name:id if custom? 
        // For simplicity in display, let's store the raw emoji name or character.
        // If it's a custom emoji, `reaction.emoji.name` might be "MyEmote".

        // Discord API for fetching users: /channels/{channel.id}/messages/{message.id}/reactions/{emoji}
        // Need to encode the emoji properly.
        const encodedEmoji = reaction.emoji.id
            ? `${reaction.emoji.name}:${reaction.emoji.id}`
            : encodeURIComponent(reaction.emoji.name);

        const usersResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}?limit=100`, {
            headers: { Authorization: `Bot ${token}` }
        });

        if (!usersResponse.ok) continue;

        const users = await usersResponse.json();

        // 3. Sync to DB
        // Strategy: Upsert all current users.
        // Then delete users who are in DB for this (event, reaction) but NOT in the fetch list?
        // Actually, just upserting found users is "Add/Update".
        // To handle "Unlike" (Removal), we need to know who is NO LONGER there.

        // Let's get all current DB records for this event & reaction
        const dbReactions = await prisma.eventReaction.findMany({
            where: {
                eventId,
                reaction: reaction.emoji.name // Store friendly name or consistent identifier
            },
            select: { discordUserId: true }
        });

        const currentDiscordUserIds = new Set(users.filter((u: any) => !u.bot).map((u: any) => u.id));
        const dbUserIds = new Set(dbReactions.map(r => r.discordUserId));

        // Determine additions and removals
        // @ts-ignore
        const toAdd = users.filter((u: any) => !u.bot && !dbUserIds.has(u.id));
        const toRemove = dbReactions.filter(r => !currentDiscordUserIds.has(r.discordUserId));

        // Execute DB operations
        if (toAdd.length > 0) {
            await prisma.eventReaction.createMany({
                data: toAdd.map((u: any) => ({
                    eventId,
                    discordUserId: u.id,
                    discordUsername: u.username,
                    discordAvatar: u.avatar,
                    reaction: reaction.emoji.name,
                    fetchedAt: new Date(),
                })),
                skipDuplicates: true
            });
        }

        if (toRemove.length > 0) {
            await prisma.eventReaction.deleteMany({
                where: {
                    eventId,
                    reaction: reaction.emoji.name,
                    discordUserId: { in: toRemove.map(r => r.discordUserId) }
                }
            });
        }
    }
}
