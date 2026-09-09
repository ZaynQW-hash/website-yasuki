import type { APIRoute } from 'astro';

export const prerender = false;

function generateKodeReferensi(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `YSK-${yy}${mm}-${rand}`;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const { nama, whatsapp, program, nominal, pesan, tampilkan_nama } = data;

    if (!nama || !whatsapp || !program || !nominal) {
      return new Response(
        JSON.stringify({ error: 'Data belum lengkap. Nama, WhatsApp, program, dan nominal wajib diisi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const nominalNum = Number(nominal);
    if (isNaN(nominalNum) || nominalNum <= 0) {
      return new Response(
        JSON.stringify({ error: 'Nominal donasi tidak valid.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = (locals as any).runtime.env.yasuki_db;
    const kodeReferensi = generateKodeReferensi();

    await db
      .prepare(
        `INSERT INTO donasi (kode_referensi, nama, whatsapp, program, nominal, pesan, tampilkan_nama, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
      )
      .bind(kodeReferensi, nama, whatsapp, program, nominalNum, pesan || null, tampilkan_nama ? 1 : 0)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        kode_referensi: kodeReferensi,
        message: 'Donasi berhasil dicatat. Silakan transfer dan sertakan kode referensi ini.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan pada server. Silakan coba lagi.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
