import { MutationInputError } from './api-mutation';
import { isPublicImageUrl } from './media-storage';

type CatalogData = { name?: string; description?: string; price?: number; isActive?: boolean; duration?: number; category?: string; imageUrl?: string | null; features?: string; sortOrder?: number };

export function catalogInput(input: Record<string, unknown>, create: boolean) {
  const type = input.type ?? 'package';
  if (type !== 'package' && type !== 'addon') throw new MutationInputError('Jenis katalog tidak valid.');
  const data: CatalogData = {};
  const text = (key: 'name' | 'description' | 'category', max: number, required = false) => {
    const value = input[key];
    if (value === undefined && !(create && required)) return;
    if (typeof value !== 'string' || value.trim().length > max || ((required || key === 'category') && !value.trim())) throw new MutationInputError(`${key === 'name' ? 'Nama' : key === 'category' ? 'Kategori' : 'Deskripsi'} tidak valid.`);
    data[key] = value.trim();
  };
  const integer = (key: 'price' | 'duration' | 'sortOrder', min: number, max: number, required = false) => {
    const value = input[key];
    if (value === undefined && !(create && required)) return;
    if ((typeof value !== 'number' && typeof value !== 'string') || (typeof value === 'string' && !value.trim()) || !Number.isSafeInteger(Number(value)) || Number(value) < min || Number(value) > max) throw new MutationInputError(`${key === 'price' ? 'Harga' : key === 'duration' ? 'Durasi' : 'Urutan'} tidak valid.`);
    data[key] = Number(value);
  };
  text('name', 200, true); text('description', 4000); integer('price', 0, 2147483647, true);
  if (input.isActive !== undefined) {
    if (typeof input.isActive !== 'boolean') throw new MutationInputError('Status aktif tidak valid.');
    data.isActive = input.isActive;
  }
  if (type === 'package') {
    integer('duration', 1, 1440); integer('sortOrder', 0, 100000); text('category', 80);
    if (input.imageUrl !== undefined) {
      if (input.imageUrl === null || input.imageUrl === '') data.imageUrl = null;
      else if (isPublicImageUrl(input.imageUrl, false)) data.imageUrl = input.imageUrl;
      else throw new MutationInputError('URL foto harus berupa URL HTTPS yang valid.');
    }
    if (input.features !== undefined) {
      let features: unknown;
      try { features = typeof input.features === 'string' ? JSON.parse(input.features) : input.features; }
      catch { throw new MutationInputError('Fasilitas harus berupa daftar teks yang valid.'); }
      if (!Array.isArray(features) || features.length > 50 || features.some(v => typeof v !== 'string' || v.trim().length > 200)) throw new MutationInputError('Fasilitas harus berupa daftar teks (maksimal 50).');
      data.features = JSON.stringify(features.map(v => (v as string).trim()).filter(Boolean));
    }
  }
  if (!create && Object.keys(data).length === 0) throw new MutationInputError('Tidak ada perubahan yang valid untuk disimpan.');
  return { type, data };
}
