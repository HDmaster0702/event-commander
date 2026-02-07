import { z } from 'zod';

export const EventFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    startTime: z.date({
        required_error: "Start time is required",
    }),
    bannerUrl: z.string().optional(),
    sitrepUrl: z.string().optional(),
    rosterUrl: z.string().optional(),
    modlistUrl: z.string().optional(),
});

export type EventFormValues = z.infer<typeof EventFormSchema>;
