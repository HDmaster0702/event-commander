
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getBotGuilds } from "@/lib/discord";

export default async function SettingsPage() {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'SUPER_ADMIN') {
        redirect('/');
    }

    const settings = await prisma.settings.findFirst();
    const guilds = await getBotGuilds();

    return (
        <div className="p-4 md:p-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            <SettingsForm initialSettings={settings} initialGuilds={guilds} />
        </div>
    );
}
