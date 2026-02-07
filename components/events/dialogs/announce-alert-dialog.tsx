'use client';

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
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { announceEvent } from "@/app/actions/events";

interface AnnounceAlertDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventId: string;
}

export function AnnounceAlertDialog({ open, onOpenChange, eventId }: AnnounceAlertDialogProps) {
    const [isPending, startTransition] = useTransition();

    const handleAnnounce = () => {
        startTransition(async () => {
            const result = await announceEvent(eventId);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Event announced successfully!");
                onOpenChange(false);
            }
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50">
                <AlertDialogHeader>
                    <AlertDialogTitle>Announce Event Now?</AlertDialogTitle>
                    <AlertDialogDescription className="text-neutral-400">
                        This will send an @everyone announcement to the Discord channel immediately.
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-neutral-700 hover:bg-neutral-800 text-neutral-300">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleAnnounce();
                        }}
                        disabled={isPending}
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Announce Now
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
