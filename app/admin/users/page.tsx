import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { UserDialog } from '@/components/admin/add-user-dialog';
import { UserManagement } from '@/components/admin/user-management';

export default async function UsersPage() {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        redirect('/');
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
    });

    const settings = await prisma.settings.findFirst();
    const guildId = settings?.discordGuildId;

    let usersWithDiscord = await Promise.all(users.map(async (user) => {
        let discordProfile = null;
        if (guildId && user.discordId) {
            try {
                const { getDiscordGuildMember } = await import('@/lib/discord');
                const member = await getDiscordGuildMember(guildId, user.discordId);
                if (member) {
                    const avatarHash = member.avatar || member.user?.avatar;
                    const baseUrl = member.avatar
                        ? `https://cdn.discordapp.com/guilds/${guildId}/users/${user.discordId}/avatars/`
                        : `https://cdn.discordapp.com/avatars/${user.discordId}/`;

                    const avatarUrl = avatarHash ? `${baseUrl}${avatarHash}.png` : null;
                    const displayName = member.nick || member.user?.global_name || member.user?.username;

                    discordProfile = {
                        displayName,
                        avatarUrl
                    };
                }
            } catch (e) {
                console.error(`Failed to fetch discord member for ${user.discordId}`, e);
            }
        }
        return { ...user, discordProfile };
    }));

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <UserDialog />
            </div>

            <UserManagement initialUsers={usersWithDiscord} />
        </div>
    );
}
