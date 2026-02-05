/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Customer, Delivery, Card } from "./types";
import { detectBrand, luhnCheck, isValidCvc, isValidExp, isValidCardHolder } from "./cardUtils";

export type FieldErrors = Record<string, string>;

export function validateCustomer(c: Customer): FieldErrors {
  const e: FieldErrors = {};
  if (!c.fullName.trim()) e.fullName = "Full name is required";
  if (!c.email.trim()) e.email = "Email is required";
  else if (!/^\S+@\S+\.\S+$/.test(c.email)) e.email = "Invalid email";
  if (!c.phone.trim()) e.phone = "Phone is required";
  if (!c.legalId.trim()) e.legalId = "Legal ID is required";
  if (!c.legalIdType?.trim()) e.legalIdType = "Legal ID type is required";
  return e;
}

export function validateDelivery(d: Delivery): FieldErrors {
  const e: FieldErrors = {};
  if (!d.addressLine1.trim()) e.addressLine1 = "Address line 1 is required";
  if (!d.city.trim()) e.city = "City is required";
  if (!d.region.trim()) e.region = "Region is required";
  if (!d.country.trim()) e.country = "Country is required";
  return e;
}

export function validateCard(card: Card): { errors: FieldErrors; brand: string } {
  const brand = detectBrand(card.number);
  const e: FieldErrors = {};

  if (!isValidCardHolder(card.card_holder)) e.card_holder = "Card holder is required";
  if (!card.number.trim()) e.number = "Card number is required";
  else {
    if (brand === "UNKNOWN") e.number = "Only VISA or MasterCard supported";
    else if (!luhnCheck(card.number)) e.number = "Invalid card number";
  }

  if (!isValidExp(card.exp_month, card.exp_year)) e.exp = "Invalid expiry (MM/YY)";
  if (!isValidCvc(card.cvc, brand as any)) e.cvc = "Invalid CVC";

  if (!Number.isFinite(card.installments) || card.installments < 1) {
    e.installments = "Invalid installments";
  }

  return { errors: e, brand };
}

export function hasErrors(obj: FieldErrors) {
  return Object.keys(obj).length > 0;
}
