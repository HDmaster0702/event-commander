import { format, toZonedTime } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = 'UTC';

export function formatDate(date: Date, pattern: string, timeZone: string = DEFAULT_TIMEZONE): string {
    const zonedDate = toZonedTime(date, timeZone);
    return format(zonedDate, pattern, { timeZone });
}

export function isSameDay(date1: Date, date2: Date, timeZone: string = DEFAULT_TIMEZONE): boolean {
    const d1 = toZonedTime(date1, timeZone);
    const d2 = toZonedTime(date2, timeZone);

    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}
