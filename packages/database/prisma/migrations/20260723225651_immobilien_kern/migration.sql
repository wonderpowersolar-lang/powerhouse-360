-- CreateEnum
CREATE TYPE "AccessScopeType" AS ENUM ('PROPERTY', 'BUILDING');

-- CreateTable
CREATE TABLE "address" (
    "id" UUID NOT NULL,
    "street" TEXT NOT NULL,
    "houseNumber" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "addressId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrance" (
    "id" UUID NOT NULL,
    "buildingId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entrance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit" (
    "id" UUID NOT NULL,
    "buildingId" UUID NOT NULL,
    "entranceId" UUID,
    "label" TEXT NOT NULL,
    "floor" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_scope" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "scopeType" "AccessScopeType" NOT NULL,
    "propertyId" UUID,
    "buildingId" UUID,
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_scope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_organizationId_idx" ON "property"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "property_organizationId_name_key" ON "property"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "building_propertyId_name_key" ON "building"("propertyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "entrance_buildingId_label_key" ON "entrance"("buildingId", "label");

-- CreateIndex
CREATE INDEX "unit_buildingId_idx" ON "unit"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "unit_buildingId_label_key" ON "unit"("buildingId", "label");

-- CreateIndex
CREATE INDEX "access_scope_organizationId_idx" ON "access_scope"("organizationId");

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building" ADD CONSTRAINT "building_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building" ADD CONSTRAINT "building_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrance" ADD CONSTRAINT "entrance_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit" ADD CONSTRAINT "unit_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit" ADD CONSTRAINT "unit_entranceId_fkey" FOREIGN KEY ("entranceId") REFERENCES "entrance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_scope" ADD CONSTRAINT "access_scope_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_scope" ADD CONSTRAINT "access_scope_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_scope" ADD CONSTRAINT "access_scope_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "building"("id") ON DELETE CASCADE ON UPDATE CASCADE;
