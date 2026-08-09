/**
 * boeUrls.ts
 *
 * Constants and small helpers for the Mecklenburg Board of Elections endpoints.
 * Isolating these string literals makes it obvious what external surface we
 * depend on, and easy to update if the BOE ever changes their URLs.
 */

/** The origin all BOE apps live under. */
export const BOE_ORIGIN = 'https://apps.meckboe.org';

/**
 * The address search form. A user enters house number + street name here; the
 * page posts back to itself and renders a list of matching address links.
 */
export const BOE_SEARCH_URL = `${BOE_ORIGIN}/addressSearch_New.aspx`;

/**
 * The DOM ids on the search form we interact with (from the sample HTML in
 * specs/sample). Centralized so a markup change only needs editing here.
 */
export const SEARCH_FORM = {
  houseNumberInput: '#txtHouseNumber',
  streetNameInput: '#txtStreetName',
  submitButton: '#imgbtnGo',
  /** The results grid rendered after a successful search. */
  resultsTable: '#dgAddress',
} as const;

/**
 * Resolve a possibly-relative BOE href (e.g.
 * "AddressSearchReturn_New.aspx?SN=...") into an absolute URL.
 */
export function toAbsoluteBoeUrl(href: string): string {
  return new URL(href, `${BOE_ORIGIN}/`).toString();
}
