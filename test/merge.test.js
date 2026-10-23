import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keepInWindow, mergeSource } from '../src/merge.js';

const now = new Date('2026-10-23T12:00:00Z');
const earlier = '2026-10-01T10:00:00.000Z';

test('nye hendelser får dagens tidsstempel', () => {
  const merged = mergeSource([], [{ id: 'fd-1', start: '2026-11-01T15:00:00.000Z', title: 'A', durationHours: 2 }], 'fd-', now);

  assert.equal(merged[0].stamp, now.toISOString());
  assert.equal(merged[0].cancelled, false);
});

test('eksisterende hendelser beholder sitt opprinnelige tidsstempel', () => {
  const previous = [{ id: 'fd-1', start: '2026-11-01T15:00:00.000Z', stamp: earlier, title: 'A', durationHours: 2, cancelled: false }];
  const current = [{ id: 'fd-1', start: '2026-11-02T15:00:00.000Z', title: 'A flyttet', durationHours: 2 }];

  const merged = mergeSource(previous, current, 'fd-', now);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].stamp, earlier);
  assert.equal(merged[0].start, '2026-11-02T15:00:00.000Z');
});

test('fremtidig hendelse som forsvinner fra kilden markeres som avlyst', () => {
  const previous = [{ id: 'fd-9', start: '2026-11-01T15:00:00.000Z', stamp: earlier, title: 'Borte', durationHours: 2, cancelled: false }];

  const merged = mergeSource(previous, [], 'fd-', now);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].cancelled, true);
});

test('passerte hendelser som forsvinner fjernes ikke som avlyst', () => {
  const previous = [{ id: 'fd-8', start: '2026-10-01T15:00:00.000Z', stamp: earlier, title: 'Gammel', durationHours: 2, cancelled: false }];

  const merged = mergeSource(previous, [], 'fd-', now);

  assert.deepEqual(merged, []);
});

test('kilder med annen prefiks berøres ikke', () => {
  const previous = [{ id: 'ufc-1', start: '2026-11-01T15:00:00.000Z', stamp: earlier, title: 'UFC', durationHours: 5, cancelled: false }];

  const merged = mergeSource(previous, [], 'fd-', now);

  assert.deepEqual(merged, []);
});

test('keepInWindow fjerner hendelser utenfor vinduet', () => {
  const events = [
    { id: 'old', start: '2026-10-20T12:00:00.000Z' },
    { id: 'recent', start: '2026-10-23T06:00:00.000Z' },
    { id: 'far', start: '2028-01-01T12:00:00.000Z' },
  ];

  assert.deepEqual(keepInWindow(events, now).map((event) => event.id), ['recent']);
});
