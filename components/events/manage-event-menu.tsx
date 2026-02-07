'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
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
import { TransferDialog } from "./dialogs/transfer-dialog";
import { EditDetailsDialog } from "./dialogs/edit-details-dialog";
import { RescheduleDialog } from "./dialogs/reschedule-dialog";
import { UpdateFilesDialog } from "./dialogs/update-files-dialog";
import { Settings, Pencil, CalendarClock, User, Trash2, FileAxis3D } from "lucide-react";
import { Event } from "@prisma/client";

interface ManageEventMenuProps {
    event: Event;
    timeZone: string;
    canTransfer?: boolean;
}

export function ManageEventMenu({ event, timeZone, canTransfer = false }: ManageEventMenuProps) {
    const [openDialog, setOpenDialog] = useState<string | null>(null);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Manage
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-neutral-200">
                    <DropdownMenuItem
                        onClick={() => setOpenDialog('details')}
                        className="focus:bg-neutral-800 focus:text-white cursor-pointer"
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setOpenDialog('reschedule')}
                        className="focus:bg-neutral-800 focus:text-white cursor-pointer"
                    >
                        <CalendarClock className="mr-2 h-4 w-4" />
                        Reschedule
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setOpenDialog('files')}
                        className="focus:bg-neutral-800 focus:text-white cursor-pointer"
                    >
                        <FileAxis3D className="mr-2 h-4 w-4" />
                        Update Files
                    </DropdownMenuItem>
                    {canTransfer && (
                        <DropdownMenuItem
                            onClick={() => setOpenDialog('transfer')}
                            className="focus:bg-neutral-800 focus:text-white cursor-pointer"
                        >
                            <User className="mr-2 h-4 w-4" />
                            Transfer Ownership
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        onClick={() => setOpenDialog('cancel')}
                        className="text-red-400 focus:bg-red-950/30 focus:text-red-400 cursor-pointer"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancel Event
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <EditDetailsDialog
                event={event}
                open={openDialog === 'details'}
                onOpenChange={(open) => setOpenDialog(open ? 'details' : null)}
            />

            <RescheduleDialog
                event={event}
                timeZone={timeZone}
                open={openDialog === 'reschedule'}
                onOpenChange={(open) => setOpenDialog(open ? 'reschedule' : null)}
            />

            <UpdateFilesDialog
                event={event}
                open={openDialog === 'files'}
                onOpenChange={(open) => setOpenDialog(open ? 'files' : null)}
            />

            <TransferDialog
                open={openDialog === 'transfer'}
                onOpenChange={(open) => setOpenDialog(open ? 'transfer' : null)}
                eventId={event.id}
                eventName={event.name}
            />

            <AlertDialog open={openDialog === 'cancel'} onOpenChange={(open) => setOpenDialog(open ? 'cancel' : null)}>
                <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Event?</AlertDialogTitle>
                        <AlertDialogDescription className="text-neutral-400">
                            This will update the Discord announcement to show [CANCELLED] and remove the event from the database. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-neutral-700 hover:bg-neutral-800 text-neutral-300">Abort</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                const { cancelEvent } = await import("@/app/actions/events");
                                const result = await cancelEvent(event.id);
                                if (result?.error) {
                                    toast.error(result.error);
                                } else {
                                    toast.success("Event cancelled");
                                }
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white"
                        >
                            Confirm Cancel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog >
        </>
    );
}
