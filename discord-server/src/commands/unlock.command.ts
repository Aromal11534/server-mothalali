import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, TextChannel } from 'discord.js';
import { Command } from '../types/commands.js';
import { createShieldEmbed } from '../utils/embeds.js';

export const unlockCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a previously locked channel to restore normal messaging')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
    .addChannelOption((opt) => opt.setName('channel').setDescription('Channel to unlock (defaults to current channel)')),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetChannel =
      (interaction.options.getChannel('channel') as TextChannel) || (interaction.channel as TextChannel);

    if (!targetChannel || !('permissionOverwrites' in targetChannel)) {
      await interaction.reply({ content: '❌ Invalid channel for unlock.', ephemeral: true });
      return;
    }

    try {
      await targetChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: null,
        AddReactions: null,
        CreatePublicThreads: null,
        CreatePrivateThreads: null,
      }, { reason: `Unlocked by ${interaction.user.tag}` });

      const embed = createShieldEmbed(
        'Channel Unlocked 🔓',
        `🔓 **#${targetChannel.name} has been unlocked.**\nNormal messaging permissions have been restored.`
      );

      await targetChannel.send({ embeds: [embed] });
      await interaction.reply({ content: `✅ Unlocked <#${targetChannel.id}>.`, ephemeral: true });
    } catch (err: any) {
      await interaction.reply({ content: `❌ Failed to unlock channel: ${err.message}`, ephemeral: true });
    }
  },
};
