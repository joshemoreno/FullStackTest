/// <reference types="vitest/globals" />

import {
  sanitizeCardNumber,
  formatCardNumber,
  detectBrand,
  luhnCheck,
  isValidExp,
  isValidCvc,
  isValidCardHolder,
} from "../cardUtils";

describe("cardUtils", () => {
  describe("sanitizeCardNumber", () => {
    test("elimina todo lo que no sea dígito", () => {
      expect(sanitizeCardNumber("4111 1111-1111.1111")).toBe("4111111111111111");
      expect(sanitizeCardNumber("  12ab34 ")).toBe("1234");
      expect(sanitizeCardNumber("")).toBe("");
    });
  });

  describe("formatCardNumber", () => {
    test("agrupa en bloques de 4 con espacios", () => {
      expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
      expect(formatCardNumber("4111 1111 1111 1111")).toBe("4111 1111 1111 1111");
    });

    test("corta a máximo 19 dígitos (con formato)", () => {
      const raw = "1234567890123456789012345";
      expect(formatCardNumber(raw)).toBe("1234 5678 9012 3456 789");
    });

    test("si hay menos de 4 dígitos no agrega espacios", () => {
      expect(formatCardNumber("1")).toBe("1");
      expect(formatCardNumber("12")).toBe("12");
      expect(formatCardNumber("123")).toBe("123");
    });
  });

  describe("detectBrand", () => {
    test("VISA si empieza por 4", () => {
      expect(detectBrand("4")).toBe("VISA");
      expect(detectBrand("4111 1111 1111 1111")).toBe("VISA");
    });

    test("MASTERCARD por rango 51-55", () => {
      expect(detectBrand("51")).toBe("MASTERCARD");
      expect(detectBrand("55 1234 0000 0000 0000")).toBe("MASTERCARD");
      expect(detectBrand("50 1234")).toBe("UNKNOWN");
      expect(detectBrand("56 1234")).toBe("UNKNOWN");
    });

    test("MASTERCARD por rango 2221-2720", () => {
      expect(detectBrand("2221")).toBe("MASTERCARD");
      expect(detectBrand("2720 1234 0000 0000 0000")).toBe("MASTERCARD");
      expect(detectBrand("2220 1234")).toBe("UNKNOWN");
      expect(detectBrand("2721 1234")).toBe("UNKNOWN");
    });

    test("UNKNOWN si no coincide", () => {
      expect(detectBrand("")).toBe("UNKNOWN");
      expect(detectBrand("3")).toBe("UNKNOWN");
      expect(detectBrand("6011 0000 0000 0004")).toBe("UNKNOWN");
    });
  });

  describe("luhnCheck", () => {
    test("false si tiene menos de 12 dígitos", () => {
      expect(luhnCheck("41111111111")).toBe(false);
      expect(luhnCheck("123")).toBe(false);
    });

    test("valida números correctos (Luhn)", () => {
      expect(luhnCheck("4111 1111 1111 1111")).toBe(true);
      expect(luhnCheck("5555 5555 5555 4444")).toBe(true);
    });

    test("rechaza números incorrectos (Luhn)", () => {
      expect(luhnCheck("4111 1111 1111 1112")).toBe(false);
      expect(luhnCheck("5555 5555 5555 4445")).toBe(false);
    });

    test("ignora no dígitos (usa sanitize)", () => {
      expect(luhnCheck("4111-1111-1111-1111")).toBe(true);
    });
  });

  describe("isValidExp", () => {
    test("false si formato no es MM/YY de 2 dígitos", () => {
      expect(isValidExp("1", "25")).toBe(false);
      expect(isValidExp("01", "5")).toBe(false);
      expect(isValidExp("ab", "cd")).toBe(false);
    });

    test("false si el mes no está entre 01 y 12", () => {
      expect(isValidExp("00", "25")).toBe(false);
      expect(isValidExp("13", "25")).toBe(false);
    });

    test("true para una fecha claramente futura", () => {
      expect(isValidExp("12", "99")).toBe(true);
    });

    test("false para una fecha claramente pasada", () => {
      expect(isValidExp("01", "00")).toBe(false);
    });
  });

  describe("isValidCvc", () => {
    test("VISA/MASTERCARD requieren 3 dígitos", () => {
      expect(isValidCvc("123", "VISA")).toBe(true);
      expect(isValidCvc("12", "VISA")).toBe(false);
      expect(isValidCvc("1234", "VISA")).toBe(false);

      expect(isValidCvc("999", "MASTERCARD")).toBe(true);
      expect(isValidCvc("9999", "MASTERCARD")).toBe(false);
    });

    test("UNKNOWN permite 3 o 4 dígitos", () => {
      expect(isValidCvc("123", "UNKNOWN")).toBe(true);
      expect(isValidCvc("1234", "UNKNOWN")).toBe(true);
      expect(isValidCvc("12", "UNKNOWN")).toBe(false);
      expect(isValidCvc("12345", "UNKNOWN")).toBe(false);
    });

    test("ignora no dígitos", () => {
      expect(isValidCvc("1-2-3", "VISA")).toBe(true);
      expect(isValidCvc("12-34", "UNKNOWN")).toBe(true);
    });
  });

  describe("isValidCardHolder", () => {
    test("requiere al menos 3 caracteres (trim)", () => {
      expect(isValidCardHolder("Jo")).toBe(false);
      expect(isValidCardHolder("  Jo  ")).toBe(false);
      expect(isValidCardHolder("  Jose ")).toBe(true);
      expect(isValidCardHolder("   ")).toBe(false);
    });
  });
});
