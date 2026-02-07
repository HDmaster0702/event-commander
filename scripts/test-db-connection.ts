
import { prisma } from "../lib/prisma";

async function main() {
    console.log("Checking App's Prisma Instance...");

    // Check if eventReaction property exists on the instance
    if ('eventReaction' in prisma) {
        console.log("SUCCESS: prisma.eventReaction exists on the instance.");
        // @ts-ignore
        const count = await prisma.eventReaction.count();
        console.log(`Current reaction count: ${count}`);
    } else {
        console.error("FAILURE: prisma.eventReaction is undefined on the instance.");
        console.log("Available properties:", Object.keys(prisma));
    }
}

main()
    .catch((e) => {
        console.error("Execution failed:", e);
        process.exit(1);
    });
