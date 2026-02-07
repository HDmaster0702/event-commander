import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { announceEventDiscord, getDiscordUser, getDiscordAvatarUrl } from '@/lib/discord';
import { EventStatus, NotificationType } from '@prisma/client';
import { sendEventNotification } from '@/lib/notifications';

// Singleton to prevent multiple schedulers in dev HMR
let isSchedulerInitialized = false;

export function initScheduler() {
    if (isSchedulerInitialized) {
        return;
    }

    isSchedulerInitialized = true;
    console.log('📅 Scheduler initialized');

    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();

            // Find events that are SCHEDULED and due
            const events = await prisma.event.findMany({
                where: {
                    status: EventStatus.SCHEDULED,
                    scheduledAt: {
                        lte: now
                    }
                },
                include: {
                    createdBy: true
                }
            });

            if (events.length > 0) {
                console.log(`⏰ Found ${events.length} events to announce.`);
            }

            for (const event of events) {
                console.log(`🚀 Announcing scheduled event: ${event.name}`);

                // Fetch fresh Discord user for author
                let iconUrl = event.createdBy.image;
                if (event.createdBy.discordId) {
                    const discordUser = await getDiscordUser(event.createdBy.discordId);
                    if (discordUser?.avatar) {
                        iconUrl = getDiscordAvatarUrl(discordUser.id, discordUser.avatar);
                    } else if (iconUrl && !iconUrl.startsWith('http')) {
                        iconUrl = getDiscordAvatarUrl(event.createdBy.discordId, iconUrl);
                    }
                }

                if (!event.announcementChannelId) {
                    // Should technically be set when scheduling, but fallback to settings if missing?
                    // However, announcementChannelId is stored on the event in our logic.
                    // If null, we might skip or try to fetch settings.
                    console.error(`❌ Event ${event.id} has no announcementChannelId.`);
                    continue;
                }

                // Announce
                const messageId = await announceEventDiscord(event.announcementChannelId, {
                    name: event.name,
                    description: event.description || '',
                    startTime: event.startTime,
                    bannerUrl: event.bannerUrl,
                    sitrepUrl: event.sitrepUrl,
                    rosterUrl: event.rosterUrl,
                    modlistUrl: event.modlistUrl,
                    author: {
                        name: event.createdBy.name || 'Unknown',
                        iconUrl: iconUrl
                    }
                });

                if (messageId) {
                    await prisma.event.update({
                        where: { id: event.id },
                        data: {
                            status: EventStatus.ANNOUNCED,
                            discordMessageId: messageId,
                        }
                    });
                    console.log(`✅ Event ${event.name} announced successfully.`);
                } else {
                    console.error(`❌ Failed to announce event ${event.name}.`);
                }
            }

            // --- NOTIFICATION CHECKS ---
            await checkPreEventNotifications(now);
            await checkAttendanceReminders(now);

        } catch (error) {
            console.error('❌ Scheduler error:', error);
        }
    });
}

