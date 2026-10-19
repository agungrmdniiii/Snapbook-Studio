import nextEnv from '@next/env';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { del } from '@vercel/blob';
import sharp from 'sharp';
const { uploadGalleryImage } = createRequire(import.meta.url)('../src/lib/media-storage.ts') as typeof import('../src/lib/media-storage');
nextEnv.loadEnvConfig(process.cwd());
// Creates a dummy pixel image only; never reads or alters gallery database rows.
const bytes = await sharp({create:{width:4,height:4,channels:4,background:'#444444'}}).png().toBuffer();
let url: string | undefined;
try {
  url=await uploadGalleryImage(bytes,'image/png');
  assert.match(url,/^https:\/\/v834zybbtjasti4c\.public\.blob\.vercel-storage\.com\/gallery\//);
  const response=await fetch(url);
  assert.equal(response.status,200);
  const received=Buffer.from(await response.arrayBuffer());
  const hash=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');
  assert.equal(hash(received),hash(bytes));
  console.log(JSON.stringify({storage:'snapbook-gallery',upload:true,publicRead:true,checksum:true,bytes:bytes.length,noGalleryRowsChanged:true}));
} finally {
  if(url && new URL(url).hostname === 'v834zybbtjasti4c.public.blob.vercel-storage.com') await del(url);
}
