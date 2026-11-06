import { Interaction, PermissionsBitField, ButtonInteraction } from 'discord.js';
import { commandCollection } from '../commands/index.js';
import { db } from '../storage/database.js';
import { loggerService } from '../services/logger.service.js';

export async function handleInteractionCreate(interaction: Interaction): Promise<void> {
  // 1. Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    const command = commandCollection.get(interaction.commandName);
    if (!command) {
      await interaction.reply({ content: '❌ Unknown command.', ephemeral: true });
      return;
    }

    // Check Admin permission requirement
    if (command.requireAdmin && interaction.memberPermissions) {
      if (!interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
        await interaction.reply({
          content: '⛔ You need **Administrator** permission to execute this command.',
          ephemeral: true,
        });
        return;
      }
    }

    try {
      await command.execute(interaction);
    } catch (err: any) {
      console.error(`[Command Error] /${interaction.commandName}:`, err);
      const replyFn = interaction.replied || interaction.deferred ? interaction.followUp : interaction.reply;
      await replyFn.call(interaction, {
        content: `❌ An unexpected error occurred while executing this command: ${err.message}`,
        ephemeral: true,
      });
    }
    return;
  }

  // 2. Handle Interactive Buttons (e.g. from Threat Mod Logs)
  if (interaction.isButton()) {
    await handleButtonInteraction(interaction);
  }
}

async function handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild || !interaction.memberPermissions?.has(PermissionsBitField.Flags.ModerateMembers)) {
    await interaction.reply({
      content: '⛔ You need moderation permissions to use this button.',
      ephemeral: true,
    });
    return;
  }

  const customId = interaction.customId;

  // Pattern: mothalali:pardon:<userId>
  if (customId.startsWith('mothalali:pardon:')) {
    const targetUserId = customId.split(':')[2];
    const cleared = db.clearUserInfractions(interaction.guild.id, targetUserId);

    await interaction.reply({
      content: `✅ Successfully pardoned <@${targetUserId}> and cleared ${cleared} infraction(s).`,
      ephemeral: true,
    });
    return;
  }

  // Pattern: mothalali:ban:<userId>
  if (customId.startsWith('mothalali:ban:')) {
    const targetUserId = customId.split(':')[2];
    if (!interaction.memberPermissions.has(PermissionsBitField.Flags.BanMembers)) {
      await interaction.reply({ content: '⛔ You need Ban Members permission.', ephemeral: true });
      return;
    }

    try {
      await interaction.guild.bans.create(targetUserId, {
        deleteMessageSeconds: 86400,
        reason: `Quick-Ban executed by ${interaction.user.tag} via ModLog embed`,
      });

      await interaction.reply({
        content: `🔨 Banned <@${targetUserId}> and purged last 24h messages.`,
      });
    } catch (err: any) {
      await interaction.reply({ content: `❌ Failed to ban: ${err.message}`, ephemeral: true });
    }
  }
}
