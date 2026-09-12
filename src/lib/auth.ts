import { env } from "cloudflare:workers";

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

async function pbkdf2(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
}

/** Dipakai kalau nanti butuh bikin/ganti password langsung dari kode (jarang dipakai; seed pakai scripts/seed-admin.mjs). */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  return `${toHex(salt.buffer)}:${toHex(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = fromHex(saltHex);
  const hash = await pbkdf2(password, salt);
  return toHex(hash) === hashHex;
}

// --- Session (cookie ditandatangani, tanpa perlu tabel sessions terpisah) ---

export const SESSION_COOKIE_NAME = "yasuki_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 hari

export interface SessionPayload {
  uid: number;
  email: string;
  nama: string;
  role: string;
  exp: number;
}

async function getSecretKey(): Promise<CryptoKey> {
  const secret = env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET belum di-set (wrangler secret put ADMIN_SESSION_SECRET)");
  }
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  const pad = (4 - (str.length % 4)) % 4;
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  return atob(padded);
}

export async function createSessionToken(payload: Omit<SessionPayload, "exp">): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const fullPayload: SessionPayload = { ...payload, exp };
  const payloadStr = base64UrlEncode(JSON.stringify(fullPayload));
  const key = await getSecretKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadStr));
  const sigStr = base64UrlEncode(toHex(sig));
  return `${payloadStr}.${sigStr}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const [payloadStr, sigStr] = token.split(".");
  if (!payloadStr || !sigStr) return null;
  try {
    const key = await getSecretKey();
    const expectedSig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadStr));
    const expectedSigStr = base64UrlEncode(toHex(expectedSig));
    if (expectedSigStr !== sigStr) return null;

    const payload: SessionPayload = JSON.parse(base64UrlDecode(payloadStr));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
