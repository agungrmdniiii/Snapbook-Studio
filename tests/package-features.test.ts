import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePackageFeatures } from '../src/lib/package-features';

test('a saved feature list keeps the order and wording of the catalog', () => {
  assert.deepEqual(parsePackageFeatures('["Hingga 5 orang", "10 foto retouch", "Semua softcopy"]'), ['Hingga 5 orang', '10 foto retouch', 'Semua softcopy']);
});

test('malformed or non-list legacy data cannot break the package page', () => {
  for (const value of ['not-json', 'null', '{}', '"studio"', '42', undefined]) assert.deepEqual(parsePackageFeatures(value), []);
});

test('invalid entries are ignored without inventing inclusions', () => {
  assert.deepEqual(parsePackageFeatures('["File digital",null,2,{},"", "  Cetak 4R  "]'), ['File digital', 'Cetak 4R']);
});
