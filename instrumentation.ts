export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { initScheduler } = await import('@/lib/scheduler');
        const { syncTelemetry } = await import('@/lib/telemetry-scheduler');
        // Start the Discord bot
        await import('./bot/index');

        initScheduler();

        // Run telemetry sync every 10 minutes
        setInterval(() => {
            syncTelemetry().catch(console.error);
        }, 10 * 60 * 1000);

        // Also run once on startup
        syncTelemetry().catch(console.error);
    }
}
