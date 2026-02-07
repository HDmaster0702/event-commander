
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Checking Prism Client for Invitation model...');
    if (prisma.invitation) {
        console.log('SUCCESS: prisma.invitation is defined.');
        // Try a simple count (should be 0 or more)
        const count = await prisma.invitation.count();
        console.log(`Current invitation count: ${count}`);
    } else {
        console.error('FAILURE: prisma.invitation is undefined.');
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
