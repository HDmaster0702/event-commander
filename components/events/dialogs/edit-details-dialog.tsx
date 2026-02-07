'use client';

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateEvent } from "@/app/actions/events";
import { Event } from "@prisma/client";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface EditDetailsDialogProps {
    event: Event;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditDetailsDialog({ event, open, onOpenChange }: EditDetailsDialogProps) {
    const [isPending, startTransition] = useTransition();
    const { register, handleSubmit } = useForm({
        defaultValues: {
            name: event.name,
            description: event.description || '',
        }
    });

    const onSubmit = (data: any) => {
        startTransition(async () => {
            // We only send the fields we formatted. updateEvent handles the rest.
            // We need to pass the FULL object for safety if our TS type requires it, 
            // but effectively we just need to merge.
            // However, our updateEvent expects EventFormValues... 
            // We should ideally partial update, but for now let's construct a compatible object
            // utilizing the existing event data for fields we aren't changing here.

            const payload = {
                ...event, // Spread existing
                ...data, // Overwrite name/desc
                // Ensure dates are Dates (Prisma implies they are, but serializing might change things if passed from server component props)
                startTime: new Date(event.startTime),
                // Ensure nulls are handled if the type expects strings
                description: data.description || "",
                bannerUrl: event.bannerUrl || "",
                sitrepUrl: event.sitrepUrl || "",
                rosterUrl: event.rosterUrl || "",
                modlistUrl: event.modlistUrl || "",
            };

            const result = await updateEvent(event.id, payload);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Event details updated");
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50 sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Details</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Update the visible title and description of the announcement.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Event Name</Label>
                        <Input
                            {...register('name', { required: true })}
                            className="bg-neutral-950 border-neutral-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            {...register('description')}
                            className="bg-neutral-950 border-neutral-800 min-h-[100px] resize-none"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
