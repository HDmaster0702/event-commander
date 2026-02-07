"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Event, EventStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"


// Extend Event with creator details
type EventWithCreator = Event & {
    createdBy: {
        name: string | null;
        image: string | null;
        discordId?: string | null;
    }
}

interface UpcomingEventsProps {
    events: EventWithCreator[]
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
    return (
        <Card className="bg-neutral-900 border-neutral-800 h-full shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-neutral-200 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-neutral-400" />
                    Upcoming Missions
                </CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="h-8 border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white">
                        <Link href="/admin/events/new">
                            Create
                        </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="h-8 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900">
                        <Link href="/admin/events">
                            View All <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-neutral-400 gap-2">
                        <CalendarDays className="h-8 w-8 opacity-20" />
                        <p>No upcoming missions scheduled.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {events.map((event) => {
                            const eventDate = new Date(event.startTime)
                            const isToday = new Date().toDateString() === eventDate.toDateString()

                            return (
                                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-neutral-950 rounded-md border border-neutral-800 text-neutral-400">
                                            <span className="text-xs uppercase font-bold text-neutral-400">
                                                {eventDate.toLocaleString('default', { month: 'short' })}
                                            </span>
                                            <span className="text-lg font-bold text-neutral-200">
                                                {eventDate.getDate()}
                                            </span>
                                        </div>
                                        <div>
                                            <Link href={`/admin/events/${event.id}/edit`} className="font-medium text-neutral-200 hover:underline hover:text-white block truncate max-w-[200px] sm:max-w-[300px]">
                                                {event.name}
                                            </Link>
                                            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                                                <span>{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span>•</span>
                                                <div className="flex items-center gap-1">
                                                    <Avatar className="h-4 w-4">
                                                        <AvatarImage src={getUserAvatarUrl(event.createdBy)} />
                                                        <AvatarFallback className="text-[10px]">
                                                            {(event.createdBy.name || '?')[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>{event.createdBy.name || 'Unknown'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isToday && (
                                            <Badge variant="outline" className="border-green-500/20 text-green-500 bg-green-500/10">TODAY</Badge>
                                        )}
                                        <StatusBadge status={event.status} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function getUserAvatarUrl(user: { image: string | null; discordId?: string | null }) {
    if (user.image) return user.image;
    if (user.discordId) {
        try {
            // Default Discord avatar calculation: (userId >> 22) % 6
            const defaultIndex = Number((BigInt(user.discordId) >> BigInt(22)) % BigInt(6));
            return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
        } catch (e) {
            return undefined;
        }
    }
    return undefined;
}

function StatusBadge({ status }: { status: EventStatus }) {
    if (status === 'ANNOUNCED') {
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">Announced</Badge>
    }
    if (status === 'SCHEDULED') {
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20">Scheduled</Badge>
    }
    return <Badge variant="outline">{status}</Badge>
}
