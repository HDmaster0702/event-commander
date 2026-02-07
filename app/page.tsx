import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarCheck, Activity, Clock } from "lucide-react";
import { UpcomingEvents } from "@/components/admin/dashboard/upcoming-events";
import { DashboardCalendar } from "@/components/admin/dashboard/dashboard-calendar";
import { StatsCards, DashboardStats } from "@/components/admin/dashboard/stats-cards";
import { EventStatus, Role } from "@prisma/client";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Mission Control | Reforger Bot",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userRole = (session.user as any).role as Role;
  const userId = session.user.id;
  const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;

  // 1. Fetch Events for Calendar (Global - everyone needs to see schedule)
  const allEvents = await prisma.event.findMany({
    where: {
      status: { in: [EventStatus.SCHEDULED, EventStatus.ANNOUNCED] }
    },
    select: {
      id: true,
      startTime: true,
      status: true,
      // We only need these for the calendar dots
    }
  });

  // 2. Fetch Upcoming Events List
  const upcomingEvents = await prisma.event.findMany({
    where: {
      status: { in: [EventStatus.SCHEDULED, EventStatus.ANNOUNCED] },
      startTime: { gte: new Date() } // Future only
    },
    orderBy: { startTime: 'asc' },
    take: 5,
    include: {
      createdBy: {
        select: { name: true, image: true, discordId: true }
      }
    }
  });

  // 3. Stats Calculation
  const totalEventsCount = await prisma.event.count({
    where: { NOT: { status: EventStatus.DRAFT } }
  });

  // Avg Attendance Calculation
  const reactionStats = await prisma.eventReaction.aggregate({
    _count: { _all: true },
  });

  const eventsWithReactions = await prisma.eventReaction.groupBy({
    by: ['eventId'],
  });

  const avgAttendance = eventsWithReactions.length > 0
    ? reactionStats._count._all / eventsWithReactions.length
    : 0;

  // Admin Specific Stats
  let totalUsers = 0;
  let activeUsers = 0;
  let myEventsCount = 0;

  if (isAdmin) {
    totalUsers = await prisma.user.count();
    activeUsers = await prisma.user.count({ where: { isActive: true } });
  } else {
    myEventsCount = await prisma.event.count({
      where: { createdById: userId }
    });
  }

  const dashboardStats: DashboardStats = {
    totalEvents: totalEventsCount,
    upcomingEventsCount: upcomingEvents.length,
    avgAttendance,
    totalUsers: isAdmin ? totalUsers : undefined,
    activeUsers: isAdmin ? activeUsers : undefined,
    myEventsCount: !isAdmin ? myEventsCount : undefined,
  };

  // 4. Recent Activity (Admin Only)
  const recentLogs = isAdmin ? await prisma.auditLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, image: true } }
    }
  }) : [];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-100">Mission Control</h1>
        <div className="text-sm text-neutral-400 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Top Row: Upcoming & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 h-full">
          {/* @ts-ignore: Event type compatibility with partial selects */}
          <UpcomingEvents events={upcomingEvents} />
        </div>
        <div className="lg:col-span-2 h-full">
          {/* @ts-ignore: Event type compatibility with partial selects */}
          <DashboardCalendar events={allEvents as any} />
        </div>
      </div>

      {/* Middle Row: Stats */}
      <StatsCards stats={dashboardStats} isAdmin={isAdmin} />

      {/* Bottom Row: Detailed Stats / Activity */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-neutral-900/50 border-neutral-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-neutral-200">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between text-sm border-b border-neutral-800 pb-2 last:border-0 last:pb-0 hover:bg-neutral-900/50 transition-colors p-2 rounded-md -mx-2">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-300">
                          {log.action} <span className="text-neutral-400">{log.entity}</span>
                        </span>
                        <span className="text-xs text-neutral-400">
                          by {log.user?.name || "System"}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {recentLogs.length === 0 && <p className="text-neutral-400 text-sm">No recent activity.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800 flex items-center justify-center">
            <CardContent className="text-neutral-500 text-sm p-8">
              Detailed Analytics (Coming Soon)
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
