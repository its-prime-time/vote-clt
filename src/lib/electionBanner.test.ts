import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  EARLY_VOTING_BANNER_ENDS_AT,
  POLLS_CLOSE_AT,
  POLLS_OPEN_AT,
  bannerPhase,
  formatTimeLeft,
  timeLeft,
} from './electionBanner';

/** Shorthand: the phase at an ISO timestamp, using the real 2026 dates. */
const phaseAt = (iso: string) =>
  bannerPhase(Date.parse(iso), EARLY_VOTING_BANNER_ENDS_AT, POLLS_OPEN_AT, POLLS_CLOSE_AT);

test('early voting message shows until 9 p.m. Eastern on Oct 31', () => {
  assert.equal(phaseAt('2026-10-18T12:00:00-04:00'), 'early');
  assert.equal(phaseAt('2026-10-31T20:59:59-04:00'), 'early');
});

test('countdown starts at 9 p.m. Eastern on Oct 31 (01:00 UTC Nov 1)', () => {
  assert.equal(phaseAt('2026-10-31T21:00:00-04:00'), 'countdown');
  assert.equal(phaseAt('2026-11-01T01:00:00Z'), 'countdown');
});

test('countdown runs across the Nov 1 daylight-time change until 6:30 a.m. EST Nov 3', () => {
  assert.equal(phaseAt('2026-11-03T06:29:59-05:00'), 'countdown');
  // 6:30 a.m. EST is 11:30 UTC, not 10:30 — guards against using the wrong offset.
  assert.equal(phaseAt('2026-11-03T11:29:59Z'), 'countdown');
  assert.equal(phaseAt('2026-11-03T11:30:00Z'), 'electionDay');
});

test('Election Day message shows while polls are open, 6:30 a.m. to 7:30 p.m. EST', () => {
  assert.equal(phaseAt('2026-11-03T06:30:00-05:00'), 'electionDay');
  assert.equal(phaseAt('2026-11-03T19:29:59-05:00'), 'electionDay');
});

test('banner is gone once polls close', () => {
  assert.equal(phaseAt('2026-11-03T19:30:00-05:00'), 'none');
  assert.equal(phaseAt('2026-11-04T00:00:00-05:00'), 'none');
});

test('timeLeft splits milliseconds and rounds down to the second', () => {
  const ms = ((2 * 24 + 9) * 3600 + 30 * 60 + 12) * 1000 + 999;
  assert.deepEqual(timeLeft(ms), { days: 2, hours: 9, minutes: 30, seconds: 12 });
});

test('timeLeft treats a past moment as zero', () => {
  assert.deepEqual(timeLeft(-5000), { days: 0, hours: 0, minutes: 0, seconds: 0 });
});

test('from 9 p.m. Oct 31 to polls opening is 2 days 10 hours 30 minutes (25-hour Nov 1)', () => {
  const ms = Date.parse(POLLS_OPEN_AT) - Date.parse(EARLY_VOTING_BANNER_ENDS_AT);
  assert.deepEqual(timeLeft(ms), { days: 2, hours: 10, minutes: 30, seconds: 0 });
});

test('formatTimeLeft uses singular/plural day words and drops days on the last day', () => {
  assert.equal(formatTimeLeft({ days: 2, hours: 9, minutes: 5, seconds: 7 }, 'day', 'days'), '2 days 09:05:07');
  assert.equal(formatTimeLeft({ days: 1, hours: 0, minutes: 0, seconds: 0 }, 'día', 'días'), '1 día 00:00:00');
  assert.equal(formatTimeLeft({ days: 0, hours: 23, minutes: 59, seconds: 59 }, 'day', 'days'), '23:59:59');
});
