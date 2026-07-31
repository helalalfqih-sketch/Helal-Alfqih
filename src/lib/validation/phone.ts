import { z } from "zod";

export function normalizeArabicDigits(value: string): string {
  return value.replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

export const yemeniPhoneSchema = z
  .string()
  .transform(normalizeArabicDigits)
  .transform((value) => value.replace(/[\s()\-]/g, ""))
  .transform((value) => value.replace(/^00967/, "967").replace(/^0(?=7\d{8}$)/, ""))
  .refine((value) => /^(?:\+?967)?7\d{8}$/.test(value), "أدخل رقم جوال يمني صحيح مثل 77XXXXXXX")
  .transform((value) => {
    const local = value.replace(/^\+?967/, "");
    return `967${local}`;
  });
