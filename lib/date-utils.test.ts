import { expect, test } from 'vitest'
import { formatDate, isSameDay } from './date-utils'

test('formatDate works with timezones', () => {
    // 2023-01-01 12:00 UTC
    const date = new Date('2023-01-01T12:00:00Z');

    // UTC check
    expect(formatDate(date, 'HH:mm', 'UTC')).toBe('12:00');

    // EST check (UTC-5)
    expect(formatDate(date, 'HH:mm', 'America/New_York')).toBe('07:00');

    // CET check (UTC+1)
    expect(formatDate(date, 'HH:mm', 'Europe/Budapest')).toBe('13:00');
});

test('isSameDay works with timezones', () => {
    // 2023-01-01 23:00 UTC
    const date1 = new Date('2023-01-01T23:00:00Z');
    // 2023-01-02 01:00 UTC
    const date2 = new Date('2023-01-02T01:00:00Z');

    // In UTC, they are different days
    expect(isSameDay(date1, date2, 'UTC')).toBe(false);

    // In America/New_York (UTC-5):
    // date1 is 18:00 (Jan 1)
    // date2 is 20:00 (Jan 1)
    // So they should be the SAME day.
    expect(isSameDay(date1, date2, 'America/New_York')).toBe(true);
});
