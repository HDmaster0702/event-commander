'use client';

import { DashboardData } from "@/lib/dashboard-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function DashboardCharts({ data }: { data: DashboardData }) {
    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 col-span-1">
                    <CardHeader>
                        <CardTitle>Attendance by Day of Week</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.byDayOfWeek}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="name" stroke="#888" />
                                <YAxis stroke="#888" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #333' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 col-span-1">
                    <CardHeader>
                        <CardTitle>Attendance by Hour (UTC)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.byTimeOfDay}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="hour" stroke="#888" />
                                <YAxis stroke="#888" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #333' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 col-span-1">
                    <CardHeader>
                        <CardTitle>Reaction Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.reactionDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.reactionDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #333' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 col-span-2">
                    <CardHeader>
                        <CardTitle>Top Participants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.topUsers.length === 0 ? (
                                <p className="text-neutral-400 text-sm">No data yet.</p>
                            ) : (
                                data.topUsers.map((user, i) => (
                                    <div key={user.name + i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="text-sm text-neutral-500 w-4 font-mono">{i + 1}</div>
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={`https://cdn.discordapp.com/avatars/${user.avatar /* Note: DB stores hash, need to construct URL properly if we had ID */}`} />
                                                <AvatarFallback className="bg-neutral-800 text-xs">
                                                    {user.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="text-sm font-medium">{user.name}</div>
                                        </div>
                                        <div className="text-sm text-neutral-400 font-mono">
                                            {user.count} events
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
