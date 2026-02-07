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
import { updateEvent } from "@/app/actions/events";
import { Event } from "@prisma/client";
import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { FileUpload } from "@/components/events/file-upload";

interface UpdateFilesDialogProps {
    event: Event;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UpdateFilesDialog({ event, open, onOpenChange }: UpdateFilesDialogProps) {
    const [isPending, startTransition] = useTransition();
    const { control, register, handleSubmit } = useForm({
        defaultValues: {
            bannerUrl: event.bannerUrl || "",
            sitrepUrl: event.sitrepUrl || "",
            rosterUrl: event.rosterUrl || "",
            modlistUrl: event.modlistUrl || "",
        }
    });

    const onSubmit = (data: any) => {
        startTransition(async () => {
            const payload = {
                ...event,
                ...data,
                startTime: new Date(event.startTime),
                description: event.description || "",
            };

            const result = await updateEvent(event.id, payload);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Event files updated");
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50 sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Update Files & Links</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Update attached files and external links.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">

                    <div className="space-y-2">
                        <Label>Roster URL</Label>
                        <Input
                            {...register('rosterUrl')}
                            placeholder="https://docs.google.com/..."
                            className="bg-neutral-950 border-neutral-800"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Modlist URL</Label>
                        <Input
                            {...register('modlistUrl')}
                            placeholder="https://..."
                            className="bg-neutral-950 border-neutral-800"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>SITREP (PDF)</Label>
                        <Controller
                            control={control}
                            name="sitrepUrl"
                            render={({ field }) => (
                                <FileUpload
                                    label=""
                                    value={field.value}
                                    onChange={field.onChange}
                                    accept="application/pdf"
                                />
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Event Banner</Label>
                        <Controller
                            control={control}
                            name="bannerUrl"
                            render={({ field }) => (
                                <FileUpload
                                    label=""
                                    value={field.value}
                                    onChange={field.onChange}
                                    accept="image/*"
                                />
                            )}
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
