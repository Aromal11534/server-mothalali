import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, EmbedBuilder } from 'discord.js';
import { Command } from '../types/commands.js';
import { db } from '../storage/database.js';
import { antivirusService } from '../services/antivirus.service.js';
import { COLORS } from '../utils/embeds.js';

export const scanCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('scan')
    .setDescription('Deep security scanner for URLs, members, and channels')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName('url')
        .setDescription('Scan a URL for phishing, homoglyphs, or IP loggers')
        .addStringOption((opt) => opt.setName('target_url').setDescription('The URL to inspect').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('member')
        .setDescription('Scan a guild member for security risks and infraction history')
        .addUserOption((opt) => opt.setName('target_user').setDescription('The user to evaluate').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('channel')
        .setDescription('Scan recent messages in current channel for threats')
        .addIntegerOption((opt) =>
          opt.setName('limit').setDescription('Number of recent messages to scan (max 50)').setMinValue(5).setMaxValue(50)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const sub = interaction.options.getSubcommand();
    const settings = db.getGuildSettings(interaction.guild.id);

    // 1. URL SCAN
    if (sub === 'url') {
      const urlStr = interaction.options.getString('target_url', true);
      await interaction.deferReply({ ephemeral: true });

      const scanResult = antivirusService.scanUrls(urlStr, settings);

      if (!scanResult.isSafe) {
        const embed = new EmbedBuilder()
          .setTitle('🚨 URL Scan: Threat Detected!')
          .setColor(COLORS.DANGER)
          .addFields(
            { name: 'URL Tested', value: `\`${urlStr.substring(0, 250)}\`` },
            { name: 'Threat Type', value: `\`${scanResult.threatType}\``, inline: true },
            { name: 'Severity', value: `\`${scanResult.severity}\``, inline: true },
            { name: 'Analysis', value: scanResult.reason || 'Flagged by security filter' }
          )
          .setFooter({ text: 'Mothalali Antivirus Engine' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setTitle('✅ URL Scan: Clean')
          .setColor(COLORS.SUCCESS)
          .setDescription(`No phishing signatures, IP logger domains, or known exploits found in \`${urlStr.substring(0, 250)}\`.`)
          .setFooter({ text: 'Mothalali Antivirus Engine' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
      return;
    }

    // 2. MEMBER SCAN
    if (sub === 'member') {
      const user = interaction.options.getUser('target_user', true);
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);

      const infractions = db.getUserInfractions(interaction.guild.id, user.id);
      const accountAgeDays = ((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)).toFixed(1);
      const joinedServerDays = member
        ? ((Date.now() - (member.joinedAt?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)).toFixed(1)
        : 'N/A';

      let riskLevel = 'LOW';
      let riskColor = COLORS.SUCCESS;

      if (infractions.length >= 3 || Number(accountAgeDays) < 1) {
        riskLevel = 'HIGH';
        riskColor = COLORS.DANGER;
      } else if (infractions.length > 0 || Number(accountAgeDays) < 7) {
        riskLevel = 'MEDIUM';
        riskColor = COLORS.WARNING;
      }

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Member Security Profile: ${user.tag}`)
        .setColor(riskColor)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: 'User ID', value: `\`${user.id}\``, inline: true },
          { name: 'Risk Rating', value: `\`${riskLevel}\``, inline: true },
          { name: 'Active Strikes', value: `\`${infractions.length}\``, inline: true },
          { name: 'Account Created', value: `<t:${Math.floor(user.createdAt.getTime() / 1000)}:R> (${accountAgeDays}d)`, inline: true },
          { name: 'Joined Server', value: member?.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R> (${joinedServerDays}d)` : 'Not in server', inline: true },
          { name: 'Permissions', value: member?.permissions.has(PermissionsBitField.Flags.Administrator) ? '👑 Administrator' : 'Standard Member', inline: true }
        )
        .setFooter({ text: 'Server Mothalali Security Audit' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    // 3. CHANNEL SCAN
    if (sub === 'channel') {
      const limit = interaction.options.getInteger('limit') || 20;
      await interaction.deferReply({ ephemeral: true });

      const channel = interaction.channel;
      if (!channel || !channel.isTextBased()) {
        await interaction.editReply({ content: 'Cannot scan this channel type.' });
        return;
      }

      const messages = await channel.messages.fetch({ limit });
      let threatsFound = 0;
      const flaggedReport: string[] = [];

      for (const [, msg] of messages) {
        if (msg.author.bot) continue;
        const res = antivirusService.scanMessage(msg, settings);
        if (!res.isSafe) {
          threatsFound++;
          flaggedReport.push(`• **${msg.author.tag}**: ${res.reason} (\`${msg.id}\`)`);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Channel Scan Complete: #${('name' in channel ? channel.name : 'channel')}`)
        .setColor(threatsFound > 0 ? COLORS.WARNING : COLORS.SUCCESS)
        .addFields(
          { name: 'Messages Scanned', value: `\`${messages.size}\``, inline: true },
          { name: 'Threats Detected', value: `\`${threatsFound}\``, inline: true }
        )
        .setFooter({ text: 'Mothalali Channel Sweep' })
        .setTimestamp();

      if (flaggedReport.length > 0) {
        embed.setDescription(`**Flagged Items:**\n${flaggedReport.slice(0, 10).join('\n')}`);
      } else {
        embed.setDescription('✅ All scanned messages appear clean of malware, phishing, and token grabbers.');
      }

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
