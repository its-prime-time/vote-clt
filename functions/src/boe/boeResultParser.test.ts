import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import * as cheerio from 'cheerio';
import { isSearchPage, pageTitle, parseSearchResults } from './boeResultParser.js';

/** A saved page from specs/sample. */
const sample = (name: string) => readFileSync(new URL(`../../../specs/sample/${name}`, import.meta.url), 'utf8');

/**
 * The BOE samples were saved from Chrome's view-source tab, so the real markup
 * is stored as escaped text, one source line per `.line-content` cell. Rebuild
 * the original HTML from those lines so the parser sees the real page.
 */
const fromViewSource = (html: string) => {
  const $ = cheerio.load(html);
  return $('.line-content').map((_, el) => $(el).text()).get().join('\n');
};
const searchResultsPage = () => fromViewSource(sample('meckboe-address-search-result.aspx.html'));

test('the real BOE search results page is recognized as the search page', () => {
  const html = searchResultsPage();
  assert.equal(isSearchPage(html), true);
  assert.ok(parseSearchResults(html).length > 0);
});

test('a Cloudflare block page is NOT the search page, so it can be reported as an outage', () => {
  const html = sample('cloudflare-block-page.html');
  assert.equal(isSearchPage(html), false);
  assert.equal(parseSearchResults(html).length, 0);
  assert.match(pageTitle(html), /Cloudflare/);
});

test('the search form with an empty results grid is a genuine "not found"', () => {
  // Same page as the results sample, with the result links removed.
  const html = searchResultsPage().replace(/<a [^>]*AddressSearchReturn[^>]*>[\s\S]*?<\/a>/gi, '');
  assert.equal(parseSearchResults(html).length, 0);
  assert.equal(isSearchPage(html), true);
});
