import { Command } from "@/discord/base";
import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, InteractionCollector} from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } from "@discordjs/voice";
import ytsr from "youtube-sr";
import ytdl from "ytdl-core";

export default new Command({
    name: "play",
    description: "Comando para tocar musica",
    dmPermission,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "song",
            description: "Nome da musica",
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    async run(interaction) {
        const { options } = interaction;
        const song = options.getString("song", true);
        const userTag = interaction.user.displayName;

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    // eslint-disable-next-line camelcase
                    custom_id: "botao-stop",
                    label: "Parar",
                    emoji: "🛑",
                    style: ButtonStyle.Danger,
                })
            ],
        });

        const msg = await interaction.reply({
            components: [row],
            fetchReply: true,
        });

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000,
        });

        collector.on("collect", async (interaction) => {
            const embed = new EmbedBuilder({
                title: "Parando a musica...",
                color: 2,
            });
            const stopedEmbed = new EmbedBuilder({
                title: "💥Musica parada!",
                color: 2,
            });
            if (interaction.customId === "botao-stop") {
                const connection = getVoiceConnection(interaction.guildId);
                if (connection) {
                    connection.disconnect();
                }
                await interaction.update({
                    content: "Desconectado!",
                    embeds: [embed],
                    components: [],
                }).then(async () => {
                    await interaction.editReply({
                        content: "Desconectado!",
                        embeds: [stopedEmbed],
                    });
                });
            }
        });
        
        const results = await ytsr.search(song, { limit: 1, type: "video" });
        if (!results.length) return interaction.editReply("No videos found!");

        const video = results[0];
        const url = video.url;
        const title = video.title;
        const thumbnail = video.thumbnail?.url ?? "Default thumbnail URL";
        const canal = video.channel?.name ?? "Default channel name";
        const time = video.durationFormatted ?? "Default duration";

        const embed = new EmbedBuilder({
            title: `${userTag} PEDIU PRA TOCAR A BRABA \n ${title}`,
            description: `Canal: ${canal}`,
            color: 2,
            thumbnail: {
                url: thumbnail,
            },
            footer: {
                text: `Duração: ${time}`,
            },
            
        });

        const channel = interaction.member?.voice?.channel;
        if (!channel) return interaction.editReply("Cê tem que ta em um canal de voz pra eu tocar musica ai nego \n VASCO!");

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();

        const stream = ytdl(url, { filter: "audioonly" });
        const resource = createAudioResource(stream);

        player.play(resource);
        await interaction.editReply({
            embeds: [embed],
            components: [row],
        });

        connection.subscribe(player);

        await new Promise(resolve => {
            player.on(AudioPlayerStatus.Idle, resolve);
            player.on("error", resolve);
        });

        connection.destroy();

    },
    
});