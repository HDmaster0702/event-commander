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
import { cancelSchedule } from "@/app/actions/events";

interface CancelScheduleAlertDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventId: string;
}

export function CancelScheduleAlertDialog({ open, onOpenChange, eventId }: CancelScheduleAlertDialogProps) {
    const [isPending, startTransition] = useTransition();

    const handleCancel = () => {
        startTransition(async () => {
            const result = await cancelSchedule(eventId);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Schedule cancelled");
                onOpenChange(false);
            }
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50">
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Scheduled Announcement?</AlertDialogTitle>
                    <AlertDialogDescription className="text-neutral-400">
                        This will remove the event from the schedule. It will not be announced automatically.
                        The event status will revert to DRAFT.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-neutral-700 hover:bg-neutral-800 text-neutral-300">
                        Keep Scheduled
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleCancel();
                        }}
                        disabled={isPending}
                        className="bg-red-600 hover:bg-red-500 text-white"
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Cancel Schedule
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
