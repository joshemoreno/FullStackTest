import type { Card } from "./types";

function luhnCheck(num: string) {
  const s = num.replace(/\s+/g, "");
  if (!/^\d+$/.test(s)) return false;

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

export function validateCardBasic(card: Card): string | null {
  if (!card.card_holder.trim()) return "Card holder requerido";
  if (!luhnCheck(card.number)) return "Número de tarjeta inválido";
  if (!/^\d{2}$/.test(card.exp_month) || Number(card.exp_month) < 1 || Number(card.exp_month) > 12)
    return "Mes inválido (MM)";
  if (!/^\d{2}$/.test(card.exp_year)) return "Año inválido (YY)";
  if (!/^\d{3,4}$/.test(card.cvc)) return "CVC inválido";
  if (!Number.isFinite(card.installments) || card.installments < 1) return "Cuotas inválidas";
  return null;
}
