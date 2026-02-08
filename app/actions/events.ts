'use server';


import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { EventStatus } from '@prisma/client';
import { announceEventDiscord, getDiscordUser, getDiscordAvatarUrl } from '@/lib/discord';
import { logAction } from '@/lib/logger';
import { sendEventNotification } from '@/lib/notifications';

import { EventFormSchema, EventFormValues } from '@/lib/schemas';

export async function createEvent(data: EventFormValues, createdById: string) {
    const customData = {
        ...data,
        createdById,
        status: EventStatus.DRAFT, // Default to DRAFT
    };

    let event;
    try {
        event = await prisma.event.create({
            data: customData,
        });

        await logAction("CREATE", "Event", event.id, { name: event.name }, createdById);
    } catch (error) {
        console.error("Failed to create event:", error);
        return { error: "Failed to create event" };
    }

    revalidatePath('/admin/events');
    redirect('/admin/events');
}

export async function announceEvent(eventId: string) {
    try {
        // 1. Fetch Event
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { createdBy: true }
        });

        if (!event) return { error: "Event not found" };

        // 2. Fetch Settings for Channel ID
        const settings = await prisma.settings.findFirst();
        if (!settings?.announcementChannelId) {
            return { error: "Announcement channel not configured in settings" };
        }

        // 3. Call Discord Helper
        // Fetch fresh Discord user for author
        let iconUrl = event.createdBy.image;
        if (event.createdBy.discordId) {
            const discordUser = await getDiscordUser(event.createdBy.discordId);
            if (discordUser?.avatar) {
                iconUrl = getDiscordAvatarUrl(discordUser.id, discordUser.avatar);
            } else if (iconUrl && !iconUrl.startsWith('http')) {
                // Fallback to manual construction if DB has data but fetch failed (or user has no avatar?)
                // Actually if fetch failed, discordUser is null.
                iconUrl = getDiscordAvatarUrl(event.createdBy.discordId, iconUrl);
            }
        }

        const messageId = await announceEventDiscord(settings.announcementChannelId, {
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

        if (!messageId) {
            return { error: "Failed to send Discord message" };
        }

        // 4. Update Event Status in DB
        await prisma.event.update({
            where: { id: eventId },
            data: {
                status: EventStatus.ANNOUNCED,
                discordMessageId: messageId,
                announcementChannelId: settings.announcementChannelId,
            },
        });

        await logAction("ANNOUNCE", "Event", eventId, { messageId });

        revalidatePath('/admin/events');
        return { success: true };

    } catch (error) {
        console.error("Announce error:", error);
        return { error: "Internal server error" };
    }
}


export async function updateEvent(eventId: string, data: EventFormValues) {
    try {
        // Sanitize data to ensure only valid fields are updated
        // This strips 'id', 'createdBy', etc. if they were passed in
        const cleanData = EventFormSchema.parse(data);

        const event = await prisma.event.update({
            where: { id: eventId },
            data: cleanData,
            include: { createdBy: true }
        });

        // If event is announced, sync changes to Discord
        if (event.status === EventStatus.ANNOUNCED && event.announcementChannelId && event.discordMessageId) {
            const { updateEventDiscord, getDiscordUser, getDiscordAvatarUrl } = await import('@/lib/discord');

            let iconUrl = event.createdBy.image;
            if (event.createdBy.discordId) {
                const discordUser = await getDiscordUser(event.createdBy.discordId);
                if (discordUser?.avatar) {
                    iconUrl = getDiscordAvatarUrl(discordUser.id, discordUser.avatar);
                } else if (iconUrl && !iconUrl.startsWith('http')) {
                    iconUrl = getDiscordAvatarUrl(event.createdBy.discordId, iconUrl);
                }
            }

            await updateEventDiscord(
                event.announcementChannelId,
                event.discordMessageId,
                {
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
                }
            );

            // Sync reactions first to ensure we have the latest attendee list
            try {
                const { syncEventReactions } = await import('@/lib/telemetry-scheduler');
                await syncEventReactions(event.id, event.announcementChannelId, event.discordMessageId);
            } catch (e) {
                console.error("[UpdateEvent] Failed to sync reactions before update:", e);
            }

            // Notify attendees about update
            // 1. Fetch recipients
            const reactions = await prisma.eventReaction.findMany({
                where: { eventId: event.id, OR: [{ reaction: '✅' }, { reaction: 'yes' }] }
            });
            console.log(`[UpdateEvent] Found ${reactions.length} reactions for event ${event.id}`);
            const attendeeIds = reactions.map(r => r.discordUserId);

            if (attendeeIds.length > 0) {
                console.log(`[UpdateEvent] Found ${attendeeIds.length} attendees.`);
                const recipients = await prisma.user.findMany({
                    where: { discordId: { in: attendeeIds } },
                    // @ts-ignore
                    include: { notificationSettings: true }
                });
                // @ts-ignore
                await sendEventNotification(event, 'UPDATE', recipients);
                console.log(`[UpdateEvent] sendEventNotification called`);
            } else {
                console.log(`[UpdateEvent] No attendees found for triggered update.`);
            }
        } else {
            console.log(`[UpdateEvent] Event not Announced or missing channel/message ID. Skipping notifications. Status=${event.status}, Channel=${event.announcementChannelId}, Msg=${event.discordMessageId}`);
        }

        revalidatePath('/admin/events');
        revalidatePath(`/admin/events/${eventId}/edit`);
    } catch (error) {
        console.error("Failed to update event:", error);
        return { error: "Failed to update event" };
    }

    // Do NOT redirect if called from client dialogs (implied by revalidatePath usage? No, server actions always run on server)
    // Actually, if we redirect here, checking "Manage" dialogs might be jarring if they submit and get redirected.
    // The previous implementation redirected. 
    // For dialog usage, we might want to avoid redirect.
    // But since this function is also used by the full Edit page which DOES expect redirect...
    // We can just keep the redirect. The client component for the dialog deals with `startTransition` and might ignore the redirect if it's just a data mutation, 
    // BUT Next.js redirects usually force navigation.
    // To support both, we'll remove the redirect and let the client handle navigation if needed.
    // Wait, the Edit page form relies on this redirect to go back to list...
    // Use a separate action? Or just check if "isEditPage" param? 
    // Simpler: Just remove redirect. Allow the client form to redirect on success if needed.
    // I will remove the redirect here and update the EventForm to redirect.

    return { success: true };
}

