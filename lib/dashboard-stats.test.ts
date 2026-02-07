import { expect, test } from 'vitest'
import { calculateDashboardStats, DashboardData } from './dashboard-stats'

// Mock data
// We need to mock ReactionWithEvent.
// Using 'any' to bypass strict type check for now, or define partial mock.

const mockReactions: any[] = [
    {
        id: 'r1',
        reaction: '✅',
        discordUserId: 'user1',
        discordUsername: 'Alice',
        discordAvatar: 'avatar1',
        eventId: 'e1',
        event: {
            id: 'e1',
            startTime: new Date('2023-01-01T10:00:00Z'), // Sunday
        }
    },
    {
        id: 'r2',
        reaction: '✅',
        discordUserId: 'user2',
        discordUsername: 'Bob',
        discordAvatar: null,
        eventId: 'e1',
        event: {
            id: 'e1',
            startTime: new Date('2023-01-01T10:00:00Z'),
        }
    },
    {
        id: 'r3',
        reaction: '❌',
        discordUserId: 'user1',
        discordUsername: 'Alice',
        discordAvatar: 'avatar1',
        eventId: 'e2',
        event: {
            id: 'e2',
            startTime: new Date('2023-01-02T14:00:00Z'), // Monday
        }
    }
];

test('calculateDashboardStats aggregates correctly', () => {
    const stats: DashboardData = calculateDashboardStats(mockReactions);

    expect(stats.totalReactions).toBe(3);

    // Unique users: Alice and Bob
    expect(stats.uniqueUsers).toBe(2);

    // Total Events: e1 and e2
    expect(stats.totalEvents).toBe(2);

    // Avg Attendance: 3 reactions / 2 events = 1.5
    expect(stats.avgAttendance).toBe(1.5);

    // Day counts
    // Sunday (0) should have 2 reactions (from e1)
    // Monday (1) should have 1 reaction (from e2)
    const sun = stats.byDayOfWeek.find(d => d.name === 'Sun');
    const mon = stats.byDayOfWeek.find(d => d.name === 'Mon');
    expect(sun?.count).toBe(2);
    expect(mon?.count).toBe(1);

    // Hour counts
    // 10:00 (e1) -> 2
    // 14:00 (e2) -> 1
    const h10 = stats.byTimeOfDay.find(h => h.hour === '10:00');
    const h14 = stats.byTimeOfDay.find(h => h.hour === '14:00');
    expect(h10?.count).toBe(2);
    expect(h14?.count).toBe(1);

    // Top Users
    // Alice has 2 reactions, Bob has 1
    expect(stats.topUsers[0].name).toBe('Alice');
    expect(stats.topUsers[0].count).toBe(2);
    expect(stats.topUsers[1].name).toBe('Bob');

    // Reaction Distribution
    // ✅: 2, ❌: 1
    const yes = stats.reactionDistribution.find(r => r.name === '✅');
    const no = stats.reactionDistribution.find(r => r.name === '❌');
    expect(yes?.value).toBe(2);
    expect(no?.value).toBe(1);
});
