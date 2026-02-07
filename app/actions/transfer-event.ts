'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger";

export async function transferEvent(eventId: string, newOwnerId: string) {
    const session = await auth();
    // @ts-ignore
    const role = session?.user?.role;

    if (!session?.user?.email || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
        return { error: "Unauthorized" };
    }

    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { createdBy: true }
        });

        if (!event) {
            return { error: "Event not found" };
        }

        const newOwner = await prisma.user.findUnique({
            where: { id: newOwnerId }
        });

        if (!newOwner) {
            return { error: "New owner not found" };
        }

        await prisma.event.update({
            where: { id: eventId },
            data: { createdById: newOwnerId }
        });

        await logAction(
            "UPDATE",
            "Event",
            event.id,
            { message: `Transferred event "${event.name}" from ${event.createdBy.name} to ${newOwner.name}` },
            // @ts-ignore
            session.user.id
        );

        revalidatePath('/admin/events');
        return { success: true };
    } catch (error) {
        console.error("Failed to transfer event:", error);
        return { error: "Failed to transfer event" };
    }
}
