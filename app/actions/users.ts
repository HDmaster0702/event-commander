'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getUsers() {
    const session = await auth();
    // @ts-ignore
    if (!session?.user?.id) return []; // Basic protection

    return prisma.user.findMany({
        orderBy: { name: 'asc' }
    });
}
