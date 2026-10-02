import assert from 'node:assert/strict';
import { test } from 'node:test';
import { onlyAccentsAdded, stripAccents } from './accents';

test('stripAccents removes accents, tildes, diaereses and opening marks', () => {
  assert.equal(stripAccents('Atención médica más asequible'), 'Atencion medica mas asequible');
  assert.equal(stripAccents('Niños y pingüinos'), 'Ninos y pinguinos');
  assert.equal(stripAccents('¿Por qué? ¡Sí!'), 'Por que? Si!');
});

test('adding accents to the same words is accepted', () => {
  assert.equal(
    onlyAccentsAdded(
      ['Hacer que la atencion de medica sea asequible', 'Reducir el costo de energia'],
      ['Hacer que la atención de médica sea asequible', 'Reducir el costo de energía'],
    ),
    true,
  );
});

test('changing a word, even to fix a typo, is rejected', () => {
  // "maquiniara" → "maquinaria" is a spelling fix, not an accent: the editor decides that.
  assert.equal(onlyAccentsAdded(['Detengamos la maquiniara de la guerra'], ['Detengamos la maquinaria de la guerra']), false);
  assert.equal(onlyAccentsAdded(['agenda del Trump'], ['agenda de Trump']), false);
});

test('a different number of lines is rejected', () => {
  assert.equal(onlyAccentsAdded(['uno', 'dos'], ['uno dos']), false);
});
