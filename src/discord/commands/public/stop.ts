import { Command } from "@/discord/base";
import { ApplicationCommandType } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";

export default new Command({
    name: "stop",
    dmPermission,
    type: ApplicationCommandType.Message,
    async run(interaction) {
        const connection = getVoiceConnection(interaction.guildId);

        if (connection) {
            connection.disconnect();
        }

        await interaction.reply("Desconectado!");
    }
});