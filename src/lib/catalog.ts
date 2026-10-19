import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';
import { isPublicImageUrl } from './media-storage';

export const CATALOG_CACHE_TAG = 'studio-catalog';

export async function readStudioCatalog(db: Pick<typeof prisma, 'studioConfig' | 'package' | 'addOn' | 'showcaseImage'> = prisma) {
  const [config, packages, addOns, gallery] = await Promise.all([
    db.studioConfig.findUnique({ where: { id: 'default' } }),
    db.package.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    db.addOn.findMany({ where: { isActive: true } }),
    db.showcaseImage.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);
  return {
    config,
    packages: packages.map(pkg => ({ ...pkg, imageUrl: pkg.imageUrl && isPublicImageUrl(pkg.imageUrl) ? pkg.imageUrl : null })),
    addOns,
    gallery: gallery.filter(image => isPublicImageUrl(image.url)),
  };
}

export const getStudioCatalog = unstable_cache(
  () => readStudioCatalog(), ['studio-catalog-v1'], { revalidate: 60, tags: [CATALOG_CACHE_TAG] },
);
