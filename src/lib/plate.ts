export function normalizePlate(plate: string): string {
  const map: Record<string, string> = {
    ı: "i",
    i: "i",
    İ: "i",
    I: "i",
    ö: "o",
    Ö: "o",
    ü: "u",
    Ü: "u",
    ş: "s",
    Ş: "s",
    ç: "c",
    Ç: "c",
    ğ: "g",
    Ğ: "g",
  };
  const cleaned = plate
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  return cleaned;
}
