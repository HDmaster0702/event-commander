import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import 'dotenv/config';

const commands = [
    new SlashCommandBuilder()
        .setName('notifications')
        .setDescription('Configure your notification preferences'),
]
    .map(command => command.toJSON());

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_APPLICATION_ID; // Need to ensure this is available
// For guild-based testing (faster updates)
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
    console.error("Missing DISCORD_TOKEN or DISCORD_APPLICATION_ID.");
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        if (guildId) {
            // Guild-based registration (instant)
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands },
            );
            console.log(`Successfully reloaded application (/) commands for guild ${guildId}.`);
        } else {
            // Global registration (can take 1 hour)
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands },
            );
            console.log('Successfully reloaded application (/) commands globally.');
        }

    } catch (error) {
        console.error(error);
    }
})();
