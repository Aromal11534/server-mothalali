import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, TextChannel } from 'discord.js';
import { Command } from '../types/commands.js';
import { createShieldEmbed } from '../utils/embeds.js';

export const lockdownCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock down a channel or entire server to prevent sending messages')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
    .addChannelOption((opt) => opt.setName('channel').setDescription('Channel to lock (defaults to current channel)'))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for lockdown')),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetChannel =
      (interaction.options.getChannel('channel') as TextChannel) || (interaction.channel as TextChannel);
    const reason = interaction.options.getString('reason') || 'Emergency lockdown initiated by administrator';

    if (!targetChannel || !('permissionOverwrites' in targetChannel)) {
      await interaction.reply({ content: '❌ Invalid channel for lockdown.', ephemeral: true });
      return;
    }

    try {
      await targetChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false,
        AddReactions: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false,
      }, { reason });

      const embed = createShieldEmbed(
        'Channel Locked Down 🔒',
        `🔒 **#${targetChannel.name} has been placed under lockdown.**\n**Reason:** ${reason}\n\nMembers cannot send messages until unlocked by an administrator.`
      );

      await targetChannel.send({ embeds: [embed] });
      await interaction.reply({ content: `✅ Locked down <#${targetChannel.id}>.`, ephemeral: true });
    } catch (err: any) {
      await interaction.reply({ content: `❌ Failed to lock down channel: ${err.message}`, ephemeral: true });
    }
  },
};
