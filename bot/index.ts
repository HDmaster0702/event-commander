import { Client, GatewayIntentBits, Events } from 'discord.js';
import { prisma } from '../lib/prisma'; // Relative import to shared prisma lib
import 'dotenv/config';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';

client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
    if (message.content === '!ping') {
        await message.reply('Pong!');
    }
});

// Example interaction with DB

// ... (existing code)

// Helper to build UI
function getNotificationPayload(settings: any, lastAction?: string) {
    const lang = settings.language === 'hu' ? 'hu' : 'en';

    // Improved labels
    const t = {
        en: {
            title: '🔔 Notification Preferences',
            desc: 'Customize your notification experience. Toggle the buttons below to enable or disable specific alerts.',

            // Labels
            pre3d: '3-Day Reminder',
            pre24h: '24-Hour Reminder',
            pre1h: '1-Hour Reminder',
            updates: 'Event Updates (Changes/Cancellations)',
            attend: 'Attendance Check (Day Before)',
            lang: 'Language / Nyelv',

            // States
            on: 'ENABLED',
            off: 'DISABLED',

            // Feedback
            updated: 'Updated',
            to: 'to'
        },
        hu: {
            title: '🔔 Értesítési Beállítások',
            desc: 'Szabd személyre az értesítéseket. Kapcsold be/ki a gombokkal a kívánt figyelmeztetéseket.',

            pre3d: '3 Napos Emlékeztető',
            pre24h: '24 Órás Emlékeztető',
            pre1h: '1 Órás Emlékeztető',
            updates: 'Változások (Szerkesztés/Törlés)',
            attend: 'Jelenlét Ellenőrzés (Előző Nap)',
            lang: 'Nyelv / Language',

            on: 'BEKAPCSOLVA',
            off: 'KIKAPCSOLVA',

            updated: 'Frissítve',
            to: '-'
        }
    }[lang];

    const createBtn = (id: string, label: string, state: boolean) => new ButtonBuilder()
        .setCustomId(`notif:${id}:${!state}`) // Toggle action
        .setLabel(state ? `✅ ${label}` : `❌ ${label}`) // Visual indicator in label too
        .setStyle(state ? ButtonStyle.Success : ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            createBtn('preEvent3Days', t!.pre3d, settings.preEvent3Days),
            createBtn('preEvent24Hours', t!.pre24h, settings.preEvent24Hours),
        );

    const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            createBtn('preEvent1Hour', t!.pre1h, settings.preEvent1Hour),
            createBtn('attendanceReminder', t!.attend, settings.attendanceReminder),
        );

    const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            createBtn('eventUpdates', t!.updates, settings.eventUpdates)
        );

    const langSelect = new StringSelectMenuBuilder()
        .setCustomId('notif:language')
        .setPlaceholder(t!.lang)
        .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('English').setValue('en').setDefault(settings.language === 'en'),
            new StringSelectMenuOptionBuilder().setLabel('Magyar').setValue('hu').setDefault(settings.language === 'hu'),
        );

    const row4 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(langSelect);

    return {
        content: `**${t!.title}**\n${t!.desc}${lastAction ? `\n\n✨ ${lastAction}` : ''}`,
        components: [row1, row2, row3, row4],
        ephemeral: true
    };
}

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'notifications') {
                const discordId = interaction.user.id;

                // Fetch settings directly by discordUserId
                let settings = await prisma.notificationSettings.findUnique({
                    where: { discordUserId: discordId }
                });

                // If not found, use default "virtual" settings or create defaults?
                // User asked to "adhere to them, otherwise we default to all notifications enabled".
                // But for the UI, we should probably show the defaults (Enabled).
                // If they interact, we create the record.
                if (!settings) {
                    // Start with defaults in memory for display
                    // OR we can just create it now to be simple. 
                    // Let's create it on read for the interaction command so they have a persistent state to toggle.
                    settings = await prisma.notificationSettings.create({
                        data: { discordUserId: discordId }
                    });
                }

                await interaction.reply(getNotificationPayload(settings));
            }
        }

        else if (interaction.isButton()) {
            // Handle "Open Settings" button from Guide
            if (interaction.customId === 'open_notification_settings') {
                const discordId = interaction.user.id;

                let settings = await prisma.notificationSettings.findUnique({
                    where: { discordUserId: discordId }
                });

                if (!settings) {
                    settings = await prisma.notificationSettings.create({
                        data: { discordUserId: discordId }
                    });
                }

                await interaction.reply(getNotificationPayload(settings));
                return;
            }

            if (!interaction.customId.startsWith('notif:')) return;

            const [_, field, value] = interaction.customId.split(':');
            const discordId = interaction.user.id;
            const boolValue = value === 'true';

            // Find valid setting record or create
            let settings = await prisma.notificationSettings.findUnique({ where: { discordUserId: discordId } });

            if (!settings) {
                settings = await prisma.notificationSettings.create({
                    data: {
                        discordUserId: discordId,
                        [field]: boolValue
                    }
                });
            } else {
                settings = await prisma.notificationSettings.update({
                    where: { id: settings.id },
                    data: { [field]: boolValue }
                });
            }

            // Derive label for feedback
            const lang = settings.language === 'hu' ? 'hu' : 'en';
            // Quick map for labels (duplicated but simple enough)
            const labelMap: any = {
                preEvent3Days: lang === 'en' ? '3-Day Reminder' : '3 Napos Emlékeztető',
                preEvent24Hours: lang === 'en' ? '24-Hour Reminder' : '24 Órás Emlékeztető',
                preEvent1Hour: lang === 'en' ? '1-Hour Reminder' : '1 Órás Emlékeztető',
                eventUpdates: lang === 'en' ? 'Event Updates' : 'Esemény Változások',
                attendanceReminder: lang === 'en' ? 'Attendance Check' : 'Jelenlét Ellenőrzés',
            };
            const stateText = boolValue ? (lang === 'en' ? 'ENABLED' : 'BEKAPCSOLVA') : (lang === 'en' ? 'DISABLED' : 'KIKAPCSOLVA');
            const actionFeedback = `${labelMap[field]} -> **${stateText}**`;

            await interaction.update(getNotificationPayload(settings, actionFeedback));
        }

        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'notif:language') {
                const lang = interaction.values[0];
                const discordId = interaction.user.id;

                let settings = await prisma.notificationSettings.findUnique({ where: { discordUserId: discordId } });

                if (!settings) {
                    settings = await prisma.notificationSettings.create({
                        data: { discordUserId: discordId, language: lang }
                    });
                } else {
                    settings = await prisma.notificationSettings.update({
                        where: { id: settings.id },
                        data: { language: lang }
                    });
                }

                const feedback = lang === 'hu' ? 'Nyelv kiválasztva: Magyar' : 'Language selected: English';
                await interaction.update(getNotificationPayload(settings, feedback));
            }
        }

    } catch (e) {
        console.error("Interaction error:", e);
        if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ An error occurred while processing this command.', ephemeral: true });
        }
    }
});

const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error("DISCORD_TOKEN is not defined in environment variables.");
    process.exit(1);
}

client.login(token);
