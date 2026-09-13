/**
 * Official election links used in more than one place on the site. Keeping
 * them here means a URL change is a one-line edit.
 */

/**
 * The NC State Board of Elections' Voter Search. Enter a first and last name
 * to see registration status, party, polling place, districts, and sample
 * ballot. Mecklenburg's own "check your registration" page points here too.
 * English only.
 */
export const ncVoterSearchUrl = 'https://vt.ncsbe.gov/RegLkup/';

/**
 * NCSBE "Voter ID" page: the full list of acceptable photo IDs, expiration
 * rules, and what happens if a voter can't show one (ID Exception Form).
 */
export const ncVoterIdUrl = 'https://www.ncsbe.gov/voting/voter-id';

/**
 * NCSBE "Vote Early in Person" page: early voting dates (2026 general:
 * Oct 15 – 3 p.m. Oct 31) and the rule that any site in your county works.
 */
export const ncEarlyVotingUrl = 'https://www.ncsbe.gov/voting/vote-early-person';

/** NCSBE "Get a Free Voter Photo ID" page (issued by the county board of elections). */
export const ncFreeVoterIdUrl = 'https://www.ncsbe.gov/voting/voter-id/get-free-voter-photo-id';

/**
 * NCSBE "Register in Person During Early Voting" page: same-day registration
 * and the proof-of-residence documents it requires.
 */
export const ncSameDayRegistrationUrl =
  'https://www.ncsbe.gov/registering/how-register/register-person-during-early-voting';

/**
 * NCSBE "Referendum Choices List" for the Nov. 3, 2026 general election: the
 * official contest names and ballot wording of every statewide referendum.
 * Source of the full text shown on the Next Elections page (report dated
 * Sep 2, 2026).
 */
export const ncStatewideReferendums2026Url =
  'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/statewide_referendums_20261103.pdf';

/**
 * NCSBE "Referendum Choices List" for Nov. 3, 2026, all counties (statewide
 * amendments plus every local referendum, grouped by county). Mecklenburg's
 * City of Charlotte bond questions are on pages 43–44 (report dated
 * Sep 2, 2026).
 */
export const ncReferendums2026Url =
  'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/referendums_20261103.pdf';

/** Mecklenburg County Board of Elections home page. */
export const meckBoeUrl = 'https://vote.mecknc.gov/';

/**
 * Mecklenburg County Board of Elections "Upcoming Elections" page. For the
 * 2026 general election it lists every early voting site with its address and
 * hours (checked 2026-09-13: 25 sites, Oct 15–31).
 */
export const meckBoeUpcomingElectionsUrl = 'https://vote.mecknc.gov/upcoming-elections';

/** Mecklenburg County Board of Elections phone number, as shown on their site. */
export const meckBoePhone = '704-336-2133';
