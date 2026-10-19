import { NextResponse } from 'next/server';

export class MutationInputError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export async function readMutationBody(request: Request) {
  if (Number(request.headers.get('content-length')) > 16384) throw new MutationInputError('Data terlalu besar.', 413);
  const text = await request.text();
  if (text.length > 16384) throw new MutationInputError('Data terlalu besar.', 413);
  const data: unknown = JSON.parse(text);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new MutationInputError('Data harus berupa objek yang valid.');
  return data as Record<string, unknown>;
}

export function mutationFailure(error: unknown, entity: string) {
  if (error instanceof MutationInputError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 });
  const code = (error as { code?: string } | null)?.code;
  if (code === 'P2025') return NextResponse.json({ error: `${entity} tidak ditemukan. Muat ulang daftar.` }, { status: 404 });
  if (code === 'P2003') return NextResponse.json({ error: 'Data masih digunakan reservasi. Muat ulang dan nonaktifkan item untuk mempertahankan riwayat.' }, { status: 409 });
  if (code === 'P2002' || code === 'P2034') return NextResponse.json({ error: 'Data berubah atau sudah tersedia. Muat ulang sebelum mencoba kembali.' }, { status: 409 });
  console.error('Database mutation failed', { entity, code: code ?? 'UNKNOWN' });
  return NextResponse.json({ error: 'Data belum dapat disimpan. Silakan coba kembali.' }, { status: ['P1001', 'P1002', 'P2024'].includes(code ?? '') ? 503 : 500 });
}
