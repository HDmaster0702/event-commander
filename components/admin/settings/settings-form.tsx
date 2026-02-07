'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveSettings, fetchChannels } from '@/app/actions/settings';
import { APIGuild, APIChannel } from 'discord-api-types/v10';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from '@prisma/client';

interface SettingsFormProps {
    initialSettings: Settings | null;
    initialGuilds: APIGuild[];
}

export function SettingsForm({ initialSettings, initialGuilds }: SettingsFormProps) {
    const [saving, setSaving] = useState(false);
    // Use initial data
    const [guilds, setGuilds] = useState<APIGuild[]>(initialGuilds);
    const [channels, setChannels] = useState<APIChannel[]>([]);

    const [selectedGuildId, setSelectedGuildId] = useState(initialSettings?.discordGuildId || "");
    const [selectedChannelId, setSelectedChannelId] = useState(initialSettings?.announcementChannelId || "");
    const [selectedGuideChannelId, setSelectedGuideChannelId] = useState(initialSettings?.notificationGuideChannelId || "");
    const [selectedTimeZone, setSelectedTimeZone] = useState(initialSettings?.timeZone || "UTC");

    const [openGuild, setOpenGuild] = useState(false);
    const [openChannel, setOpenChannel] = useState(false);
    const [openGuideChannel, setOpenGuideChannel] = useState(false);
    const [openTimeZone, setOpenTimeZone] = useState(false);
    const [openSaveDialog, setOpenSaveDialog] = useState(false);

    // Initial channel fetch if guild is selected
    useEffect(() => {
        if (selectedGuildId) {
            fetchChannels(selectedGuildId).then(setChannels);
        }
    }, [selectedGuildId]); // This will trigger on mount if selectedGuildId is set from initialSettings

    const handleGuildSelect = async (guildId: string) => {
        setSelectedGuildId(guildId);
        setSelectedChannelId(""); // Reset channel when guild changes
        setSelectedGuideChannelId("");
        setOpenGuild(false);
        // Channels will be fetched by the useEffect above
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveSettings({
                discordGuildId: selectedGuildId,
                announcementChannelId: selectedChannelId,
                notificationGuideChannelId: selectedGuideChannelId,
                timeZone: selectedTimeZone
            });
            toast.success('Settings saved!');
            setOpenSaveDialog(false);
        } catch (e) {
            console.error(e);
            toast.error('Failed to save settings.');
        }
        setSaving(false);
    };

    return (
        <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
                <CardTitle className="text-neutral-200">Configuration</CardTitle>
                <CardDescription className="text-neutral-400">
                    Manage system-wide settings and integrations.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="mb-6 bg-neutral-800">
                        <TabsTrigger
                            value="general"
                            className="text-neutral-200 hover:text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                        >
                            General
                        </TabsTrigger>
                        <TabsTrigger
                            value="discord"
                            className="text-neutral-200 hover:text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                        >
                            Discord Configuration
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4">
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-neutral-300">Community Time Zone</label>
                            <p className="text-xs text-neutral-400 mb-2">
                                Set the primary time zone for your community. This will be used as the default for event planning.
                            </p>
                            <Popover open={openTimeZone} onOpenChange={setOpenTimeZone}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openTimeZone}
                                        className="w-full md:w-[300px] justify-between bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-neutral-100"
                                    >
                                        {selectedTimeZone
                                            ? selectedTimeZone
                                            : "Select time zone..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0 bg-neutral-800 border-neutral-700 text-neutral-50">
                                    <Command className="bg-neutral-800 text-neutral-50">
                                        <CommandInput placeholder="Search time zone..." className="text-neutral-50" />
                                        <CommandList>
                                            <CommandEmpty>No time zone found.</CommandEmpty>
                                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                                                {Intl.supportedValuesOf('timeZone').map((tz) => (
                                                    <CommandItem
                                                        key={tz}
                                                        value={tz}
                                                        onSelect={(currentValue) => {
                                                            setSelectedTimeZone(currentValue);
                                                            setOpenTimeZone(false);
                                                        }}
                                                        className="text-neutral-200 data-[selected=true]:bg-blue-600/20 data-[selected=true]:text-blue-500 cursor-pointer"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedTimeZone === tz ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {tz}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </TabsContent>

                    <TabsContent value="discord" className="space-y-6">
                        {/* Guild Selection */}
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-neutral-300">Target Server (Guild)</label>
                            <Popover open={openGuild} onOpenChange={setOpenGuild}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openGuild}
                                        className="w-full md:w-[300px] justify-between bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-neutral-100"
                                    >
                                        {selectedGuildId ? (
                                            (() => {
                                                const guild = guilds.find((g) => g.id === selectedGuildId);
                                                if (!guild) return "Select server...";
                                                return (
                                                    <div className="flex items-center">
                                                        {guild.icon ? (
                                                            <img
                                                                src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                                                alt={guild.name}
                                                                className="w-5 h-5 rounded-full mr-2"
                                                            />
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full bg-neutral-700 mr-2 flex items-center justify-center text-[10px]">
                                                                {guild.name.substring(0, 1)}
                                                            </div>
                                                        )}
                                                        <span className="truncate">{guild.name}</span>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            "Select server..."
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0 bg-neutral-800 border-neutral-700 text-neutral-50">
                                    <Command className="bg-neutral-800 text-neutral-50">
                                        <CommandInput placeholder="Search server..." className="text-neutral-50" />
                                        <CommandList>
                                            <CommandEmpty>No server found.</CommandEmpty>
                                            <CommandGroup>
                                                {guilds.map((guild) => (
                                                    <CommandItem
                                                        key={guild.id}
                                                        value={guild.name}
                                                        onSelect={() => handleGuildSelect(guild.id)}
                                                        className="text-neutral-200 data-[selected=true]:bg-blue-600/20 data-[selected=true]:text-blue-500 cursor-pointer"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedGuildId === guild.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {guild.icon ? (
                                                            <img
                                                                src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                                                alt={guild.name}
                                                                className="w-6 h-6 rounded-full mr-2"
                                                            />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-neutral-700 mr-2 flex items-center justify-center text-xs">
                                                                {guild.name.substring(0, 1)}
                                                            </div>
                                                        )}
                                                        {guild.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Channel Selection */}
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-neutral-300">Announcement Channel</label>
                            <Popover open={openChannel} onOpenChange={setOpenChannel}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openChannel}
                                        disabled={!selectedGuildId}
                                        className="w-full md:w-[300px] justify-between bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-neutral-100 disabled:opacity-50"
                                    >
                                        {selectedChannelId
                                            ? channels.find((c) => c.id === selectedChannelId)?.name
                                            : "Select channel..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0 bg-neutral-800 border-neutral-700 text-neutral-50">
                                    <Command className="bg-neutral-800 text-neutral-50">
                                        <CommandInput placeholder="Search channel..." className="text-neutral-50" />
                                        <CommandList>
                                            <CommandEmpty>No channel found.</CommandEmpty>
                                            <CommandGroup>
                                                {channels.map((channel) => (
                                                    <CommandItem
                                                        key={channel.id}
                                                        value={channel.name || ""}
                                                        onSelect={() => {
                                                            setSelectedChannelId(channel.id);
                                                            setOpenChannel(false);
                                                        }}
                                                        className="text-neutral-200 data-[selected=true]:bg-blue-600/20 data-[selected=true]:text-blue-500 cursor-pointer"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedChannelId === channel.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {channel.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Notification Guide Channel */}
                        <div className="flex flex-col space-y-2 mt-4">
                            <label className="text-sm font-medium text-neutral-300">Notification Guide Channel</label>
                            <p className="text-xs text-neutral-400 mb-2">Where the bot will post the "How to use Notifications" guide.</p>
                            <div className="flex flex-col md:flex-row gap-4 md:items-start">
                                <Popover open={openGuideChannel} onOpenChange={setOpenGuideChannel}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openGuideChannel}
                                            disabled={!selectedGuildId}
                                            className="w-full md:w-[300px] justify-between bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-neutral-100 disabled:opacity-50"
                                        >
                                            {selectedGuideChannelId
                                                ? channels.find((c) => c.id === selectedGuideChannelId)?.name
                                                : "Select channel..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0 bg-neutral-800 border-neutral-700 text-neutral-50">
                                        <Command className="bg-neutral-800 text-neutral-50">
                                            <CommandInput placeholder="Search channel..." className="text-neutral-50" />
                                            <CommandList>
                                                <CommandEmpty>No channel found.</CommandEmpty>
                                                <CommandGroup>
                                                    {channels.map((channel) => (
                                                        <CommandItem
                                                            key={channel.id}
                                                            value={channel.name || ""}
                                                            onSelect={() => {
                                                                setSelectedGuideChannelId(channel.id);
                                                                setOpenGuideChannel(false);
                                                            }}
                                                            className="text-neutral-200 data-[selected=true]:bg-blue-600/20 data-[selected=true]:text-blue-500 cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedGuideChannelId === channel.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {channel.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                <Button
                                    variant="secondary"
                                    className="w-full md:w-auto"
                                    onClick={async () => {
                                        if (!selectedGuideChannelId) {
                                            toast.error("Please save a guide channel first (or select one).");
                                            return;
                                        }
                                        // We trigger save first if changed? Or just rely on persisted.
                                        // Assuming user saved.
                                        const { sendNotificationGuide } = await import('@/app/actions/settings');
                                        toast.promise(sendNotificationGuide(), {
                                            loading: 'Sending guide...',
                                            success: (data) => {
                                                if (data.error) throw new Error(data.error);
                                                return 'Guide sent successfully!';
                                            },
                                            error: (e) => `Error: ${e.message}`
                                        });
                                    }}
                                >
                                    Push Guide Embed
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
                <div className="mt-8"></div>

                <AlertDialog open={openSaveDialog} onOpenChange={setOpenSaveDialog}>
                    <AlertDialogTrigger asChild>
                        <Button
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-500"
                        >
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-neutral-200">Save Discord Configuration?</AlertDialogTitle>
                            <AlertDialogDescription className="text-neutral-400">
                                This will update the bot's target server and announcement channel.
                                Make sure the bot is in the selected server.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700 hover:text-neutral-50">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSave();
                                }}
                                className="bg-blue-600 hover:bg-blue-500 text-white border-none"
                            >
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Save
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </CardContent>
        </Card>
    );
}
