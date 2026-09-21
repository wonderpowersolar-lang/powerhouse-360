import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { AuthzError } from "@ph360/auth";
import type { AuthContext } from "@ph360/auth";
import { MemoryStorage } from "@ph360/documents";
import { createOrg } from "@ph360/testing";
import { uploadDocument, readDocument } from "./documents";

function ctx(memberships: AuthContext["memberships"], userId = "u-doc-test"): AuthContext {
  return { userId, email: "t@example.test", name: "Test", memberships };
}

describe("Dokument-Upload mit Berechtigung (WP-1.5-Gate)", () => {
  it("Upload speichert Blob + Metadaten mit Hash und auditiert; Roundtrip prüft Integrität", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    const weg = await createOrg("WEG");
    const storage = new MemoryStorage();
    const sales = ctx([{ organizationId: powerhouse.id, role: "SALES" }]);
    const bytes = Buffer.from("Angebot 2026 — Testinhalt");

    const document = await uploadDocument(
      sales,
      {
        organizationId: weg.id,
        fileName: "angebot-2026.pdf",
        contentType: "application/pdf",
        bytes,
      },
      storage,
    );

    expect(document.organizationId).toBe(weg.id);
    expect(document.sizeBytes).toBe(bytes.length);
    expect(document.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(document.storageKey).not.toContain("angebot"); // kein Dateiname (PII) im Key
    expect(storage.objects.has(document.storageKey)).toBe(true);

    const audit = await prisma.auditEvent.findFirst({
      where: { action: "document.uploaded", subjectId: document.id },
    });
    expect(audit?.organizationId).toBe(weg.id);
    expect(audit?.actorId).toBe("u-doc-test");

    const roundtrip = await readDocument(sales, document.id, storage);
    expect(roundtrip.bytes.equals(bytes)).toBe(true);

    // Integritätsfehler wird erkannt
    storage.objects.set(document.storageKey, {
      bytes: Buffer.from("manipuliert"),
      contentType: "application/pdf",
    });
    await expect(readDocument(sales, document.id, storage)).rejects.toThrow("Integritätsfehler");
  });

  it("verweigert Upload/Read ohne Permission (F-20); fehlgeschlagener Insert räumt den Blob auf", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    const weg = await createOrg("WEG");
    const storage = new MemoryStorage();

    await expect(
      uploadDocument(
        ctx([{ organizationId: powerhouse.id, role: "RESIDENT" }]),
        { organizationId: weg.id, fileName: "x.txt", contentType: "text/plain", bytes: Buffer.from("x") },
        storage,
      ),
    ).rejects.toBeInstanceOf(AuthzError);
    expect(storage.objects.size).toBe(0);
    expect(await prisma.document.count()).toBe(0);

    // FINANCE darf lesen? Nein — document.read hat FINANCE nicht (Matrix WP-1.5).
    await expect(
      readDocument(ctx([{ organizationId: powerhouse.id, role: "FINANCE" }]), "00000000-0000-4000-8000-000000000000", storage),
    ).rejects.toBeInstanceOf(AuthzError);

    // Metadaten-Insert schlägt fehl (kaputte Org-FK) → Blob wird zurückgeräumt
    const sales = ctx([{ organizationId: powerhouse.id, role: "SALES" }]);
    await expect(
      uploadDocument(
        sales,
        {
          organizationId: "00000000-0000-4000-8000-000000000000", // existiert nicht → FK-Fehler
          fileName: "y.txt",
          contentType: "text/plain",
          bytes: Buffer.from("y"),
        },
        storage,
      ),
    ).rejects.toThrow();
    expect(storage.objects.size).toBe(0);
  });
});
