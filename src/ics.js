const CRLF = '\r\n';
const MAX_LINE_OCTETS = 75;

export function buildCalendar(events, { name = 'Sport' } = {}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//sports-calendar//NONSGML v1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(name)}`,
  ];

  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));
  for (const event of sorted) {
    lines.push(...eventLines(event));
  }

  lines.push('END:VCALENDAR');
  return lines.flatMap(foldLine).join(CRLF) + CRLF;
}

export function formatUtc(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function eventLines(event) {
  const start = new Date(event.start);
  const end = new Date(start.getTime() + event.durationHours * 60 * 60 * 1000);

  const lines = [
    'BEGIN:VEVENT',
    `UID:${event.id}@sports-calendar`,
    `DTSTAMP:${formatUtc(new Date(event.stamp))}`,
    `DTSTART:${formatUtc(start)}`,
    `DTEND:${formatUtc(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];

  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }
  lines.push(`STATUS:${event.cancelled ? 'CANCELLED' : 'CONFIRMED'}`, 'END:VEVENT');
  return lines;
}

function escapeText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function foldLine(line) {
  if (Buffer.byteLength(line) <= MAX_LINE_OCTETS) {
    return [line];
  }

  const parts = [];
  let current = '';
  for (const char of line) {
    const limit = parts.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;
    if (Buffer.byteLength(current + char) > limit) {
      parts.push(current);
      current = '';
    }
    current += char;
  }
  parts.push(current);

  return parts.map((part, index) => (index === 0 ? part : ` ${part}`));
}
