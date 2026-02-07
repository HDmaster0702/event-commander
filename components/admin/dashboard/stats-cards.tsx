"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CalendarCheck, Activity } from "lucide-react"

export interface DashboardStats {
    totalEvents: number;
    upcomingEventsCount: number;
    avgAttendance: number;
    totalUsers?: number;
    activeUsers?: number;
    myEventsCount?: number;
}

interface StatsCardsProps {
    stats: DashboardStats;
    isAdmin: boolean;
}

export function StatsCards({ stats, isAdmin }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 hover:bg-neutral-800/60 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-neutral-200">Mission Status</CardTitle>
                    <CalendarCheck className="h-4 w-4 text-neutral-400" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold">{stats.upcomingEventsCount}</div>
                        <span className="text-xs text-neutral-400">Upcoming</span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                        {stats.totalEvents} Total Missions Logged
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 hover:bg-neutral-800/60 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-neutral-200">
                        {isAdmin ? "Personnel" : "My Missions"}
                    </CardTitle>
                    <Users className="h-4 w-4 text-neutral-400" />
                </CardHeader>
                <CardContent>
                    {isAdmin ? (
                        <>
                            <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                                <span className="text-xs text-neutral-400">Total</span>
                            </div>
                            <p className="text-xs text-neutral-400 mt-1">
                                {stats.activeUsers} Active Personnel
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="text-2xl font-bold">{stats.myEventsCount}</div>
                            <p className="text-xs text-neutral-400">Missions Created by You</p>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 hover:bg-neutral-800/60 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-neutral-200">Avg. Attendance</CardTitle>
                    <Activity className="h-4 w-4 text-neutral-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.avgAttendance.toFixed(1)}</div>
                    <p className="text-xs text-neutral-400">Reactions per Mission</p>
                </CardContent>
            </Card>
        </div>
    )
}
