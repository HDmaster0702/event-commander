import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { EventActions } from "@/components/events/event-actions";
import { EventStatus } from "@prisma/client";
import { DiscordMarkdown } from "@/components/discord-markdown";
import { EventsFilter } from "@/components/events/events-filter"; // Import global filter

import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic'; // Ensure we always fetch fresh data

interface EventsPageProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    // @ts-ignore
    const role = session.user.role;
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    // Determine view mode for admins (default to 'all' if no param)
    const viewMode = searchParams?.view === 'mine' ? 'mine' : 'all';

    let events;

    if (isAdmin && viewMode === 'all') {
        // Fetch ALL events for Global View
        events = await prisma.event.findMany({
            orderBy: { startTime: 'asc' },
            include: { createdBy: true }
        });
    } else {
        // Fetch only MY events (Announcers OR Admin selecting 'mine')
        events = await prisma.event.findMany({
            where: { createdById: session.user.id },
            orderBy: { startTime: 'asc' },
            include: { createdBy: true }
        });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { timeZone: true }
    });

    const settings = await prisma.settings.findFirst();
    const timeZone = settings?.timeZone || 'UTC';

    const userTimeZone = user?.timeZone || 'UTC';

    const announcedEvents = events.filter(e => e.status === EventStatus.ANNOUNCED);
    const scheduledEvents = events.filter(e => e.status === EventStatus.SCHEDULED);
    const draftEvents = events.filter(e => e.status === EventStatus.DRAFT);
    const cancelledEvents = events.filter(e => e.status === EventStatus.CANCELLED);
    // For admins seeing all events, we might want to group completed ones too, but sticky to existing logic

    const EventGrid = ({ items, title }: { items: typeof events, title: string }) => {
        if (items.length === 0) return null;
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-neutral-400 border-b border-neutral-800 pb-2">{title}</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((event) => {
                        const showLocalTime = userTimeZone !== timeZone;

                        return (
                            <div key={event.id} className="group relative flex flex-col justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-sm transition-all hover:bg-neutral-900/80 hover:shadow-md">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${event.status === 'ANNOUNCED' ? 'bg-green-400/10 text-green-400 ring-green-400/20' :
                                                event.status === 'CANCELLED' ? 'bg-red-400/10 text-red-400 ring-red-400/20' :
                                                    'bg-neutral-400/10 text-neutral-400 ring-neutral-400/20'
                                                }`}>
                                                {event.status}
                                            </span>
                                            {event.status === EventStatus.SCHEDULED && event.scheduledAt && (
                                                <span className="text-xs text-blue-400 font-medium bg-blue-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(toZonedTime(event.scheduledAt, timeZone), "MMM d, h:mm a")}
                                                </span>
                                            )}
                                            {/* Actions Component */}
                                            <EventActions
                                                event={event}
                                                timeZone={timeZone}
                                                canTransfer={isAdmin}
                                            />
                                        </div>
                                        <h2 className="text-xl font-semibold tracking-tight text-white">{event.name}</h2>
                                        <div className="flex flex-col gap-1 text-sm text-neutral-400">
                                            <div className="flex items-center">
                                                <Calendar className="mr-2 h-4 w-4" />
                                                {format(event.startTime, "PPP")}
                                            </div>
                                            <div className="flex items-center">
                                                <Clock className="mr-2 h-4 w-4" />
                                                <span>
                                                    {format(event.startTime, "p")} {timeZone}
                                                </span>
                                            </div>
                                            {showLocalTime && (
                                                <div className="flex items-center text-neutral-500 text-xs ml-6">
                                                    ({format(toZonedTime(event.startTime, userTimeZone), "p")} {userTimeZone})
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="line-clamp-3 text-sm text-neutral-400">
                                        <DiscordMarkdown content={event.description || "No description provided."} />
                                    </div>
                                </div>


                                <div className="mt-6 border-t border-neutral-800 pt-4 flex items-center justify-between text-xs text-neutral-500">
                                    <span>Created by {event.createdBy?.name || 'Unknown'}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isAdmin ? 'Events' : 'My Events'}
                    </h1>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                    {isAdmin && <EventsFilter />}

                    <Link href="/admin/events/new">
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Event
                        </Button>
                    </Link>
                </div>
            </div>

            {events.length === 0 ? (
                <div className="rounded-md border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
                    No events found. Create one to get started.
                </div>
            ) : (
                <div className="space-y-12">
                    {announcedEvents.length > 0 && (
                        <EventGrid items={announcedEvents} title="Announced Events" />
                    )}

                    {scheduledEvents.length > 0 && (
                        <EventGrid items={scheduledEvents} title="Scheduled Events" />
                    )}

                    {cancelledEvents.length > 0 && (
                        <EventGrid items={cancelledEvents} title="Cancelled Events" />
                    )}

                    {draftEvents.length > 0 && (
                        <EventGrid items={draftEvents} title="Drafts" />
                    )}

                    {/* Fallback for other statuses if needed, or just hide them */}
                    {events.filter(e => e.status !== 'ANNOUNCED' && e.status !== 'DRAFT' && e.status !== 'CANCELLED' && e.status !== 'SCHEDULED').length > 0 && (
                        <EventGrid items={events.filter(e => e.status !== 'ANNOUNCED' && e.status !== 'DRAFT' && e.status !== 'CANCELLED' && e.status !== 'SCHEDULED')} title="Other Events" />
                    )}
                </div>
            )}
        </div>
    );
}
