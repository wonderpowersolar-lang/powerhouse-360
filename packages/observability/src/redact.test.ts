import { describe, it, expect } from "vitest";
import { redact, redactString, REDACTED } from "./redact";

describe("Log-Redaction (Masterplan §8 Log-Hygiene)", () => {
  it("redigiert sensible Schlüssel vollständig (Token, Passwort, IBAN, SEPA)", () => {
    const out = redact({
      password: "geheim",
      accessToken: "abc",
      iban: "DE02120300000000202051",
      sepaMandateRef: "M-123",
      authorization: "Bearer xyz",
      harmless: "bleibt",
    }) as Record<string, unknown>;
    expect(out.password).toBe(REDACTED);
    expect(out.accessToken).toBe(REDACTED);
    expect(out.iban).toBe(REDACTED);
    expect(out.sepaMandateRef).toBe(REDACTED);
    expect(out.authorization).toBe(REDACTED);
    expect(out.harmless).toBe("bleibt");
  });

  it("maskiert PII-Felder partiell (E-Mail, Name, Telefon)", () => {
    const out = redact({
      email: "vera.verwalterin@example.dev",
      firstName: "Vera",
      phone: "+49 30 555",
    }) as Record<string, string>;
    expect(out.email).toBe("v***@example.dev");
    expect(out.firstName).toBe("Ve***");
    expect(out.phone).toBe("+4***");
    expect(out.email).not.toContain("vera.verwalterin");
  });

  it("findet Muster in freien Strings (IBAN, Bearer, JWT, E-Mail)", () => {
    const s = redactString(
      "Zahlung von DE02120300000000202051 mit Bearer abc.def an max@example.de via eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJlLXNpZ25hdHVyZQ",
    );
    expect(s).not.toContain("DE0212030000");
    expect(s).not.toContain("Bearer abc");
    expect(s).not.toContain("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0");
    expect(s).toContain("m***@example.de");
  });

  it("arbeitet tief und auf Arrays; Nicht-Strings bleiben unangetastet", () => {
    const out = redact({
      list: [{ token: "x" }, { note: "IBAN DE02120300000000202051" }],
      count: 3,
      when: new Date("2026-08-06T00:00:00Z"),
    }) as { list: [{ token: string }, { note: string }]; count: number; when: string };
    expect(out.list[0].token).toBe(REDACTED);
    expect(out.list[1].note).not.toContain("DE02");
    expect(out.count).toBe(3);
    expect(out.when).toBe("2026-08-06T00:00:00.000Z");
  });
});
