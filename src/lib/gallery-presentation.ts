import { DEFAULT_GALLERY } from './constants';

export interface GalleryPhoto {
  id: string;
  url: string;
  title?: string | null;
  category: string;
  aspectRatio: string;
  credit?: { author: string; sourceUrl: string; location: string };
}

export const INSPIRATION_PHOTOS: GalleryPhoto[] = [
  { id: 'inspiration-portrait', url: '/inspiration/portrait.webp', title: 'Portrait', category: 'Portrait', aspectRatio: 'portrait', credit: { author: 'Dwidiyo Hanung', sourceUrl: 'https://www.pexels.com/photo/portrait-of-a-woman-with-short-hair-14795560/', location: 'Indonesia' } },
  { id: 'inspiration-couple', url: '/inspiration/couple.webp', title: 'Foto pasangan', category: 'Couple', aspectRatio: 'portrait', credit: { author: 'Jeny Godjali', sourceUrl: 'https://www.pexels.com/photo/stylish-couple-posing-in-studio-setting-40033629/', location: 'Garut, Indonesia' } },
  { id: 'inspiration-family', url: '/inspiration/family.webp', title: 'Foto keluarga', category: 'Family', aspectRatio: 'portrait', credit: { author: 'Philip Elma', sourceUrl: 'https://www.pexels.com/photo/family-portrait-in-red-attire-indoor-studio-setting-30388321/', location: 'Malang, Indonesia' } },
  { id: 'inspiration-graduation', url: '/inspiration/graduation.webp', title: 'Inspirasi wisuda', category: 'Graduation', aspectRatio: 'portrait', credit: { author: 'abdilah fariq', sourceUrl: 'https://www.pexels.com/photo/indonesian-graduation-ceremony-portrait-34436718/', location: 'Indonesia' } },
];

function imageIdentity(url: string) {
  try { const parsed = new URL(url); return parsed.origin + parsed.pathname; }
  catch { return url; }
}

export function buildGalleryCollection(images: GalleryPhoto[]): GalleryPhoto[] {
  return [...INSPIRATION_PHOTOS, ...images.filter(image => !DEFAULT_GALLERY.some(seed => seed.id === image.id && imageIdentity(seed.url) === imageIdentity(image.url) && seed.title === image.title && seed.category === image.category))];
}

export function findPhotoPackage<T extends { id: string; name: string; category: string }>(category: string, packages: T[]): T | undefined {
  const normalized = category.trim().toLowerCase();
  const target = normalized === 'portrait' ? 'self portrait' : normalized;
  return packages.find(pkg => pkg.category.trim().toLowerCase() === target);
}