// Helper to check for milestones (3 Days, 24 Hours, 1 Hour)
async function checkPreEventNotifications(now: Date) {
    const milestones = [
        { type: 'PRE_3D', hours: 72, window: 1 }, // 72 hours +/- 1 hour (actually ran every minute, so we check if within window and not sent)
        { type: 'PRE_24H', hours: 24, window: 1 },
        { type: 'PRE_1H', hours: 1, window: 0.5 }
    ] as const;

    // We shouldn't use a huge window. Since this runs every minute, we can check for exact matches with small buffer.
    // Or better: check for events starting soon where we haven't sent this log yet.

    const upcomingEvents = await prisma.event.findMany({
        where: {
            status: { in: [EventStatus.SCHEDULED, EventStatus.ANNOUNCED] },
            startTime: { gt: now }
        },
        include: {
            createdBy: true,
            notificationLogs: true,
            reactions: true
        }
    });

    for (const event of upcomingEvents) {
        const diffMs = event.startTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        for (const m of milestones) {
            // Check if within a reasonable range (e.g., target time passed but not too long ago, or approaching)
            // Let's say we send if it's LESS than the milestone hour, but we haven't sent it yet.
            // And to prevent sending for events that are already way past the milestone (e.g. creating event 1 min before start),
            // maybe we restrict it.

            // Simple logic:
            // If diffHours is <= m.hours AND we haven't logged this type.

            if (diffHours <= m.hours && diffHours > 0) {
                // Check if already sent
                // @ts-ignore - Prisma include typing can be tricky with arrays
                const hasLog = event.notificationLogs.some(l => l.type === m.type);
                if (hasLog) continue;

                // Send!
                // 1. Get recipients (Accepted users)
                const attendeeIds = event.reactions
                    .filter(r => r.reaction === '✅' || r.reaction.toLowerCase() === 'yes')
                    .map(r => r.discordUserId);

                if (attendeeIds.length === 0) {
                    // Log it anyway to prevent retry loop
                    await prisma.eventNotificationLog.create({
                        data: { eventId: event.id, type: m.type, recipientCount: 0 }
                    });
                    continue;
                }

                const recipients = await prisma.user.findMany({
                    where: { discordId: { in: attendeeIds } },
                    // @ts-ignore - Prisma type inference issue
                    include: { notificationSettings: true }
                });

                // @ts-ignore - Prisma type inference not picking up notificationSettings relation locally
                await sendEventNotification(event, m.type, recipients);
                // We rely on the log creation inside sendEventNotification, but we should ensure it happens.
                // Actually sendEventNotification creates the log.
            }
        }
    }
}

async function checkAttendanceReminders(now: Date) {
    // 5 PM Day Before (Community Time Zone)
    // 1. Get settings for timezone
    const settings = await prisma.settings.findFirst();
    const timeZone = settings?.timeZone || 'UTC';

    // 2. Check if current time is 17:00 in that timezone
    // We can use Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    });

    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');

    // Run only at 17:xx (giving a window of execution)
    if (hour === 17 && minute < 5) {
        // Find events for TOMORROW (start of day to end of day)
        // Calculate "Tomorrow" in target timezone
        // This is getting complex with timezones.

        // Simplified: Find events starting between 12h and 36h from now?
        // No, "Day before".

        const tomorrowStart = new Date(now);
        tomorrowStart.setHours(now.getHours() + 24);

        // Check events starting in roughly 20-28 hours?
        // Let's stick to a simpler logic: Events starting between 17:00 tomorrow and 23:59 tomorrow?
        // Or just events starting "Tomorrow".

        const events = await prisma.event.findMany({
            where: {
                status: EventStatus.ANNOUNCED,
                startTime: {
                    gt: now, // Future
                }
            },
            include: { createdBy: true, notificationLogs: true, reactions: true }
        });

        for (const event of events) {
            const diffHours = (event.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            // If event starts in ~24 hours (e.g. 18-30 hours range) and we are at 17:00.
            if (diffHours >= 18 && diffHours <= 30) {
                // Check log
                // @ts-ignore
                const hasLog = event.notificationLogs.some(l => l.type === 'ATTENDANCE_CHECK');
                if (hasLog) continue;

                // For attendance check, we might want to ask EVERYONE or just attendees?
                // Prompt says "Confirm their attendance", usually implies reminding those who signed up (or maybe those who haven't?)
                // usually "Confirm" means re-verification.

                const attendeeIds = event.reactions
                    .filter(r => r.reaction === '✅' || r.reaction.toLowerCase() === 'yes')
                    .map(r => r.discordUserId);

                if (attendeeIds.length === 0) continue;

                const recipients = await prisma.user.findMany({
                    where: { discordId: { in: attendeeIds } },
                    // @ts-ignore - Prisma type inference issue
                    include: { notificationSettings: true }
                });

                // @ts-ignore - Prisma type inference not picking up notificationSettings relation locally
                await sendEventNotification(event, 'ATTENDANCE_CHECK', recipients);
            }
        }
    }
}