export async function scheduleEvent(eventId: string, scheduledAt: Date) {
    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!event) return { error: "Event not found" };

        const settings = await prisma.settings.findFirst();
        if (!settings?.announcementChannelId) {
            return { error: "Announcement channel not configured in settings" };
        }

        await prisma.event.update({
            where: { id: eventId },
            data: {
                status: EventStatus.SCHEDULED,
                scheduledAt: scheduledAt,
                announcementChannelId: settings.announcementChannelId
            }
        });

        revalidatePath('/admin/events');
        return { success: true };
    } catch (error) {
        console.error("Failed to schedule event:", error);
        return { error: "Failed to schedule event" };
    }
}

export async function cancelSchedule(eventId: string) {
    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!event) return { error: "Event not found" };

        if (event.status !== EventStatus.SCHEDULED) {
            return { error: "Event is not scheduled" };
        }

        await prisma.event.update({
            where: { id: eventId },
            data: {
                status: EventStatus.DRAFT,
                scheduledAt: null,
            }
        });

        revalidatePath('/admin/events');
        return { success: true };
    } catch (error) {
        console.error("Failed to cancel schedule:", error);
        return { error: "Failed to cancel schedule" };
    }
}

export async function deleteEvent(eventId: string) {
    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) return { error: "Event not found" };

        if (event.status === EventStatus.ANNOUNCED) {
            return { error: "Cannot delete an announced event. (Cancel feature coming soon)" };
        }

        // Log before delete
        await logAction("DELETE", "Event", eventId, { name: event.name });

        await prisma.event.delete({
            where: { id: eventId },
        });

        revalidatePath('/admin/events');
    } catch (error) {
        console.error("Failed to delete event:", error);
        return { error: "Failed to delete event" };
    }
}

export async function cancelEvent(eventId: string) {
    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!event) return { error: "Event not found" };

        if (event.status === EventStatus.ANNOUNCED && event.announcementChannelId && event.discordMessageId) {
            const { cancelEventDiscord } = await import('@/lib/discord');
            await cancelEventDiscord(
                event.announcementChannelId,
                event.discordMessageId,
                event.name
            );


            // Notify attendees about cancellation
            // We use 'UPDATE' type but the text will be generic Update. 
            // To make it specific "Cancelled", we might need to adjust formatting based on status, 
            // but here the event status is not yet updated in DB object (it's update call is below).
            // However, we can trust the log or user to see "Event Update" -> "Description" or just "Status: Cancelled" in embed?
            // Actually `sendEventNotification` formatMessage uses current event state.
            // If we update status first, then fetch for notification, it will show cancelled.

        }

        // Update status first
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                status: EventStatus.CANCELLED
            },
            include: { createdBy: true }
        });

        // Sync reactions to ensure we notify everyone
        try {
            const { syncEventReactions } = await import('@/lib/telemetry-scheduler');
            if (event.announcementChannelId && event.discordMessageId) {
                await syncEventReactions(event.id, event.announcementChannelId, event.discordMessageId);
            }
        } catch (e) {
            console.error("[CancelEvent] Failed to sync reactions:", e);
        }

        // Send notification AFTER status update so the embed shows correct status if we were to include it,
        // OR rely on the fact it's a cancellation. 
        // We need to fetch attendees.
        const reactions = await prisma.eventReaction.findMany({
            where: { eventId: event.id, OR: [{ reaction: '✅' }, { reaction: 'yes' }] }
        });
        const attendeeIds = reactions.map(r => r.discordUserId);

        if (attendeeIds.length > 0) {
            const recipients = await prisma.user.findMany({
                where: { discordId: { in: attendeeIds } },
                // @ts-ignore
                include: { notificationSettings: true }
            });
            // @ts-ignore
            await sendEventNotification(updatedEvent, 'UPDATE', recipients);
        }

        revalidatePath('/admin/events');
        return { success: true };
    } catch (error) {
        console.error("Failed to cancel event:", error);
        return { error: "Failed to cancel event" };
    }
}
