'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger";

export async function updateProfile(data: { name: string; email: string; timeZone: string }) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    await prisma.user.update({
        where: { email: session.user.email },
        data: {
            name: data.name,
            email: data.email,
            timeZone: data.timeZone
        }
    });

    await logAction("UPDATE", "User", session.user.id || null, { changes: data }, session.user.id);

    revalidatePath('/profile');
    revalidatePath('/'); // Revalidate everything just in case
}

export async function changePassword(currentPassword: string, newPassword: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) throw new Error("User not found");

    const isValid = await compare(currentPassword, user.password);
    if (!isValid) {
        return { error: "Current password is incorrect" };
    }

    const hashedPassword = await hash(newPassword, 12);

    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
    });

    await logAction("UPDATE", "User", user.id, { field: "password" }, user.id);

    return { success: true };
}
