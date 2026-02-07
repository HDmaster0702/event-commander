'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { transferEvent } from "@/app/actions/transfer-event";
import { toast } from "sonner";
import { User } from "@prisma/client";
import { getUsers } from "@/app/actions/users"; // Need to ensure this exists or create it

interface TransferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventId: string;
    eventName: string;
}

export function TransferDialog({ open, onOpenChange, eventId, eventName }: TransferDialogProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const [openCombobox, setOpenCombobox] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            // Fetch users (active only)
            import("@/app/actions/users").then(async (mod) => {
                try {
                    const fetchedUsers = await mod.getUsers();
                    setUsers(fetchedUsers.filter(u => u.isActive));
                } catch (e) {
                    console.error(e);
                    toast.error("Failed to load users");
                } finally {
                    setLoading(false);
                }
            });
        }
    }, [open]);

    const handleTransfer = async () => {
        if (!selectedUserId) return;
        setTransferring(true);
        try {
            const result = await transferEvent(eventId, selectedUserId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Event transferred successfully");
                onOpenChange(false);
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setTransferring(false);
        }
    };

    const selectedUser = users.find(u => u.id === selectedUserId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Transfer Event Ownership</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Select a new owner for "{eventName}". They will have full control over this event.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCombobox}
                                className="w-full justify-between bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-white"
                            >
                                {selectedUser ? selectedUser.name : "Select user..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-neutral-800 border-neutral-700 text-neutral-200">
                            <Command className="bg-neutral-800 text-neutral-200">
                                <CommandInput placeholder="Search user..." className="text-neutral-200" />
                                <CommandList>
                                    <CommandEmpty>No user found.</CommandEmpty>
                                    <CommandGroup>
                                        {users.map((user) => (
                                            <CommandItem
                                                key={user.id}
                                                value={user.name || user.email}
                                                onSelect={() => {
                                                    setSelectedUserId(user.id);
                                                    setOpenCombobox(false);
                                                }}
                                                className="aria-selected:bg-neutral-700 text-neutral-200"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedUserId === user.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex flex-col">
                                                    <span>{user.name}</span>
                                                    <span className="text-xs text-neutral-500">{user.email}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-neutral-400">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleTransfer}
                        disabled={!selectedUserId || transferring}
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                        {transferring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Transfer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
