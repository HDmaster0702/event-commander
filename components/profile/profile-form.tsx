'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateProfile, changePassword } from '@/app/actions/profile';
import { toast } from 'sonner';
import { User } from '@prisma/client';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
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
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface ProfileFormProps {
    user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
    const { update } = useSession();
    // General State
    const [name, setName] = useState(user.name || "");
    const [email, setEmail] = useState(user.email || "");
    const [timeZone, setTimeZone] = useState(user.timeZone || "UTC");
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [openTimeZone, setOpenTimeZone] = useState(false);

    // Security State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [updatingPassword, setUpdatingPassword] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdatingProfile(true);
        try {
            await updateProfile({ name, email, timeZone });
            await update(); // Refresh session data
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        }
        setUpdatingProfile(false);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setUpdatingPassword(true);
        try {
            const result = await changePassword(currentPassword, newPassword);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Password changed successfully");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to change password");
        }
        setUpdatingPassword(false);
    };

    return (
        <Tabs defaultValue="general" className="w-full max-w-2xl mx-auto">
            <TabsList className="mb-6 bg-neutral-800">
                <TabsTrigger value="general" className="text-neutral-200 hover:text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    General
                </TabsTrigger>
                <TabsTrigger value="security" className="text-neutral-200 hover:text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Security
                </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-neutral-200">Profile Information</CardTitle>
                        <CardDescription className="text-neutral-400">Update your account details and preferences.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Name</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-neutral-800 border-neutral-700 text-neutral-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Email</label>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-neutral-800 border-neutral-700 text-neutral-200"
                                />
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <label className="text-sm font-medium text-neutral-300">Time Zone</label>
                                <Popover open={openTimeZone} onOpenChange={setOpenTimeZone}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openTimeZone}
                                            className="w-full justify-between bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-neutral-100"
                                        >
                                            {timeZone
                                                ? timeZone
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
                                                                setTimeZone(currentValue);
                                                                setOpenTimeZone(false);
                                                            }}
                                                            className="text-neutral-200 data-[selected=true]:bg-blue-600/20 data-[selected=true]:text-blue-500 cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    timeZone === tz ? "opacity-100" : "opacity-0"
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
                            <div className="pt-4">
                                <Button type="submit" disabled={updatingProfile} className="bg-blue-600 hover:bg-blue-500">
                                    {updatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="security">
                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-neutral-200">Security Settings</CardTitle>
                        <CardDescription className="text-neutral-400">Manage your password and security.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Current Password</label>
                                <Input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="bg-neutral-800 border-neutral-700 text-neutral-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">New Password</label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="bg-neutral-800 border-neutral-700 text-neutral-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Confirm New Password</label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-neutral-800 border-neutral-700 text-neutral-200"
                                />
                            </div>
                            <div className="pt-4">
                                <Button type="submit" disabled={updatingPassword} className="bg-blue-600 hover:bg-blue-500">
                                    {updatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Change Password
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
