import { Command } from "@/discord/base";
import { ApplicationCommandType, EmbedBuilder } from "discord.js";

new Command({
    name: "welcome",
    dmPermission: false,
    description: "Welcome command",
    type: ApplicationCommandType.ChatInput,
    async run(interaction) {
        const embed = new EmbedBuilder({
            title: "VASCO PORRA",
            description: "EH A PORRA DO VASCUDO GIGANTE DA COLINA CARALHO",
            color: 2,
            footer: {
                text: "Bem vindo ao Vasco"
            }
        });
        await interaction.reply({
            embeds: [embed]
        });
    }
});