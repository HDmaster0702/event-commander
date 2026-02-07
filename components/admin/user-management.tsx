"use client"

import { useState } from "react"
import { User } from "@prisma/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { UserDialog } from "@/components/admin/add-user-dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"
import { DataTable } from "./users/data-table"
import { columns, UserWithDiscord } from "./users/columns"

interface UserManagementProps {
    initialUsers: UserWithDiscord[]
}

export function UserManagement({ initialUsers }: UserManagementProps) {
    const [showDisabled, setShowDisabled] = useState(false)

    // Split users into active and disabled
    const activeUsers = initialUsers.filter((u) => u.isActive)
    const disabledUsers = initialUsers.filter((u) => !u.isActive)

    return (
        <div className="space-y-8">
            {/* Active Users Card */}
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-neutral-200">System Users</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="show-disabled"
                            checked={showDisabled}
                            onCheckedChange={setShowDisabled}
                        />
                        <Label htmlFor="show-disabled" className="text-neutral-400">
                            Show Disabled Users
                        </Label>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={activeUsers} />
                </CardContent>
            </Card>

            {/* Disabled Users Card (Conditional) */}
            {showDisabled && (
                <Card className="bg-red-950/10 border-red-900/30">
                    <CardHeader>
                        <CardTitle className="text-red-400 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Disabled Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {disabledUsers.length === 0 ? (
                            <p className="text-neutral-500 text-sm">No disabled users found.</p>
                        ) : (
                            <DataTable columns={columns} data={disabledUsers} />
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
