/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vitest/globals" />

import { describe, test, expect, vi, beforeEach } from "vitest";

import {
  validateCustomer,
  validateDelivery,
  validateCard,
  hasErrors,
} from "../checkoutValidation";

import * as cardUtils from "../cardUtils";

vi.mock("../cardUtils", () => ({
  detectBrand: vi.fn(),
  luhnCheck: vi.fn(),
  isValidCvc: vi.fn(),
  isValidExp: vi.fn(),
  isValidCardHolder: vi.fn(),
}));

const detectBrand = vi.mocked(cardUtils.detectBrand);
const luhnCheck = vi.mocked(cardUtils.luhnCheck);
const isValidCvc = vi.mocked(cardUtils.isValidCvc);
const isValidExp = vi.mocked(cardUtils.isValidExp);
const isValidCardHolder = vi.mocked(cardUtils.isValidCardHolder);

beforeEach(() => {
  vi.clearAllMocks();

  detectBrand.mockReturnValue("VISA");
  luhnCheck.mockReturnValue(true);
  isValidCvc.mockReturnValue(true);
  isValidExp.mockReturnValue(true);
  isValidCardHolder.mockReturnValue(true);
});

describe("validateCustomer", () => {
  test("retorna errores cuando faltan campos requeridos", () => {
    const e = validateCustomer({
      fullName: "   ",
      email: " ",
      phone: "",
      legalId: "",
      legalIdType: "",
    } as any);

    expect(e.fullName).toBe("Full name is required");
    expect(e.email).toBe("Email is required");
    expect(e.phone).toBe("Phone is required");
    expect(e.legalId).toBe("Legal ID is required");
    expect(e.legalIdType).toBe("Legal ID type is required");
  });

  test("valida formato de email", () => {
    const e = validateCustomer({
      fullName: "Jose",
      email: "not-an-email",
      phone: "300",
      legalId: "123",
      legalIdType: "CC",
    } as any);

    expect(e.email).toBe("Invalid email");
  });

  test("sin errores cuando todo está correcto", () => {
    const e = validateCustomer({
      fullName: "Jose Moreno",
      email: "jose@test.com",
      phone: "3000000000",
      legalId: "123",
      legalIdType: "CC",
    } as any);

    expect(e).toEqual({});
  });
});

describe("validateDelivery", () => {
  test("retorna errores cuando faltan requeridos", () => {
    const e = validateDelivery({
      addressLine1: " ",
      city: "",
      region: " ",
      country: "",
    } as any);

    expect(e.addressLine1).toBe("Address line 1 is required");
    expect(e.city).toBe("City is required");
    expect(e.region).toBe("Region is required");
    expect(e.country).toBe("Country is required");
  });

  test("sin errores cuando todo está correcto", () => {
    const e = validateDelivery({
      addressLine1: "Calle 1",
      city: "Cali",
      region: "Valle",
      country: "CO",
    } as any);

    expect(e).toEqual({});
  });
});

describe("validateCard", () => {
  function baseCard(overrides: Partial<any> = {}) {
    return {
      card_holder: "Jose Moreno",
      number: "4111111111111111",
      exp_month: "12",
      exp_year: "30",
      cvc: "123",
      installments: 1,
      ...overrides,
    };
  }

  test("retorna brand desde detectBrand", () => {
    detectBrand.mockReturnValue("MASTERCARD");
    const res = validateCard(baseCard());
    expect(res.brand).toBe("MASTERCARD");
  });

  test("card_holder inválido => error card_holder", () => {
    isValidCardHolder.mockReturnValue(false);

    const { errors } = validateCard(baseCard());
    expect(errors.card_holder).toBe("Card holder is required");
  });

  test("number vacío => 'Card number is required'", () => {
    const { errors } = validateCard(baseCard({ number: "   " }));
    expect(errors.number).toBe("Card number is required");
  });

  test("brand UNKNOWN => 'Only VISA or MasterCard supported'", () => {
    detectBrand.mockReturnValue("UNKNOWN");

    const { errors } = validateCard(baseCard({ number: "6011000000000004" }));
    expect(errors.number).toBe("Only VISA or MasterCard supported");
    expect(luhnCheck).not.toHaveBeenCalled();
  });

  test("brand válido pero luhn falla => 'Invalid card number'", () => {
    detectBrand.mockReturnValue("VISA");
    luhnCheck.mockReturnValue(false);

    const { errors } = validateCard(baseCard());
    expect(errors.number).toBe("Invalid card number");
  });

  test("exp inválida => error exp", () => {
    isValidExp.mockReturnValue(false);

    const { errors } = validateCard(baseCard({ exp_month: "00", exp_year: "00" }));
    expect(errors.exp).toBe("Invalid expiry (MM/YY)");
  });

  test("cvc inválido => error cvc", () => {
    isValidCvc.mockReturnValue(false);

    const { errors } = validateCard(baseCard({ cvc: "12" }));
    expect(errors.cvc).toBe("Invalid CVC");
  });

  test("installments inválido (no finito) => error installments", () => {
    const { errors } = validateCard(baseCard({ installments: NaN }));
    expect(errors.installments).toBe("Invalid installments");
  });

  test("installments inválido (<1) => error installments", () => {
    const { errors } = validateCard(baseCard({ installments: 0 }));
    expect(errors.installments).toBe("Invalid installments");
  });

  test("todo OK => errors vacío", () => {
    const { errors } = validateCard(baseCard());
    expect(errors).toEqual({});
  });

  test("llama cardUtils con los valores correctos", () => {
    const card = baseCard({ number: "4111 1111 1111 1111", cvc: "123" });

    validateCard(card);

    expect(detectBrand).toHaveBeenCalledWith(card.number);
    expect(luhnCheck).toHaveBeenCalledWith(card.number);
    expect(isValidExp).toHaveBeenCalledWith(card.exp_month, card.exp_year);
    expect(isValidCvc).toHaveBeenCalledWith(card.cvc, "VISA");
    expect(isValidCardHolder).toHaveBeenCalledWith(card.card_holder);
  });
});

describe("hasErrors", () => {
  test("false si no hay keys", () => {
    expect(hasErrors({})).toBe(false);
  });

  test("true si hay al menos 1 error", () => {
    expect(hasErrors({ email: "Invalid email" })).toBe(true);
  });
});
