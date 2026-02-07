
import { prisma } from "@/lib/prisma";
import { EventForm } from "@/app/admin/events/new/event-form";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";

interface EditEventPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const event = await prisma.event.findUnique({
        where: { id },
    });

    if (!event) {
        notFound();
    }

    // Ensure user owns the event
    if (event.createdById !== session.user.id) {
        return (
            <div className="p-8 text-red-500">
                You do not have permission to edit this event.
            </div>
        );
    }

    const settings = await prisma.settings.findFirst();
    const timeZone = settings?.timeZone || "UTC";

    // Convert to form values. URLs might be null in DB but string in form.
    const initialData = {
        ...event,
        description: event.description || "",
        bannerUrl: event.bannerUrl || "",
        sitrepUrl: event.sitrepUrl || "",
        rosterUrl: event.rosterUrl || "",
        modlistUrl: event.modlistUrl || "",
    };

    return (
        <EventForm timeZone={timeZone} initialData={initialData} mode="edit" />
    );
}
