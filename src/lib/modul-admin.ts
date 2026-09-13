export const MODUL_ADMIN = [
  { key: "donasi", label: "Donasi" },
  { key: "berita", label: "Berita" },
  { key: "program", label: "Program" },
  { key: "galeri", label: "Galeri" },
] as const;

export type ModulAdminKey = (typeof MODUL_ADMIN)[number]["key"];
