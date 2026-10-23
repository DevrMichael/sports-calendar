import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { buildCalendar } from './ics.js';
import { keepInWindow, mergeSource } from './merge.js';
import { fetchFootballEvents } from './sources/footballData.js';
import { fetchUfcEvents } from './sources/ufc.js';

const STATE_PATH = 'data/state.json';
const ICS_PATH = 'docs/calendar.ics';

const token = process.env.FOOTBALL_DATA_TOKEN;
if (!token) {
  throw new Error('FOOTBALL_DATA_TOKEN mangler. Legg den i .env eller som GitHub-secret.');
}

const now = new Date();
const previous = JSON.parse(await readFile(STATE_PATH, 'utf8'));

const [football, ufc] = await Promise.all([
  fetchFootballEvents({ token, now }),
  fetchUfcEvents({ now }),
]);

const merged = [
  ...mergeSource(previous, football, 'fd-', now),
  ...mergeSource(previous, ufc, 'ufc-', now),
];
const events = keepInWindow(merged, now);

await mkdir(dirname(ICS_PATH), { recursive: true });
await writeFile(ICS_PATH, buildCalendar(events, { name: 'Sport' }));
await writeFile(STATE_PATH, `${JSON.stringify(events, null, 2)}\n`);

console.log(`Skrev ${events.length} hendelser (${football.length} fotball, ${ufc.length} UFC).`);
