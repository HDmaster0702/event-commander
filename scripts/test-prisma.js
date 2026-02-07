
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking Prisma Client...");
    if (prisma.eventReaction) {
        console.log("SUCCESS: prisma.eventReaction exists.");
        const count = await prisma.eventReaction.count();
        console.log(`Current reaction count: ${count}`);
    } else {
        console.error("FAILURE: prisma.eventReaction is undefined.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
