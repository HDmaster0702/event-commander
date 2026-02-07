import { prisma } from "@/lib/prisma";
import { EventForm } from "./event-form";

export default async function NewEventPage() {
    const settings = await prisma.settings.findFirst();
    const timeZone = settings?.timeZone || "UTC";

    return (
        <EventForm timeZone={timeZone} />
    );
}
