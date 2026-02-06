/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vitest/globals" />

import { describe, test, expect } from "vitest";
import { validateCardBasic } from "../validators";
import type { Card } from "../types";

function validCard(overrides: Partial<Card> = {}): Card {
  return {
    card_holder: "Jose Moreno",
    number: "4111 1111 1111 1111",
    exp_month: "12",
    exp_year: "30",
    cvc: "123",
    installments: 1,
    ...overrides,
  } as Card;
}

describe("validateCardBasic", () => {
  test("retorna null si la tarjeta es válida", () => {
    expect(validateCardBasic(validCard())).toBeNull();
  });

  test("card_holder vacío => 'Card holder requerido'", () => {
    expect(validateCardBasic(validCard({ card_holder: "   " }))).toBe("Card holder requerido");
  });

  test("número no pasa Luhn => 'Número de tarjeta inválido'", () => {
    expect(validateCardBasic(validCard({ number: "4111 1111 1111 1112" }))).toBe(
      "Número de tarjeta inválido"
    );
  });

  test("número con caracteres no numéricos => inválido", () => {
    expect(validateCardBasic(validCard({ number: "4111-1111-1111-1111" }))).toBe(
      "Número de tarjeta inválido"
    );
  });

  test("mes inválido por formato => 'Mes inválido (MM)'", () => {
    expect(validateCardBasic(validCard({ exp_month: "1" }))).toBe("Mes inválido (MM)");
    expect(validateCardBasic(validCard({ exp_month: "ab" }))).toBe("Mes inválido (MM)");
  });

  test("mes inválido por rango => 'Mes inválido (MM)'", () => {
    expect(validateCardBasic(validCard({ exp_month: "00" }))).toBe("Mes inválido (MM)");
    expect(validateCardBasic(validCard({ exp_month: "13" }))).toBe("Mes inválido (MM)");
  });

  test("año inválido => 'Año inválido (YY)'", () => {
    expect(validateCardBasic(validCard({ exp_year: "3" }))).toBe("Año inválido (YY)");
    expect(validateCardBasic(validCard({ exp_year: "abc" as any }))).toBe("Año inválido (YY)");
  });

  test("cvc inválido => 'CVC inválido'", () => {
    expect(validateCardBasic(validCard({ cvc: "12" }))).toBe("CVC inválido");
    expect(validateCardBasic(validCard({ cvc: "12345" }))).toBe("CVC inválido");
    expect(validateCardBasic(validCard({ cvc: "12a" as any }))).toBe("CVC inválido");
  });

  test("installments inválidas (no finito) => 'Cuotas inválidas'", () => {
    expect(validateCardBasic(validCard({ installments: NaN }))).toBe("Cuotas inválidas");
    expect(validateCardBasic(validCard({ installments: Infinity }))).toBe("Cuotas inválidas");
  });

  test("installments inválidas (<1) => 'Cuotas inválidas'", () => {
    expect(validateCardBasic(validCard({ installments: 0 }))).toBe("Cuotas inválidas");
    expect(validateCardBasic(validCard({ installments: -1 }))).toBe("Cuotas inválidas");
  });

  test("acepta CVC de 4 dígitos", () => {
    expect(validateCardBasic(validCard({ cvc: "1234" }))).toBeNull();
  });

  test("acepta número sin espacios si pasa Luhn", () => {
    expect(validateCardBasic(validCard({ number: "4111111111111111" }))).toBeNull();
  });
});
