import { EventReaction, Event } from "@prisma/client";
import { toZonedTime } from "date-fns-tz";
import { getDay, getHours, format } from "date-fns";

export type DashboardData = {
    totalReactions: number;
    uniqueUsers: number;
    totalEvents: number;
    avgAttendance: number;
    byDayOfWeek: { name: string; count: number }[];
    byTimeOfDay: { hour: string; count: number }[];
    topUsers: { name: string; avatar: string | null; count: number }[];
    reactionDistribution: { name: string; value: number }[];
};

type ReactionWithEvent = EventReaction & { event: Event };

export function calculateDashboardStats(reactions: ReactionWithEvent[]): DashboardData {
    const totalReactions = reactions.length;

    const uniqueUserIds = new Set(reactions.map(r => r.discordUserId));
    const uniqueUsers = uniqueUserIds.size;

    const uniqueEventIds = new Set(reactions.map(r => r.eventId));
    const totalEvents = uniqueEventIds.size;

    const avgAttendance = totalEvents > 0 ? totalReactions / totalEvents : 0;

    // By Day of Week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts = new Array(7).fill(0);

    // By Time of Day (Hour buckets of Event Start Time)
    const hourCounts = new Array(24).fill(0);

    // Reaction Distribution
    const reactionCounts: Record<string, number> = {};

    // Top Users
    const userCounts: Record<string, { count: number; name: string; avatar: string | null }> = {};

    reactions.forEach(r => {
        // Day of Week (based on Event Start Time)
        // Use UTC for simplicity or configured timezone? 
        // Ideally should use settings.timeZone but let's default to UTC or basic date-fns local for now as this runs on server.
        // Better: Use the stored startTime which is a DateTime.

        // Use UTC for consistent stats
        const eventDate = toZonedTime(r.event.startTime, 'UTC');
        const dayIndex = getDay(eventDate);
        dayCounts[dayIndex]++;

        const hourIndex = getHours(eventDate);
        hourCounts[hourIndex]++;

        // Reaction Dist
        reactionCounts[r.reaction] = (reactionCounts[r.reaction] || 0) + 1;

        // User Counts
        if (!userCounts[r.discordUserId]) {
            userCounts[r.discordUserId] = { count: 0, name: r.discordUsername || 'Unknown', avatar: r.discordAvatar };
        }
        userCounts[r.discordUserId].count++;
    });

    const byDayOfWeek = days.map((name, index) => ({
        name,
        count: dayCounts[index]
    }));

    const byTimeOfDay = hourCounts.map((count, index) => ({
        hour: `${index}:00`,
        count
    }));

    const topUsers = Object.values(userCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10

    const reactionDistribution = Object.entries(reactionCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return {
        totalReactions,
        uniqueUsers,
        totalEvents,
        avgAttendance,
        byDayOfWeek,
        byTimeOfDay,
        topUsers,
        reactionDistribution
    };
}
