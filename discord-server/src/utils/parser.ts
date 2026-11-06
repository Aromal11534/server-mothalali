/**
 * Parse human readable duration string (e.g., "10m", "1h", "2d") into milliseconds.
 */
export function parseDurationToMs(durationStr: string): number | null {
  const match = durationStr.trim().toLowerCase().match(/^(\d+)\s*([smhdw])$/);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (isNaN(value) || value <= 0) return null;

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'w':
      return value * 7 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

/**
 * Format milliseconds into human readable format.
 */
export function formatMsToHuman(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
