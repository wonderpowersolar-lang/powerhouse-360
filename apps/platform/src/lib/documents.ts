import { prisma } from "@ph360/database";
import { requirePermission, recordAudit } from "@ph360/auth";
import type { AuthContext } from "@ph360/auth";
import {
  MinioStorage,
  storeDocumentContent,
  loadDocumentContent,
  type ObjectStorage,
} from "@ph360/documents";

/**
 * Dokument-Upload/-Download mit Berechtigungskontext (WP-1.5).
 * Guards laufen im POWERHOUSE-Mandanten (Plattform-Arbeit); der Datensatz
 * trägt die Organisation, zu der das Dokument fachlich gehört. Storage ist
 * injizierbar (Tests: MemoryStorage) — Default ist MinIO aus der Umgebung.
 */
let defaultStorage: ObjectStorage | null = null;
function getDefaultStorage(): ObjectStorage {
  defaultStorage ??= new MinioStorage();
  return defaultStorage;
}

export async function uploadDocument(
  ctx: AuthContext | null,
  input: {
    organizationId: string;
    projectId?: string | null;
    fileName: string;
    contentType: string;
    bytes: Buffer;
  },
  storage: ObjectStorage = getDefaultStorage(),
) {
  const powerhouseOrgId = await (await import("./org")).getPowerhouseOrgId();
  const auth = await requirePermission(ctx, "document.upload", {
    organizationId: powerhouseOrgId,
  });
  const document = await storeDocumentContent(prisma, storage, {
    ...input,
    uploaderId: auth.userId,
  });
  await recordAudit(prisma, {
    action: "document.uploaded",
    subjectType: "Document",
    subjectId: document.id,
    actorType: "USER",
    actorId: auth.userId,
    organizationId: input.organizationId,
    after: {
      fileName: document.fileName,
      contentType: document.contentType,
      sizeBytes: document.sizeBytes,
      sha256: document.sha256,
      projectId: document.projectId,
    },
  });
  return document;
}

export async function readDocument(
  ctx: AuthContext | null,
  documentId: string,
  storage: ObjectStorage = getDefaultStorage(),
) {
  const powerhouseOrgId = await (await import("./org")).getPowerhouseOrgId();
  await requirePermission(ctx, "document.read", { organizationId: powerhouseOrgId });
  return loadDocumentContent(prisma, storage, documentId);
}
