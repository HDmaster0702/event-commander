
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({ select: { email: true, name: true, image: true } });
    console.log('Users:', JSON.stringify(users, null, 2));

    const events = await prisma.event.findMany({ select: { name: true, status: true, createdBy: { select: { image: true } } } });
    console.log('Events:', JSON.stringify(events, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
