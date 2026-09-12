// Script lokal (dijalankan sekali) untuk bikin akun admin pertama.
// Pakai algoritma hash yang SAMA persis dengan src/lib/auth.ts
// (PBKDF2-SHA256, 100000 iterasi) supaya bisa login lewat website.
//
// Cara pakai:
//   node scripts/seed-admin.mjs email@contoh.com passwordkuat123 "Nama Admin" superadmin
//
// Output-nya berupa perintah wrangler yang tinggal di-copy-paste
// ke terminal untuk benar-benar insert ke database D1.

import { webcrypto as crypto } from "node:crypto";

const [, , email, password, nama, role = "superadmin"] = process.argv;

if (!email || !password || !nama) {
  console.error(
    'Pemakaian: node scripts/seed-admin.mjs <email> <password> <nama> [role]\nContoh: node scripts/seed-admin.mjs admin@yasuki.site "passwordkuat123" "Zayn" superadmin',
  );
  process.exit(1);
}

const encoder = new TextEncoder();

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function pbkdf2(passwordStr, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passwordStr),
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

const salt = crypto.getRandomValues(new Uint8Array(16));
const hashBuffer = await pbkdf2(password, salt);
const passwordHash = `${toHex(salt.buffer)}:${toHex(hashBuffer)}`;

const emailEscaped = email.trim().toLowerCase().replace(/'/g, "''");
const namaEscaped = nama.replace(/'/g, "''");
const roleEscaped = role.replace(/'/g, "''");

console.log("\nJalankan perintah ini untuk membuat akun admin di database production:\n");
console.log(
  `npx wrangler d1 execute yasuki-db --remote --command "INSERT INTO admin_users (email, password_hash, nama, role) VALUES ('${emailEscaped}', '${passwordHash}', '${namaEscaped}', '${roleEscaped}');"`,
);
console.log("");
