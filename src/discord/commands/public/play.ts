import { Command } from "@/discord/base";
import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from "@discordjs/voice";
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
        await interaction.deferReply({ ephemeral: false });
        const song = options.getString("song", true);

        // Search YouTube for the song
        const results = await ytsr.search(song, { limit: 1, type: "video" });
        if (!results.length) return interaction.editReply("No videos found!");

        // Get the first video URL
        const video = results[0];
        const url = video.url;
        const title = video.title;
        const thumbnail = video.thumbnail?.url ?? "Default thumbnail URL";
        const canal = video.channel?.name ?? "Default channel name";

        const embed = new EmbedBuilder({
            title: `PEDIRO PRA TOCAR A BRABA: ${title}`,
            description: `Canal: ${canal}`,
            color: 2,
            thumbnail: {
                url: thumbnail,
            }
        });

        // Get the voice channel the user is in
        const channel = interaction.member?.voice?.channel;
        if (!channel) return interaction.editReply("Cê tem que ta em um canal de voz pra eu tocar musica ai nego \n VASCO!");

        // Join the voice channel
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        // Create an audio player
        const player = createAudioPlayer();

        // Create an audio resource from the YouTube video URL
        const stream = ytdl(url, { filter: "audioonly" });
        const resource = createAudioResource(stream);

        // Play the audio resource
        player.play(resource);
        await interaction.editReply({
            embeds: [embed],
        });

        // Subscribe the connection to the player
        connection.subscribe(player);

        // Wait for the player to be 'idle' before exiting
        await new Promise(resolve => {
            player.on(AudioPlayerStatus.Idle, resolve);
            player.on("error", resolve);
        });

        // Disconnect from the voice channel
        connection.destroy();

    }
});