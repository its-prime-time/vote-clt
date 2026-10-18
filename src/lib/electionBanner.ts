/**
 * electionBanner.ts
 *
 * Timing logic for the red banner under the home page navigation. The banner
 * has three phases, and disappears on its own once they are over:
 *
 *   until 3 p.m. Eastern Oct 31       → "early"       ("Early in-person voting is open…")
 *   until polls open 6:30 a.m. Nov 3  → "countdown"   ("Polls open in 2 days 09:30:12")
 *   until polls close 7:30 p.m. Nov 3 → "electionDay" ("It's Election Day! Polls are now open…")
 *   after that                        → "none"        (banner collapses)
 *
 * Everything here is pure (the current time is passed in) so it can be unit
 * tested; the page's client script calls these functions once a second.
 */

/**
 * When the banner switches from the early voting message to the countdown:
 * 3 p.m. Eastern on Saturday Oct 31, 2026, when early voting closes in North
 * Carolina (still daylight time, UTC−4).
 */
export const EARLY_VOTING_BANNER_ENDS_AT = '2026-10-31T15:00:00-04:00';

/**
 * When polls open in Mecklenburg County on Election Day: 6:30 a.m. Eastern on
 * Tuesday Nov 3, 2026. Daylight time ends on Nov 1, so this is UTC−5.
 */
export const POLLS_OPEN_AT = '2026-11-03T06:30:00-05:00';

/** When polls close in North Carolina: 7:30 p.m. Eastern on Nov 3, 2026 (UTC−5). */
export const POLLS_CLOSE_AT = '2026-11-03T19:30:00-05:00';

/** Which message the banner should show. */
export type BannerPhase = 'early' | 'countdown' | 'electionDay' | 'none';

/**
 * Decide the banner phase for a moment in time.
 *
 * @param now            the current time, in milliseconds since 1970 (Date.now())
 * @param earlyEndsAt    ISO timestamp when the early voting message stops
 * @param pollsOpenAt    ISO timestamp when the countdown reaches zero
 * @param pollsCloseAt   ISO timestamp when the Election Day message stops
 */
export function bannerPhase(
  now: number,
  earlyEndsAt: string,
  pollsOpenAt: string,
  pollsCloseAt: string,
): BannerPhase {
  if (now < Date.parse(earlyEndsAt)) return 'early';
  if (now < Date.parse(pollsOpenAt)) return 'countdown';
  if (now < Date.parse(pollsCloseAt)) return 'electionDay';
  return 'none';
}

/** The time left, split into whole days, hours, minutes and seconds. */
export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Split a number of milliseconds into days/hours/minutes/seconds, rounding
 * down to the whole second. Negative input (the moment has passed) is
 * treated as zero.
 */
export function timeLeft(ms: number): TimeLeft {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor(totalSeconds / 3_600) % 24,
    minutes: Math.floor(totalSeconds / 60) % 60,
    seconds: totalSeconds % 60,
  };
}

/**
 * Format the time left as "2 days 09:30:12" (or "1 day 09:30:12", or just
 * "09:30:12" on the last day). The words for "day"/"days" are passed in so
 * the same function serves both languages.
 */
export function formatTimeLeft(left: TimeLeft, dayWord: string, daysWord: string): string {
  const clock = [left.hours, left.minutes, left.seconds].map((n) => String(n).padStart(2, '0')).join(':');
  if (left.days === 0) return clock;
  return `${left.days} ${left.days === 1 ? dayWord : daysWord} ${clock}`;
}
