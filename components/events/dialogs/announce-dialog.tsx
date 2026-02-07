'use client';

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Loader2, Send } from "lucide-react";
import { format, addDays, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Event, EventStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { TimeZoneToggle } from "@/components/events/time-zone-toggle";
import { useSession } from "next-auth/react";

interface AnnounceDialogProps {
    event: Event;
    timeZone: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AnnounceDialog({ event, timeZone: communityTimeZone, open, onOpenChange }: AnnounceDialogProps) {
    const { data: session } = useSession();
    const [isPending, startTransition] = useTransition();

    const userTimeZone = (session?.user as any)?.timeZone;
    const [timeZoneMode, setTimeZoneMode] = useState<'community' | 'user'>('community');
    const activeTimeZone = timeZoneMode === 'user' && userTimeZone ? userTimeZone : communityTimeZone;
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState("16:00");

    const getScheduledDate = () => {
        if (!date) return undefined;
        // Construct date in target timezone
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const [hours, minutes] = time.split(':').map(Number);

        // Create wall-time string for the target timezone
        const wallTimeStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        // Convert to UTC
        return fromZonedTime(wallTimeStr, activeTimeZone);
    };

    const handleSchedule = async () => {
        const { scheduleEvent } = await import("@/app/actions/events");

        startTransition(async () => {
            const scheduledAt = getScheduledDate();
            if (!scheduledAt) {
                toast.error("Invalid date/time");
                return;
            }
            if (scheduledAt < new Date()) {
                toast.error("Scheduled time must be in the future");
                return;
            }

            const eventTime = new Date(event.startTime);
            const bufferTime = new Date(eventTime.getTime() - 60 * 60 * 1000); // 1 hour before event

            if (scheduledAt >= bufferTime) {
                toast.error("Announcement must be scheduled at least 1 hour before the event start time.");
                return;
            }

            const result = await scheduleEvent(event.id, scheduledAt);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success(`Event scheduled for ${format(scheduledAt, 'MMM d, h:mm a')}`);
                onOpenChange(false);
            }
        });
    };

    const setPreset = (daysFromNow: number) => {
        // Get "now" in target timezone to determine "today/tomorrow" relative to that zone
        const nowZoned = toZonedTime(new Date(), activeTimeZone);
        let targetDate = addDays(nowZoned, daysFromNow);

        // Preset time: 4pm (16:00)
        setTime("16:00");
        setDate(targetDate);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50 sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Schedule Announcement</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Choose when to publish this announcement to Discord.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-neutral-300">Presets</label>
                            {!userTimeZone || userTimeZone === communityTimeZone ? (
                                <span className="text-xs font-normal text-blue-400 bg-blue-950/30 px-2 py-0.5 rounded-full border border-blue-900">
                                    {communityTimeZone}
                                </span>
                            ) : (
                                <TimeZoneToggle
                                    communityTimeZone={communityTimeZone}
                                    userTimeZone={userTimeZone}
                                    mode={timeZoneMode}
                                    onModeChange={setTimeZoneMode}
                                />
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {[1, 3, 5, 7].map((days) => {
                                const nowZoned = toZonedTime(new Date(), activeTimeZone);
                                let targetDate = addDays(nowZoned, days);
                                targetDate = setHours(targetDate, 16);
                                targetDate = setMinutes(targetDate, 0);
                                const utcTarget = fromZonedTime(targetDate, activeTimeZone);
                                const eventTime = new Date(event.startTime);
                                const bufferTime = new Date(eventTime.getTime() - 60 * 60 * 1000); // 1 hour before event

                                const isDisabled = utcTarget >= bufferTime;

                                return (
                                    <Button
                                        key={days}
                                        variant="outline"
                                        size="sm"
                                        disabled={isDisabled}
                                        onClick={() => setPreset(days)}
                                        className="bg-neutral-900 border-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-800 disabled:opacity-50"
                                    >
                                        {days === 1 ? 'Tomorrow' : (days === 7 ? 'In 1 Week' : `In ${days} Days`)} 4pm
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-neutral-800">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-neutral-300">Custom Date & Time</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full sm:flex-1 justify-start text-left font-normal bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-800" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                                            initialFocus
                                            className="bg-neutral-900 text-neutral-50"
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full sm:w-[120px] bg-neutral-900 border-neutral-800 text-white [color-scheme:dark]"
                                />
                            </div>
                            <p className="text-xs text-neutral-500">
                                Configured for {activeTimeZone} timezone.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSchedule}
                        disabled={isPending}
                        className="w-full bg-blue-600 hover:bg-blue-500"
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Schedule Announcement
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
