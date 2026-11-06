import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { Command } from '../types/commands.js';
import { db } from '../storage/database.js';
import { createShieldEmbed } from '../utils/embeds.js';

export const antiRaidCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Configure Anti-Raid velocity defense and account age gate')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addSubcommand((sub) => sub.setName('status').setDescription('View current Anti-Raid configuration'))
    .addSubcommand((sub) =>
      sub
        .setName('toggle')
        .setDescription('Enable or disable Anti-Raid defense')
        .addBooleanOption((opt) => opt.setName('enabled').setDescription('Enable/Disable').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('threshold')
        .setDescription('Set join velocity threshold')
        .addIntegerOption((opt) =>
          opt.setName('joins').setDescription('Max joins allowed in time window').setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt.setName('seconds').setDescription('Time window in seconds').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('min_age')
        .setDescription('Set minimum account age in hours required to join')
        .addIntegerOption((opt) =>
          opt.setName('hours').setDescription('Minimum account age (0 to disable)').setRequired(true)
        )
    ),
  requireAdmin: true,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const sub = interaction.options.getSubcommand();
    const settings = db.getGuildSettings(interaction.guild.id);

    if (sub === 'status') {
      const desc = [
        `**🛡️ Anti-Raid Protection:**`,
        `• **Status:** ${settings.antiRaidEnabled ? '🟢 Enabled' : '🔴 Disabled'}`,
        `• **Velocity Threshold:** \`${settings.joinVelocityThreshold} joins\` within \`${settings.joinVelocitySeconds}s\``,
        `• **Min Account Age:** \`${settings.minAccountAgeHours} hours\` (younger accounts flagged/quarantined)`,
        `• **Raid Action:** \`${settings.raidAction.toUpperCase()}\``,
      ].join('\n');

      const embed = createShieldEmbed('Anti-Raid Status', desc);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (sub === 'toggle') {
      const enabled = interaction.options.getBoolean('enabled', true);
      db.updateGuildSettings(interaction.guild.id, { antiRaidEnabled: enabled });
      const embed = createShieldEmbed(
        'Anti-Raid Updated',
        `Anti-Raid defense is now **${enabled ? '🟢 Enabled' : '🔴 Disabled'}**.`
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (sub === 'threshold') {
      const joins = interaction.options.getInteger('joins', true);
      const seconds = interaction.options.getInteger('seconds', true);

      db.updateGuildSettings(interaction.guild.id, {
        joinVelocityThreshold: joins,
        joinVelocitySeconds: seconds,
      });

      const embed = createShieldEmbed(
        'Anti-Raid Threshold Updated',
        `Raid trigger set to: **${joins} joins** within **${seconds} seconds**.`
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (sub === 'min_age') {
      const hours = interaction.options.getInteger('hours', true);
      db.updateGuildSettings(interaction.guild.id, { minAccountAgeHours: hours });
      const embed = createShieldEmbed(
        'Account Age Gate Updated',
        `Minimum account age set to **${hours} hours** (${(hours / 24).toFixed(1)} days).`
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
