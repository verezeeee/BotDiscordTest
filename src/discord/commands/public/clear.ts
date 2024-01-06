import { Command } from "@/discord/base";
import { brBuilder } from "@magicyan/discord";
import { ApplicationCommandOptionType, ApplicationCommandType, codeBlock } from "discord.js";

const modRoleId = "";

export default new Command({
    name: "clear",
    description: "Apaga mensagens do chat",
    dmPermission,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "quantidade",
            description: "Quantidade de mensagens a serem apagadas",
            type: ApplicationCommandOptionType.Integer
        },
        {
            name: "autor",
            description: "Autor das mensagens a serem apagadas",
            type: ApplicationCommandOptionType.String
        },
        {
            name: "mensagem",
            description: "Deleta mensagens com a mensagem especificada",
            type: ApplicationCommandOptionType.String,
            autocomplete: true
        }
    ],
    async autoComplete(interaction) {
        const { options, channel } = interaction;
        const focused = options.getFocused(true);

        switch (focused.name) {
            case "mensagem": {
                if (!channel?.isTextBased()) {
                    return;
                }
                const messages = await channel.messages.fetch();
                const choices = Array.from(messages)
                .map(([id, { content, author, createdAt}]) => {
                    const time = createdAt.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });
                    const [hour, minute] = time.split(":");
                    const text = `${hour}:${minute} - ${author.username}: ${content}`;
                    const name = text.length > 90 ? text.slice(0, 90) + "..." : text;
                    return { name, value: id };
                });

                const filtered = choices.filter(c => c.name.toLowerCase().includes(focused.value.toLowerCase()));
                interaction.respond(filtered.slice(0, 25));
                return;
            }
        }
    },
    async run(interaction) {
        const { options, member, channel } = interaction;

        await interaction.deferReply({ ephemeral: true });


        //checagem de permissão baseada em id de cargo
        // if (!member.roles.cache.has(modRoleId)) {
        //     interaction.editReply({
        //         content: `Apenas membros com o cargo ${modRoleId} podem usar esse comando!`,
        //     });
        //     return;
        // }

        if (!channel?.isTextBased()) {
            interaction.editReply({
                content: "Esse comando só pode ser usado em canais de texto!",
            });
            return;
        }

        const amount = options.getInteger("quantidade") || 1;
        const mention = options.getString("autor");
        const messageId = options.getString("mensagem");

        if (messageId) {
            channel.messages.delete(messageId)
                .then(() => {
                    interaction.editReply({
                        content: `Mensagem ${messageId} deletada com sucesso!`,
                    });
                })
                .catch((err) => {
                    interaction.editReply({
                        content: brBuilder("Não foi possível deletar a mensagem!", codeBlock("ts", err))
                    });
                });
            return;
        }

        if (mention) {
            const messages = await channel.messages.fetch();
            const filtered = messages.filter((m) => m.author.id === mention);
            channel.bulkDelete(filtered.first(Math.min(amount, 100)))
                .then(cleared => interaction.editReply({
                    content: cleared.size ? `Mensagens de ${mention} deletadas com sucesso!` : `Nenhuma mensagem de ${mention} foi encontrada!`,
                }))
                .catch((err) => {
                    interaction.editReply({
                        content: brBuilder("Não foi possível deletar as mensagens!", codeBlock("ts", err))
                    });
                });
            return;
        }

        channel.bulkDelete(Math.min(amount, 100))
            .then(cleared => interaction.editReply({
                content: cleared.size ? "Mensagens deletadas com sucesso!" : "Não há mensagens para serem deletadas!",
            }))
            .catch((err) => {
                interaction.editReply({
                    content: brBuilder("Não foi possível deletar as mensagens!", codeBlock("ts", err))
                });
            });

    }
});