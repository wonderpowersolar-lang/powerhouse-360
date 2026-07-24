-- AccessScope-Shape-Garantie (Follow-up aus WP-1.3-Kern-Review, vor Guard-Integration WP-1.3-Rest):
-- genau ein Ziel-FK passend zum scopeType, keine doppelten Scopes je Org+Ziel.

ALTER TABLE "access_scope"
  ADD CONSTRAINT "access_scope_shape_check" CHECK (
    ("scopeType" = 'PROPERTY' AND "propertyId" IS NOT NULL AND "buildingId" IS NULL) OR
    ("scopeType" = 'BUILDING' AND "buildingId" IS NOT NULL AND "propertyId" IS NULL)
  );

-- Ein Scope je (Organisation, Ziel) — partiell, da je Zeile nur ein FK gesetzt ist.
CREATE UNIQUE INDEX "access_scope_organizationId_propertyId_key"
  ON "access_scope" ("organizationId", "propertyId") WHERE "propertyId" IS NOT NULL;
CREATE UNIQUE INDEX "access_scope_organizationId_buildingId_key"
  ON "access_scope" ("organizationId", "buildingId") WHERE "buildingId" IS NOT NULL;

-- FK-Indexe (Postgres indexiert FK-Spalten nicht automatisch; relevant für Kaskaden/SetNull).
CREATE INDEX "access_scope_propertyId_idx" ON "access_scope" ("propertyId");
CREATE INDEX "access_scope_buildingId_idx" ON "access_scope" ("buildingId");
CREATE INDEX "unit_entranceId_idx" ON "unit" ("entranceId");
