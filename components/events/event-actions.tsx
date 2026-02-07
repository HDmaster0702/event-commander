'use client';

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Megaphone, Trash2, CalendarClock, User, Ban, Settings } from "lucide-react";
import { toast } from "sonner";
import { EventStatus, Event } from "@prisma/client";
import NextLink from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ManageEventMenu } from "./manage-event-menu";
import { AnnounceDialog } from "./dialogs/announce-dialog";
import { AnnounceAlertDialog } from "./dialogs/announce-alert-dialog";
import { CancelScheduleAlertDialog } from "./dialogs/cancel-schedule-alert-dialog";

interface EventActionsProps {
    event: Event;
    timeZone: string;
    canTransfer?: boolean;
}

export function EventActions({ event, timeZone, canTransfer = false }: EventActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [openDialog, setOpenDialog] = useState<'announce' | 'schedule' | 'cancel' | 'transfer' | 'delete' | null>(null);

    // If announced, use the dedicated menu
    if (event.status === EventStatus.ANNOUNCED) {
        return <ManageEventMenu event={event} timeZone={timeZone} canTransfer={canTransfer} />;
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white hover:bg-neutral-800">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-neutral-200">
                    <DropdownMenuItem asChild>
                        <NextLink
                            href={`/admin/events/${event.id}/edit`}
                            className="flex items-center w-full focus:bg-neutral-800 focus:text-white cursor-pointer"
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </NextLink>
                    </DropdownMenuItem>

                    {event.status === EventStatus.SCHEDULED ? (
                        <>
                            <DropdownMenuItem
                                onClick={() => setOpenDialog('cancel')}
                                className="focus:bg-neutral-800 focus:text-white cursor-pointer"
                            >
                                <Ban className="mr-2 h-4 w-4" />
                                Cancel Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setOpenDialog('announce')}
                                className="focus:bg-neutral-800 focus:text-white cursor-pointer text-blue-400 focus:text-blue-400"
                            >
                                <Megaphone className="mr-2 h-4 w-4" />
                                Announce Now
                            </DropdownMenuItem>
                        </>
                    ) : (
                        <>
                            <DropdownMenuItem
                                onClick={() => setOpenDialog('schedule')}
                                className="focus:bg-neutral-800 focus:text-white cursor-pointer"
                            >
                                <CalendarClock className="mr-2 h-4 w-4" />
                                Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setOpenDialog('announce')}
                                className="focus:bg-neutral-800 focus:text-white cursor-pointer text-blue-400 focus:text-blue-400"
                            >
                                <Megaphone className="mr-2 h-4 w-4" />
                                Announce Now
                            </DropdownMenuItem>
                        </>
                    )}

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
                        onClick={() => setOpenDialog('delete')}
                        className="text-red-400 focus:bg-red-950/30 focus:text-red-400 cursor-pointer"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialogs */}
            <AnnounceDialog
                event={event}
                timeZone={timeZone}
                open={openDialog === 'schedule'}
                onOpenChange={(open) => setOpenDialog(open ? 'schedule' : null)}
            />

            <AnnounceAlertDialog
                eventId={event.id}
                open={openDialog === 'announce'}
                onOpenChange={(open) => setOpenDialog(open ? 'announce' : null)}
            />

            <CancelScheduleAlertDialog
                eventId={event.id}
                open={openDialog === 'cancel'}
                onOpenChange={(open) => setOpenDialog(open ? 'cancel' : null)}
            />

            <TransferDialog
                open={openDialog === 'transfer'}
                onOpenChange={(open) => setOpenDialog(open ? 'transfer' : null)}
                eventId={event.id}
                eventName={event.name}
            />

            <AlertDialog open={openDialog === 'delete'} onOpenChange={(open) => setOpenDialog(open ? 'delete' : null)}>
                <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                        <AlertDialogDescription className="text-neutral-400">
                            Are you sure you want to delete this event? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-neutral-700 hover:bg-neutral-800 text-neutral-300">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                startTransition(async () => {
                                    const { deleteEvent } = await import("@/app/actions/events");
                                    const result = await deleteEvent(event.id);
                                    if (result?.error) {
                                        toast.error(result.error);
                                    } else {
                                        toast.success("Event deleted");
                                    }
                                    setOpenDialog(null);
                                });
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
