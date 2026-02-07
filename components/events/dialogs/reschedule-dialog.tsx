'use client';

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateEvent } from "@/app/actions/events";
import { Event } from "@prisma/client";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { TimeZoneToggle } from "@/components/events/time-zone-toggle";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface RescheduleDialogProps {
    event: Event;
    timeZone: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RescheduleDialog({ event, timeZone: communityTimeZone, open, onOpenChange }: RescheduleDialogProps) {
    const { data: session } = useSession();
    const [isPending, startTransition] = useTransition();

    const userTimeZone = (session?.user as any)?.timeZone;
    const [timeZoneMode, setTimeZoneMode] = useState<'community' | 'user'>('community');
    const activeTimeZone = timeZoneMode === 'user' && userTimeZone ? userTimeZone : communityTimeZone;

    // Initialize with existing time
    // We need to start with the zoned time to display correctly
    const initialZoned = toZonedTime(new Date(event.startTime), activeTimeZone);
    const [date, setDate] = useState<Date | undefined>(initialZoned);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) return;

        // Preserve current time if possible, else default to 19:00
        let hours = 19;
        let minutes = 0;

        if (date) {
            hours = date.getHours();
            minutes = date.getMinutes();
        }

        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const day = selectedDate.getDate();

        // Construct new date in local time components
        const newDate = new Date(year, month, day, hours, minutes);
        setDate(newDate);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const timeString = e.target.value;
        if (!timeString) return;
        const [hours, minutes] = timeString.split(':').map(Number);

        if (date) {
            const newDate = new Date(date);
            newDate.setHours(hours);
            newDate.setMinutes(minutes);
            setDate(newDate);
        } else {
            // If no date picked yet, pick today at this time
            const now = new Date();
            now.setHours(hours);
            now.setMinutes(minutes);
            setDate(now);
        }
    };

    const handleSave = () => {
        if (!date) return;

        startTransition(async () => {
            // Convert back to UTC for storage
            // The 'date' state simulates the "Wall Time" in the target timezone.
            // We format it to string logically: "YYYY-MM-DD HH:mm:ss"
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();
            const hours = date.getHours();
            const minutes = date.getMinutes();


            const wallTimeStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            const utcDate = fromZonedTime(wallTimeStr, activeTimeZone);

            const payload = {
                ...event,
                startTime: utcDate,
                // Ensure required strings
                description: event.description || "",
                bannerUrl: event.bannerUrl || "",
                sitrepUrl: event.sitrepUrl || "",
                rosterUrl: event.rosterUrl || "",
                modlistUrl: event.modlistUrl || "",
            };

            const result = await updateEvent(event.id, payload);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Event rescheduled");
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50 sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Reschedule Event</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Update the start time. This will update the Discord timestamp.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="flex flex-col space-y-2">
                        <Label className="flex items-center gap-2">
                            <span>Start Time</span>
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
                        </Label>
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal bg-neutral-950 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-50",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        {date ? (
                                            format(date, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-800" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={handleDateSelect}
                                        disabled={(d) =>
                                            d < new Date(new Date().setHours(0, 0, 0, 0))
                                        }
                                        initialFocus
                                        className="bg-neutral-900 text-neutral-50"
                                    />
                                </PopoverContent>
                            </Popover>
                            <Input
                                type="time"
                                className="w-[110px] bg-neutral-950 border-neutral-800 text-white [color-scheme:dark]"
                                onChange={handleTimeChange}
                                value={date ? format(date, 'HH:mm') : ''}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" onClick={handleSave} disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Time
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
