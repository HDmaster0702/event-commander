"use client"

import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Event, EventStatus } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarCheck } from "lucide-react"

interface DashboardCalendarProps {
    events: Event[]
}

export function DashboardCalendar({ events }: DashboardCalendarProps) {
    // Extract dates for modifiers
    const scheduledDates = events
        .filter(e => e.status === EventStatus.SCHEDULED && e.startTime)
        .map(e => new Date(e.startTime));

    const announcedDates = events
        .filter(e => e.status === EventStatus.ANNOUNCED && e.startTime)
        .map(e => new Date(e.startTime));

    return (
        <Card className="bg-neutral-900 border-neutral-800 h-full shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-neutral-200 flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-neutral-400" />
                    Mission Schedule
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center w-full">
                <Calendar
                    mode="single"
                    selected={new Date()}
                    className="rounded-md border-none w-full flex justify-center text-neutral-200"
                    classNames={{
                        months: "w-full relative",
                        month: "flex flex-col w-full",
                        table: "w-full",
                        head_row: "flex w-full mt-2",
                        head_cell: "text-neutral-400 rounded-md w-9 font-normal text-[0.8rem] flex-1",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-neutral-800/50 [&:has([aria-selected])]:bg-neutral-800 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 flex-1",
                        day: "h-auto min-h-[2.25rem] w-9 mx-auto p-0 font-normal aria-selected:opacity-100 hover:bg-neutral-800 hover:text-white focus:bg-neutral-800 focus:text-white rounded-md transition-colors",
                        day_range_end: "day-range-end",
                        day_selected: "bg-neutral-800 text-white hover:bg-neutral-800 hover:text-white focus:bg-neutral-800 focus:text-white",
                        day_today: "bg-neutral-800 text-white font-bold border border-neutral-700",
                        day_outside: "text-neutral-600 opacity-50 aria-selected:bg-neutral-800/50 aria-selected:text-neutral-500 aria-selected:opacity-30",
                        day_disabled: "text-neutral-700 opacity-50",
                        day_range_middle: "aria-selected:bg-neutral-800 aria-selected:text-white",
                        day_hidden: "invisible",
                    }}
                    components={{
                        DayButton: ({ day, modifiers, ...props }) => {
                            const isScheduled = scheduledDates.some(d => d.toDateString() === day.date.toDateString());
                            const isAnnounced = announcedDates.some(d => d.toDateString() === day.date.toDateString());

                            return (
                                <CalendarDayButton day={day} modifiers={modifiers} {...props}>
                                    {props.children}
                                    {(isScheduled || isAnnounced) && (
                                        <div className="flex gap-0.5 mt-0.5 justify-center">
                                            {isScheduled && <div className="w-1 h-1 bg-yellow-500 rounded-full" />}
                                            {isAnnounced && <div className="w-1 h-1 bg-green-500 rounded-full" />}
                                        </div>
                                    )}
                                </CalendarDayButton>
                            )
                        }
                    }}
                />

                <div className="flex gap-4 mt-4 text-sm text-neutral-400">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span>Scheduled</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Announced</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
