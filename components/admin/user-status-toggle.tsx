'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { toggleUserStatus } from '@/app/actions';
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
import { Loader2 } from 'lucide-react';

interface UserStatusToggleProps {
    userId: string;
    isActive: boolean;
    userName: string;
}

export function UserStatusToggle({ userId, isActive, userName }: UserStatusToggleProps) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleToggle = async () => {
        setLoading(true);
        try {
            await toggleUserStatus(userId, !isActive);
            toast.success(`User ${isActive ? 'disabled' : 'enabled'} successfully.`);
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update user status.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant={isActive ? "destructive" : "outline"}
                    size="sm"
                    className={isActive ? "" : "text-green-400 border-green-800 bg-green-950/30 hover:bg-green-900/50 hover:text-green-300"}
                >
                    {isActive ? "Disable" : "Enable"}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-neutral-200">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-neutral-400">
                        This action will {isActive ? "disable" : "enable"} the account for <strong className="text-neutral-200">{userName || 'this user'}</strong>.
                        {isActive
                            ? " They will be immediately logged out and unable to access the system."
                            : " They will satisfy access requirements and be able to log in again."
                        }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700 hover:text-neutral-50">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleToggle();
                        }}
                        className={isActive ? "bg-red-600 hover:bg-red-500 text-white border-none" : "bg-green-600 hover:bg-green-500 text-white border-none"}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isActive ? "Yes, Disable Account" : "Yes, Enable Account"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
