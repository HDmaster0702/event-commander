"use client"

import { ColumnDef } from "@tanstack/react-table"
import { User } from "@prisma/client"
import { RoleBadge } from "@/components/role-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserStatusToggle } from "@/components/admin/user-status-toggle"
import { UserDialog } from "@/components/admin/add-user-dialog"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

export type UserWithDiscord = User & {
    discordProfile?: {
        displayName?: string | null;
        avatarUrl?: string | null;
    } | null;
}

const roleOrder = {
    "SUPER_ADMIN": 3,
    "ADMIN": 2,
    "ANNOUNCER": 1,
}

export const columns: ColumnDef<UserWithDiscord>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent hover:text-white"
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div className={`font-medium text-neutral-200 ${!row.original.isActive ? "opacity-50 grayscale" : ""}`}>
                {row.getValue("name") || "N/A"}
            </div>
        ),
    },
    {
        accessorKey: "role",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent hover:text-white"
                >
                    Role
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div className={`${!row.original.isActive ? "opacity-50 grayscale" : ""}`}>
                <RoleBadge role={row.getValue("role")} variant="badge" />
            </div>
        ),
        sortingFn: (rowA, rowB, columnId) => {
            const roleA = rowA.getValue(columnId) as string;
            const roleB = rowB.getValue(columnId) as string;
            // @ts-ignore
            return (roleOrder[roleA] || 0) - (roleOrder[roleB] || 0);
        },
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
            <div className={`text-neutral-300 ${!row.original.isActive ? "opacity-50 grayscale" : ""}`}>
                {row.getValue("email")}
            </div>
        ),
    },
    {
        id: "discord",
        header: "Discord User",
        cell: ({ row }) => {
            const user = row.original
            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-neutral-800">
                        <AvatarImage src={user.discordProfile?.avatarUrl || undefined} />
                        <AvatarFallback className="bg-neutral-800 text-neutral-400 text-xs">
                            {(user.discordProfile?.displayName || user.name || "U").charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className={`font-medium text-neutral-200 ${!user.isActive ? "opacity-50 grayscale" : ""}`}>
                            {user.discordProfile?.displayName || user.name || "Unknown"}
                        </span>
                        <span className="text-xs text-neutral-500 font-mono">
                            {user.discordId}
                        </span>
                    </div>
                </div>
            )
        }
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent hover:text-white"
                >
                    Joined
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div className={`text-neutral-300 ${!row.original.isActive ? "opacity-50 grayscale" : ""}`}>
                {new Date(row.getValue("createdAt")).toLocaleDateString()}
            </div>
        ),
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const user = row.original
            return (
                <div className="text-right flex justify-end gap-2">
                    <UserStatusToggle
                        userId={user.id}
                        isActive={user.isActive}
                        userName={user.name || "User"}
                    />
                    <UserDialog user={user} />
                </div>
            )
        },
    },
]
