import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export type ActionType =
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "LOGIN"
    | "LOGOUT"
    | "INVITE"
    | "ENABLE"
    | "DISABLE"
    | "SCHEDULE"
    | "ANNOUNCE"
    | "CANCEL";

export type EntityType =
    | "User"
    | "Event"
    | "Settings"
    | "Invitation"
    | "System";

/**
 * Creates an audit log entry.
 * 
 * @param action The type of action performed (e.g., CREATE, UPDATE)
 * @param entity The type of entity affected (e.g., Event, User)
 * @param entityId The ID of the affected entity
 * @param details Additional metadata about the action (e.g., changed fields, IP address)
 * @param userId Optional user ID. If not provided, attempts to get the current session user.
 */
export async function logAction(
    action: ActionType,
    entity: EntityType,
    entityId: string | null,
    details?: Record<string, any>,
    userId?: string
) {
    try {
        let actorId = userId;

        if (!actorId) {
            const session = await auth();
            actorId = session?.user?.id;
        }

        // Even if no user is found (system action), we log it.

        await prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                details: details || {},
                userId: actorId || null,
            },
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
        // We don't throw here to avoid breaking the main application flow if logging fails
    }
}
