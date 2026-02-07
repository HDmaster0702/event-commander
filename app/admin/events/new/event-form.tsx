'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { fromZonedTime, toZonedTime } from "date-fns-tz"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { FileUpload } from "@/components/events/file-upload"
import { DiscordPreview } from "@/components/events/discord-preview"
import { createEvent, updateEvent } from "@/app/actions/events"
import { EventFormSchema, EventFormValues } from "@/lib/schemas"
import { useTransition } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

import { useRouter } from "next/navigation";
import { getDiscordProfile } from "@/app/actions/discord";
import { useState, useEffect } from "react";

import { TimeZoneToggle } from "@/components/events/time-zone-toggle";

interface EventFormProps {
    timeZone: string;
    initialData?: EventFormValues & { id: string };
    mode?: 'create' | 'edit';
}

export function EventForm({ timeZone: communityTimeZone, initialData, mode = 'create' }: EventFormProps) {
    const { data: session } = useSession();
    const router = useRouter(); // Initialize router
    const [isPending, startTransition] = useTransition();
    const [discordProfile, setDiscordProfile] = useState<{ name?: string | null, avatarUrl?: string | null } | null>(null);

    const userTimeZone = (session?.user as any)?.timeZone;
    const [timeZoneMode, setTimeZoneMode] = useState<'community' | 'user'>('community');
    const activeTimeZone = timeZoneMode === 'user' && userTimeZone ? userTimeZone : communityTimeZone;

    useEffect(() => {
        if (session?.user) {
            getDiscordProfile().then((profile) => {
                if (profile) {
                    setDiscordProfile(profile);
                }
            });
        }
    }, [session?.user]);

    const form = useForm<EventFormValues>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: initialData || {
            name: "",
            description: "",
            bannerUrl: "",
            sitrepUrl: "",
            rosterUrl: "",
            modlistUrl: "",
        },
    })

    // Watch all values for preview
    const formValues = form.watch();

    function onSubmit(data: EventFormValues) {
        const userId = session?.user?.id;
        if (!userId) {
            toast.error("You must be logged in to create an event");
            return;
        }

        const now = new Date();
        if (data.startTime < now) {
            toast.error("Event start time must be in the future");
            return;
        }

        startTransition(async () => {
            if (mode === 'edit' && initialData) {
                const result = await updateEvent(initialData.id, data);
                if (result && 'error' in result) {
                    toast.error(result.error);
                } else {
                    toast.success("Event updated");
                    router.push('/admin/events');
                }
            } else {
                const result = await createEvent(data, userId);
                if (result && 'error' in result) {
                    toast.error(result.error);
                } else {
                    toast.success("Event created");
                    router.push('/admin/events');
                }
            }
        });
    }

    // Helper to handle Date selection from Calendar
    const handleDateSelect = (field: any, selectedDate: Date | undefined) => {
        if (!selectedDate) return;

        // We assume the Calendar returns a date at 00:00 browser local time on the clicked day.
        // We want to construct a date that represents that same day in the TARGET timezone.

        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const day = selectedDate.getDate();

        // Default time: 19:00 (7 PM) or keep existing time
        let hours = 19;
        let minutes = 0;

        if (field.value) {
            // Get hours/minutes from existing value in target TZ
            const zoned = toZonedTime(field.value, activeTimeZone);
            hours = zoned.getHours();
            minutes = zoned.getMinutes();
        }

        const wallTimeStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        const utcDate = fromZonedTime(wallTimeStr, activeTimeZone);

        field.onChange(utcDate);
    };

    // Helper to handle Time input change
    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
        const timeString = e.target.value; // "HH:mm"
        if (!timeString) return;
        const [hours, minutes] = timeString.split(':').map(Number);

        let baseDate = field.value;
        if (!baseDate) {
            baseDate = new Date();
        }

        const zoned = toZonedTime(baseDate, activeTimeZone);
        const year = zoned.getFullYear();
        const month = zoned.getMonth();
        const day = zoned.getDate();

        const wallTimeStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        const utcDate = fromZonedTime(wallTimeStr, activeTimeZone);

        field.onChange(utcDate);
    };

    // Helper to format for display
    const getZonedValue = (date: Date | undefined) => {
        if (!date) return undefined;
        return toZonedTime(date, activeTimeZone);
    };

    return (
        <div className="p-8 space-y-8 flex flex-col lg:flex-row gap-8">
            <div className="flex-1 max-w-2xl">
                <h1 className="text-3xl font-bold tracking-tight mb-8">
                    {mode === 'edit' ? 'Edit Event' : 'Create New Event'}
                </h1>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Operation: Rolling Thunder" {...field} className="bg-neutral-900 border-neutral-800" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Briefing / Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Mission details, background, etc."
                                            className="resize-none bg-neutral-900 border-neutral-800 min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Supports **bold**, *italics*, etc. (Markdown)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => {
                                const zonedDate = getZonedValue(field.value);

                                return (
                                    <FormItem className="flex flex-col">
                                        <div className="flex items-center gap-4 mb-2">
                                            <FormLabel className="mb-0">
                                                Event Start Time
                                            </FormLabel>
                                            <div className="flex items-center gap-2">
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
                                        </div>
                                        <div className="flex gap-4">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-[240px] pl-3 text-left font-normal bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-50",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {zonedDate ? (
                                                                format(zonedDate, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-800" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={zonedDate}
                                                        onSelect={(d) => handleDateSelect(field, d)}
                                                        disabled={(date) =>
                                                            date < new Date(new Date().setHours(0, 0, 0, 0))
                                                        }
                                                        initialFocus
                                                        className="bg-neutral-900 text-neutral-50"
                                                    />
                                                </PopoverContent>
                                            </Popover>

                                            <Input
                                                type="time"
                                                className="w-[120px] bg-neutral-900 border-neutral-800 text-white [color-scheme:dark]"
                                                onChange={(e) => handleTimeChange(e, field)}
                                                value={zonedDate ? format(zonedDate, 'HH:mm') : ''}
                                            />
                                        </div>
                                        <FormDescription>

                                            Select the planned start time (In {activeTimeZone}).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )
                            }}
                        />

                        <div className="grid grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="rosterUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Roster URL (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://docs.google.com/..." {...field} className="bg-neutral-900 border-neutral-800" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="modlistUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Modlist URL (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://..." {...field} className="bg-neutral-900 border-neutral-800" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-6 pt-4 border-t border-neutral-800">
                            <FormField
                                control={form.control}
                                name="bannerUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <FileUpload
                                                label="Event Banner (Image)"
                                                value={field.value}
                                                onChange={field.onChange}
                                                accept="image/*"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="sitrepUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <FileUpload
                                                label="SITREP (PDF)"
                                                value={field.value}
                                                onChange={field.onChange}
                                                accept="application/pdf"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="pt-6 flex gap-4">
                            <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-500">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {mode === 'edit' ? 'Update Event' : 'Create Event'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>

            <div className="hidden lg:block w-[400px] shrink-0">
                <div className="sticky top-8 space-y-4">
                    <h2 className="text-lg font-semibold text-neutral-400">Discord Preview</h2>
                    <DiscordPreview
                        data={formValues}
                        author={discordProfile ? {
                            name: (discordProfile as any).global_name || (discordProfile as any).username || session?.user?.name || 'Unknown User',
                            image: discordProfile.avatarUrl
                        } : (session?.user ? {
                            name: session.user.name || 'Unknown User',
                            image: session.user.image
                        } : undefined)}
                    />
                    <p className="text-sm text-neutral-500 text-center">
                        This is how the announcement will look in Discord.
                    </p>
                </div>
            </div>
        </div>
    )
}
