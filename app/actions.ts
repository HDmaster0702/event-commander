'use server';

import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { logAction } from '@/lib/logger';

import { auth } from '@/auth';

export async function createUser(data: any) {
    const session = await auth();
    // @ts-ignore
    const userRole = session?.user?.role;

    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
        throw new Error("Unauthorized");
    }

    // RBAC: Admin can only create Announcers
    if (userRole === 'ADMIN' && data.role !== 'ANNOUNCER') {
        throw new Error("Admins can only create Announcers.");
    }

    const password = await hash(data.password, 12);

    await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password,
            discordId: data.discordId,
            role: data.role as Role,
        },
    });

    await logAction("CREATE", "User", null, { name: data.name, email: data.email, role: data.role });

    revalidatePath('/admin/users');
}

export async function updateUser(id: string, data: any) {
    const session = await auth();
    // @ts-ignore
    const currentUserRole = session?.user?.role;

    if (currentUserRole !== 'SUPER_ADMIN' && currentUserRole !== 'ADMIN') {
        throw new Error("Unauthorized");
    }

    // Fetch target user to check their role
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) throw new Error("User not found");

    // RBAC Rules
    if (currentUserRole === 'ADMIN') {
        // Cannot edit Super Admin or other Admins
        if (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN') {
            throw new Error("Admins cannot edit other Admins or Super Admins.");
        }
        // Cannot promote to Admin
        if (data.role === 'ADMIN' || data.role === 'SUPER_ADMIN') {
            throw new Error("Admins cannot promote users to Admin level.");
        }
    }

    const updateData: any = {
        name: data.name,
        email: data.email,
        discordId: data.discordId,
        role: data.role as Role,
    };

    if (data.password && data.password.length > 0) {
        updateData.password = await hash(data.password, 12);
    }

    await prisma.user.update({
        where: { id },
        data: updateData,
    });

    await logAction("UPDATE", "User", id, { changes: updateData });

    revalidatePath('/admin/users');
}

export async function toggleUserStatus(id: string, isActive: boolean) {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') {
        throw new Error("Unauthorized");
    }

    await prisma.user.update({
        where: { id },
        data: { isActive },
    });

    await logAction(isActive ? "ENABLE" : "DISABLE", "User", id, { isActive });
    revalidatePath('/admin/users');
}
