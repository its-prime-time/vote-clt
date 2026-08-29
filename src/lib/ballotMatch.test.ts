/**
 * Unit tests for the ballot matcher. Run with `npm test`.
 *
 * Uses Node's built-in test runner (`node:test`) so there is no framework to
 * learn: `test(name, fn)` and `assert`.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { districtToken, matchContests, type Matchable } from './ballotMatch';

/** Shorthand for building a contest with just the fields the matcher reads. */
const contest = (id: string, ballotMatch: Matchable['ballotMatch']): Matchable => ({ id, ballotMatch });

/** The districts the lookup returns for 3227 Planters Ridge Rd (the known-good test address). */
const plantersRidge = {
  congress: 'CONGRESSIONAL DISTRICT 8',
  stateSenate: 'NC SENATE DISTRICT 42',
  stateHouse: 'NC HOUSE DISTRICT 105',
  judicial: 'JUDICIAL DISTRICT 26',
  superiorCourt: 'SUPERIOR COURT DISTRICT 26A',
  countyCommission: 'BOARD OF COMMISSIONERS DISTRICT 6',
  school: 'SCHOOL BOARD DIST 6',
  municipality: 'CHARLOTTE',
  cityCouncil: 'CITY COUNCIL DISTRICT 7',
};

const ids = (matched: Matchable[]) => matched.map((c) => c.id);

test('districtToken pulls the trailing number and optional letter', () => {
  assert.equal(districtToken('NC HOUSE DISTRICT 105'), '105');
  assert.equal(districtToken('CONGRESSIONAL DISTRICT 8'), '8');
  assert.equal(districtToken('SUPERIOR COURT DISTRICT 26A'), '26A');
  assert.equal(districtToken('SUPERIOR COURT DISTRICT 26a'), '26A');
  assert.equal(districtToken('SCHOOL BOARD DIST 6'), '6');
  assert.equal(districtToken('088'), '88');
  assert.equal(districtToken('CHARLOTTE'), null);
  assert.equal(districtToken(undefined), null);
  assert.equal(districtToken(''), null);
});

test('statewide and county contests are always on the ballot', () => {
  const contests = [contest('senate', { districtKey: 'statewide' }), contest('sheriff', { districtKey: 'county' })];
  assert.deepEqual(ids(matchContests(plantersRidge, contests)), ['senate', 'sheriff']);
  assert.deepEqual(ids(matchContests({}, contests)), ['senate', 'sheriff']);
  assert.deepEqual(ids(matchContests(undefined, contests)), ['senate', 'sheriff']);
});

test('district contests match on the number, ignoring zero padding and label wording', () => {
  const contests = [
    contest('house-105', { districtKey: 'stateHouse', district: '105' }),
    contest('house-104', { districtKey: 'stateHouse', district: '104' }),
    contest('house-008', { districtKey: 'stateHouse', district: '008' }),
    contest('congress-8', { districtKey: 'congress', district: '8' }),
    contest('congress-12', { districtKey: 'congress', district: '12' }),
  ];
  assert.deepEqual(ids(matchContests(plantersRidge, contests)), ['house-105', 'congress-8']);
  // "8" must not match "88" or "108".
  assert.deepEqual(ids(matchContests({ stateHouse: 'NC HOUSE DISTRICT 88' }, contests)), []);
});

test('superior court sub-districts must match letter for letter', () => {
  const contests = [
    contest('sup-26a', { districtKey: 'superiorCourt', district: '26A' }),
    contest('sup-26c', { districtKey: 'superiorCourt', district: '26C' }),
  ];
  assert.deepEqual(ids(matchContests(plantersRidge, contests)), ['sup-26a']);
  assert.deepEqual(ids(matchContests({ superiorCourt: 'SUPERIOR COURT DISTRICT 26C' }, contests)), ['sup-26c']);
  // Without a letter, nothing in a lettered sub-district matches.
  assert.deepEqual(ids(matchContests({ superiorCourt: 'SUPERIOR COURT DISTRICT 26' }, contests)), []);
});

test('judicial district 26 covers district court seats and the DA', () => {
  const contests = [
    contest('dc-13', { districtKey: 'judicial', district: '26' }),
    contest('da', { districtKey: 'judicial', district: '26' }),
  ];
  assert.deepEqual(ids(matchContests(plantersRidge, contests)), ['dc-13', 'da']);
});

test('city contests require living in Charlotte', () => {
  const contests = [
    contest('mayor', { districtKey: 'municipality' }),
    contest('council-7', { districtKey: 'cityCouncil', district: '7' }),
    contest('council-1', { districtKey: 'cityCouncil', district: '1' }),
  ];
  assert.deepEqual(ids(matchContests(plantersRidge, contests)), ['mayor', 'council-7']);
  assert.deepEqual(ids(matchContests({ ...plantersRidge, municipality: 'charlotte ' }, contests)), ['mayor', 'council-7']);
  assert.deepEqual(ids(matchContests({ ...plantersRidge, municipality: 'HUNTERSVILLE' }, contests)), []);
  assert.deepEqual(ids(matchContests({ ...plantersRidge, municipality: '' }, contests)), []);
});

test('a missing or unparseable BOE value matches nothing for that key', () => {
  const contests = [
    contest('house-105', { districtKey: 'stateHouse', district: '105' }),
    contest('commission-6', { districtKey: 'countyCommission', district: '6' }),
  ];
  assert.deepEqual(ids(matchContests({ stateHouse: 'NC HOUSE DISTRICT 105' }, contests)), ['house-105']);
  assert.deepEqual(ids(matchContests({ stateHouse: 'UNKNOWN', countyCommission: 'AT LARGE' }, contests)), []);
  // A contest that claims a district key but has no district can never match.
  assert.deepEqual(ids(matchContests(plantersRidge, [contest('odd', { districtKey: 'stateHouse' })])), []);
});

test('preserves the input order', () => {
  const contests = [
    contest('c', { districtKey: 'county' }),
    contest('a', { districtKey: 'statewide' }),
    contest('b', { districtKey: 'congress', district: '8' }),
  ];
  assert.deepEqual(ids(matchContests(plantersRidge, contests)), ['c', 'a', 'b']);
});
