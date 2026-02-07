import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LogsDataTable } from "@/components/admin/logs/data-table";
import { columns } from "@/components/admin/logs/columns";

export default async function LogsPage() {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        redirect('/');
    }

    // Fetch logs (limit 1000 for now, ordered by newest)
    const logs = await prisma.auditLog.findMany({
        take: 1000,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { name: true, image: true }
            }
        }
    });

    return (
        <div className="p-4 md:p-8 space-y-8">
            <h1 className="text-3xl font-bold text-neutral-100">System Logs</h1>
            <LogsDataTable columns={columns} data={logs} />
        </div>
    );
}
