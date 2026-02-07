
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to DB...');
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
    users.forEach(u => {
        console.log(`User: ${u.email}, Role: ${u.role}, isActive: ${u.isActive}, ID: ${u.id}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
