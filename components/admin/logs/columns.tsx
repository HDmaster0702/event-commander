"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type AuditLogEntry = {
    id: string
    action: string
    entity: string
    entityId: string | null
    details: any
    createdAt: Date
    user: {
        name: string | null
        image: string | null
    } | null
}

export const columns: ColumnDef<AuditLogEntry>[] = [
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent hover:text-white"
                >
                    Time
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return new Date(row.getValue("createdAt")).toLocaleString()
        },
    },
    {
        id: "user",
        accessorFn: (row) => row.user?.name ?? "System",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent hover:text-white"
                >
                    User
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const user = row.original.user
            return user ? (user.name || "Unknown") : "System"
        },
    },
    {
        accessorKey: "action",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent hover:text-white"
                >
                    Action
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const action = row.getValue("action") as string
            let variant: "default" | "destructive" | "outline" | "secondary" = "default"

            if (action === "DELETE") variant = "destructive"
            if (action === "CREATE") variant = "default" // or success color if we had one
            if (action === "UPDATE") variant = "secondary"

            return <Badge variant={variant}>{action}</Badge>
        },
    },
    {
        accessorKey: "entity",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent hover:text-white"
                >
                    Entity
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "details",
        header: "Details",
        cell: ({ row }) => {
            return <div className="max-w-[400px] truncate text-xs text-muted-foreground font-mono">
                {JSON.stringify(row.getValue("details"))}
            </div>
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const log = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(log.details, null, 2))}
                        >
                            Copy Details JSON
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View full details</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
