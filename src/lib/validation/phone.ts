import { z } from "zod";

/** Normalize both Arabic-Indic (\u0660–\u0669) and Extended-Arabic-Indic (\u06F0–\u06F9) digits to ASCII */
export function normalizeArabicDigits(value: string): string {
  return value
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

export const yemeniPhoneSchema = z
  .string()
  .trim()
  .transform(normalizeArabicDigits)
  .transform((value) => value.replace(/[\s()-]/g, ""))
  // Strip leading 0 from local Yemeni format: 0771234567 → 771234567
  .transform((value) => value.replace(/^0(?=7\d{8}$)/, ""))
  // Strip 00967 prefix
  .transform((value) => value.replace(/^00967/, "967"))
  .refine((value) => /^(?:\+?967)?7\d{8}$/.test(value), "أدخل رقم جوال يمني صحيح مثل 77XXXXXXX")
  .transform((value) => {
    const local = value.replace(/^\+?967/, "");
    return `967${local}`;
  });
