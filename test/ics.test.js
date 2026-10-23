import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCalendar, formatUtc } from '../src/ics.js';

const stamp = '2026-10-01T10:00:00.000Z';

test('formatUtc gir ICS-format i UTC', () => {
  assert.equal(formatUtc(new Date('2026-10-24T16:00:00.000Z')), '20261024T160000Z');
});

test('bygger en gyldig kalender med CRLF og start/slutt', () => {
  const ics = buildCalendar([
    { id: 'fd-1', start: '2026-10-24T16:00:00.000Z', stamp, title: 'PL: A – B', durationHours: 2, cancelled: false },
  ]);

  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.match(ics, /UID:fd-1@sports-calendar\r\n/);
  assert.match(ics, /DTSTART:20261024T160000Z\r\n/);
  assert.match(ics, /DTEND:20261024T180000Z\r\n/);
  assert.match(ics, /STATUS:CONFIRMED\r\n/);
});

test('avlyst hendelse får STATUS:CANCELLED', () => {
  const ics = buildCalendar([
    { id: 'fd-2', start: '2026-10-24T16:00:00.000Z', stamp, title: 'X', durationHours: 2, cancelled: true },
  ]);

  assert.match(ics, /STATUS:CANCELLED\r\n/);
});

test('escaper komma, semikolon og linjeskift i tekst', () => {
  const ics = buildCalendar([
    { id: 'ufc-3', start: '2026-10-24T16:00:00.000Z', stamp, title: 'Main; card, live\nnå', durationHours: 5, cancelled: false },
  ]);

  assert.match(ics, /SUMMARY:Main\\; card\\, live\\nnå\r\n/);
});

test('folder linjer lengre enn 75 oktetter', () => {
  const title = 'Æ'.repeat(60);
  const ics = buildCalendar([
    { id: 'ufc-4', start: '2026-10-24T16:00:00.000Z', stamp, title, durationHours: 5, cancelled: false },
  ]);

  for (const line of ics.split('\r\n')) {
    assert.ok(Buffer.byteLength(line) <= 75, `linje for lang: ${line}`);
  }
  const unfolded = ics.replace(/\r\n /g, '');
  assert.match(unfolded, new RegExp(`SUMMARY:${title}\r\n`));
});

test('sorterer hendelser etter starttid', () => {
  const ics = buildCalendar([
    { id: 'b', start: '2026-11-01T16:00:00.000Z', stamp, title: 'senere', durationHours: 2, cancelled: false },
    { id: 'a', start: '2026-10-01T16:00:00.000Z', stamp, title: 'tidligere', durationHours: 2, cancelled: false },
  ]);

  assert.ok(ics.indexOf('tidligere') < ics.indexOf('senere'));
});
