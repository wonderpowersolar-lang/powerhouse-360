-- Getrennt von wp15_projekt_dokument_module_p3stubs: Postgres erlaubt die
-- Verwendung eines neuen Enum-Werts (PROJECT) nicht in derselben Transaktion
-- wie sein ALTER TYPE ... ADD VALUE.
-- WP-1.5: AccessScope-Shape-Garantie um PROJECT erweitern (Fortschreibung von
-- access_scope_shape_constraints): genau ein Ziel-FK passend zum scopeType.
ALTER TABLE "access_scope" DROP CONSTRAINT "access_scope_shape_check";
ALTER TABLE "access_scope"
  ADD CONSTRAINT "access_scope_shape_check" CHECK (
    ("scopeType" = 'PROPERTY' AND "propertyId" IS NOT NULL AND "buildingId" IS NULL AND "projectId" IS NULL) OR
    ("scopeType" = 'BUILDING' AND "buildingId" IS NOT NULL AND "propertyId" IS NULL AND "projectId" IS NULL) OR
    ("scopeType" = 'PROJECT'  AND "projectId"  IS NOT NULL AND "propertyId" IS NULL AND "buildingId" IS NULL)
  );

CREATE UNIQUE INDEX "access_scope_organizationId_projectId_key"
  ON "access_scope" ("organizationId", "projectId") WHERE "projectId" IS NOT NULL;
CREATE INDEX "access_scope_projectId_idx" ON "access_scope" ("projectId");
