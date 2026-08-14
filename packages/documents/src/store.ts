import { createHash, randomUUID } from "node:crypto";
import type { PrismaClient, Document } from "@ph360/database";
import type { ObjectStorage } from "./storage";

/**
 * Dokument ablegen (WP-1.5): Inhalt in den Objektspeicher, Metadaten + Hash
 * in die `Document`-Tabelle. Der storageKey enthält bewusst KEINE Dateinamen
 * (PII) — der Name lebt nur in den Metadaten. Schlägt der Metadaten-Insert
 * fehl, wird das Objekt best-effort wieder entfernt (kein verwaister Blob mit
 * Anspruch auf Wahrheit; Restbestände räumt später ein Reaper).
 */
export async function storeDocumentContent(
  prisma: PrismaClient,
  storage: ObjectStorage,
  input: {
    organizationId: string;
    projectId?: string | null;
    uploaderId?: string | null;
    fileName: string;
    contentType: string;
    bytes: Buffer;
  },
): Promise<Document> {
  const sha256 = createHash("sha256").update(input.bytes).digest("hex");
  const storageKey = `${input.organizationId}/${randomUUID()}`;
  await storage.put(storageKey, input.bytes, input.contentType);
  try {
    return await prisma.document.create({
      data: {
        organizationId: input.organizationId,
        projectId: input.projectId ?? null,
        uploaderId: input.uploaderId ?? null,
        fileName: input.fileName,
        contentType: input.contentType,
        sizeBytes: input.bytes.length,
        sha256,
        storageKey,
      },
    });
  } catch (err) {
    await storage.delete(storageKey).catch(() => undefined);
    throw err;
  }
}

/** Inhalt zu einem Document-Datensatz laden und gegen den Hash prüfen. */
export async function loadDocumentContent(
  prisma: PrismaClient,
  storage: ObjectStorage,
  documentId: string,
): Promise<{ document: Document; bytes: Buffer }> {
  const document = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
  const bytes = await storage.get(document.storageKey);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== document.sha256) {
    throw new Error(`Integritätsfehler: Hash von ${documentId} stimmt nicht (erwartet ${document.sha256})`);
  }
  return { document, bytes };
}
