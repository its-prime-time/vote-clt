import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blurbSentence, joinList, lowercaseFirst } from './blurb';

const EN = 'This candidate prioritizes {issues}';
const ES = 'Prioriza {issues}';

test('three lines become one English sentence with an Oxford comma', () => {
  const lines = ['Lowering the cost of groceries', 'Making healthcare affordable', 'Lowering energy/utility costs'];
  assert.equal(
    blurbSentence(lines, EN, 'en'),
    'This candidate prioritizes lowering the cost of groceries, making healthcare affordable, and lowering energy/utility costs.',
  );
});

test('Spanish joins with "y" and no comma before it', () => {
  const lines = ['Vivienda asequible', 'Escuelas públicas', 'Salud accesible'];
  assert.equal(blurbSentence(lines, ES, 'es'), 'Prioriza vivienda asequible, escuelas públicas y salud accesible.');
});

test('two lines use just the conjunction', () => {
  assert.equal(blurbSentence(['Safer roads', 'Better schools'], EN, 'en'), 'This candidate prioritizes safer roads and better schools.');
  assert.equal(joinList(['a', 'b'], 'es'), 'a y b');
});

test('a single line is a statement and is returned as written, with a full stop', () => {
  const statement = 'Will respect the NC Constitution and apply the law as written';
  assert.equal(blurbSentence([statement], EN, 'en'), `${statement}.`);
  assert.equal(blurbSentence(['Already punctuated.'], EN, 'en'), 'Already punctuated.');
});

test('abbreviations at the start of a line keep their capitals', () => {
  assert.equal(lowercaseFirst('NC safe again'), 'NC safe again');
  assert.equal(lowercaseFirst('U.S. jobs first'), 'U.S. jobs first');
  assert.equal(lowercaseFirst('Enacting the Trump Agenda'), 'enacting the Trump Agenda');
  assert.equal(lowercaseFirst('I-77 tolls'), 'I-77 tolls');
});

test('blank lines are ignored and no lines gives null', () => {
  assert.equal(blurbSentence(['', '  '], EN, 'en'), null);
  assert.equal(blurbSentence([], EN, 'en'), null);
  assert.equal(blurbSentence([' Only one ', ''], EN, 'en'), 'Only one.');
});
