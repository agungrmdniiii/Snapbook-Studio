import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGalleryCollection, findPhotoPackage, INSPIRATION_PHOTOS } from '../src/lib/gallery-presentation';
import { DEFAULT_GALLERY } from '../src/lib/constants';

test('curation replaces only untouched demo photos and preserves uploaded or edited records', () => {
  const uploaded = { ...DEFAULT_GALLERY[0], id: 'upload-1', url: '/gallery/client.webp' };
  const edited = { ...DEFAULT_GALLERY[1], url: '/gallery/new-graduation.webp' };
  const input = [DEFAULT_GALLERY[0], uploaded, edited];
  const result = buildGalleryCollection(input);
  assert.equal(result.length, INSPIRATION_PHOTOS.length + 2);
  assert.deepEqual(result.slice(-2), [uploaded, edited]);
  assert.equal(input.length, 3);
  assert.ok(!result.some(photo => photo.id === DEFAULT_GALLERY[0].id));
});

test('an image with a custom ID remains visible even if it uses the same stock URL', () => {
  const custom = { ...DEFAULT_GALLERY[0], id: 'custom-choice' };
  assert.ok(buildGalleryCollection([custom]).some(photo => photo.id === custom.id));
});

test('an admin-edited seed caption is preserved', () => {
  const edited = { ...DEFAULT_GALLERY[0], title: 'Pilihan admin' };
  assert.ok(buildGalleryCollection([edited]).some(photo => photo.title === 'Pilihan admin'));
});

test('photo links use an actual category match and do not invent a couple package', () => {
  const packages = [{ id: 'self', name: 'Self photo', category: 'Self Portrait' }, { id: 'grad', name: 'Wisuda', category: 'Graduation' }];
  assert.equal(findPhotoPackage('Portrait', packages)?.id, 'self');
  assert.equal(findPhotoPackage(' graduation ', packages)?.id, 'grad');
  assert.equal(findPhotoPackage('Couple', packages), undefined);
  assert.equal(findPhotoPackage('Family', []), undefined);
});
