
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.settings.findFirst();
    console.log('Settings:', settings);
    if (!settings?.discordGuildId) {
        console.error('❌ discordGuildId is MISSING in Settings!');
    } else {
        console.log('✅ discordGuildId is present:', settings.discordGuildId);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
