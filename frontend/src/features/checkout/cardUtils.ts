export type CardBrand = "VISA" | "MASTERCARD" | "UNKNOWN";

export function sanitizeCardNumber(raw: string) {
  return raw.replace(/[^\d]/g, "");
}

export function formatCardNumber(raw: string) {
  const digits = sanitizeCardNumber(raw).slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function detectBrand(raw: string): CardBrand {
  const n = sanitizeCardNumber(raw);

  if (/^4/.test(n)) return "VISA";

  const first2 = Number(n.slice(0, 2));
  const first4 = Number(n.slice(0, 4));
  if ((first2 >= 51 && first2 <= 55) || (first4 >= 2221 && first4 <= 2720)) {
    return "MASTERCARD";
  }

  return "UNKNOWN";
}

export function luhnCheck(raw: string): boolean {
  const s = sanitizeCardNumber(raw);
  if (s.length < 12) return false;
  let sum = 0;
  let dbl = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let d = Number(s[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

export function isValidExp(expMonth: string, expYear: string) {
  if (!/^\d{2}$/.test(expMonth) || !/^\d{2}$/.test(expYear)) return false;
  const mm = Number(expMonth);
  const yy = Number(expYear);
  if (mm < 1 || mm > 12) return false;

  const year = 2000 + yy;
  const now = new Date();
  const expEnd = new Date(year, mm, 1);
  return expEnd > now;
}

export function isValidCvc(cvc: string, brand: CardBrand) {
  const digits = cvc.replace(/[^\d]/g, "");
  if (brand === "VISA" || brand === "MASTERCARD") return /^\d{3}$/.test(digits);
  return /^\d{3,4}$/.test(digits);
}

export function isValidCardHolder(name: string) {
  return name.trim().length >= 3;
}
