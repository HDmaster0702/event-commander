'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { updateUser } from '@/app/actions';
import { createInvitation, reactivateUser, checkDiscordUserStatus } from '@/app/actions/invitations';
import { toast } from 'sonner';
import { AlertTriangle, Check, Edit, Plus, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DiscordUserPicker } from '@/components/admin/discord-user-picker';
import { useSession } from 'next-auth/react';

// Separate schemas for Edit (just User update) vs Create (Invitation)
const editUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().optional(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ANNOUNCER']),
    discordId: z.string().min(1, "Discord User is required"),
});

const inviteUserSchema = z.object({
    discordId: z.string().min(1, "Discord User is required"),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ANNOUNCER']),
});

interface UserDialogProps {
    user?: {
        id: string;
        name: string | null;
        email: string;
        discordId: string;
        role: 'SUPER_ADMIN' | 'ADMIN' | 'ANNOUNCER';
    };
}

type FormValues = {
    name?: string;
    email?: string;
    password?: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'ANNOUNCER';
    discordId: string;
};

export function UserDialog({ user }: UserDialogProps) {
    const isEdit = !!user;
    const { data: session } = useSession();
    // @ts-ignore
    const currentUserRole = session?.user?.role;

    const [open, setOpen] = useState(false);

    // Invitation State
    const [inviteResult, setInviteResult] = useState<{ success: boolean; link?: string; dmSent?: boolean } | null>(null);

    // Re-enable Logic
    const [reEnableUser, setReEnableUser] = useState<{ id: string; name: string } | null>(null);

    const router = useRouter();

    // Form setup differs based on mode
    const form = useForm<FormValues>({
        resolver: zodResolver(isEdit ? editUserSchema : inviteUserSchema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            password: '',
            role: user?.role || 'ANNOUNCER',
            discordId: user?.discordId || '', // For invite
        },
    });

    useEffect(() => {
        if (open) {
            setInviteResult(null);
            if (isEdit) {
                form.reset({
                    name: user?.name || '',
                    email: user?.email || '',
                    password: '',
                    role: user?.role || 'ANNOUNCER',
                    discordId: user?.discordId || '',
                });
            } else {
                form.reset({
                    role: 'ANNOUNCER',
                    discordId: '',
                    name: '',
                    email: '',
                    password: ''
                });
            }
        }
    }, [open, user, isEdit, form]);

    async function onSubmit(values: any) {
        try {
            if (isEdit && user) {
                await updateUser(user.id, values);
                toast.success('User updated successfully');
                setOpen(false);
                router.refresh();

            } else {
                // Invite Flow
                // First check if user exists but is disabled
                const existingUser = await checkDiscordUserStatus(values.discordId);

                if (existingUser && !existingUser.isActive) {
                    setReEnableUser({ id: values.discordId, name: existingUser.name || 'User' });
                    return;
                }

                const res = await createInvitation(values.discordId, values.role);
                if (res.error) {
                    toast.error(res.error);
                } else {
                    setInviteResult({
                        success: true,
                        link: res.inviteLink,
                        dmSent: res.dmSent
                    });
                    toast.success(res.dmSent ? "Invitation sent via DM!" : "Invitation created!");
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed execution");
        }
    }

    // RBAC: Logic to determine if we can edit
    const canEdit = isEdit ? (
        currentUserRole === 'SUPER_ADMIN' ||
        (currentUserRole === 'ADMIN' && user?.role === 'ANNOUNCER')
    ) : true; // Can always click invite, but form validates role options

    if (isEdit && !canEdit) {
        return null; // Or render disabled button? Better to just hide edit for unauthorized.
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEdit ? (
                    <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                    </Button>
                ) : (
                    <Button className="bg-blue-600 hover:bg-blue-500">
                        <Plus className="h-4 w-4 mr-2" />
                        Invite User
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-neutral-900 border-neutral-800 text-neutral-50 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit User' : 'Invite New User'}</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        {isEdit
                            ? 'Update user details.'
                            : 'Select a Discord user to invite. The bot will send them a link to set up their account.'}
                    </DialogDescription>
                </DialogHeader>

                <AlertDialog open={!!reEnableUser} onOpenChange={(open) => !open && setReEnableUser(null)}>
                    <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-yellow-500">
                                <AlertTriangle className="h-5 w-5" />
                                Re-enable User Account?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-neutral-400">
                                An account for <span className="font-semibold text-neutral-200">{reEnableUser?.name}</span> already exists but is currently disabled.
                                <br /><br />
                                Click "Re-enable" to reactivate their existing account immediately. They will not receive a new invitation link but can log in with their old credentials.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700 hover:text-white">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-yellow-600 text-white hover:bg-yellow-500"
                                onClick={async () => {
                                    if (reEnableUser) {
                                        await reactivateUser(reEnableUser.id);
                                        toast.success("User account reactivated");
                                        setReEnableUser(null);
                                        setOpen(false);
                                        router.refresh();
                                    }
                                }}
                            >
                                Re-enable Account
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {!isEdit && inviteResult && (
                    <div className="space-y-4">
                        <Alert className={`bg-neutral-800 border-neutral-700 ${inviteResult.dmSent ? 'text-green-400' : 'text-yellow-400'}`}>
                            {inviteResult.dmSent ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            <AlertTitle>{inviteResult.dmSent ? "Invitation Sent Successfully" : "DM Failed - Use Link Below"}</AlertTitle>
                            <AlertDescription>
                                {inviteResult.dmSent
                                    ? "The user has verified a direct message with the setup link."
                                    : "The bot could not DM the user. Please copy and send this link manually:"}
                            </AlertDescription>
                        </Alert>
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                value={inviteResult.link}
                                className="font-mono text-xs bg-black/30 border-neutral-700 select-all"
                            />
                            <Button size="sm" variant="secondary" className="bg-neutral-200 text-neutral-900 hover:bg-white" onClick={() => {
                                navigator.clipboard.writeText(inviteResult.link || "");
                                toast.success("Link copied!");
                            }}>
                                Copy
                            </Button>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => {
                                setOpen(false);
                                router.refresh();
                            }}>
                                Done
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {(!inviteResult || isEdit) && (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {isEdit && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="bg-neutral-800 border-neutral-700" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="bg-neutral-800 border-neutral-700" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password (Leave empty to keep)</FormLabel>
                                                <FormControl>
                                                    <Input type="password" {...field} className="bg-neutral-800 border-neutral-700" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}

                            <FormField
                                control={form.control}
                                name="discordId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Discord User</FormLabel>
                                        <FormControl>
                                            <DiscordUserPicker
                                                value={field.value}
                                                onSelect={(id) => form.setValue('discordId', id)}
                                            // Disable picker if editing? Maybe allow changing if mistakes were made.
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-neutral-800 border-neutral-700">
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-50">
                                                {/* Role Filtering Logic */}
                                                {(currentUserRole === 'SUPER_ADMIN') && (
                                                    <SelectItem value="ADMIN">Administrator</SelectItem>
                                                )}
                                                <SelectItem value="ANNOUNCER">Announcer</SelectItem>
                                                {/* Allow seeing own role if editing self? No, editing self via this dialog might be weird. */}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-500 w-full md:w-auto">
                                    {isEdit ? (
                                        'Update User'
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Send Invitation
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
