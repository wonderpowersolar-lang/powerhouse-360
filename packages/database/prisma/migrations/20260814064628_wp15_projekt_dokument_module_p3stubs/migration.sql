-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectPhaseStatus" AS ENUM ('PENDING', 'ACTIVE', 'DONE');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ModuleSubscriptionStatus" AS ENUM ('PLANNED', 'ACTIVE', 'SUSPENDED', 'ENDED');

-- CreateEnum
CREATE TYPE "ModuleActivationStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- AlterEnum
ALTER TYPE "AccessScopeType" ADD VALUE 'PROJECT';

-- AlterTable
ALTER TABLE "access_scope" ADD COLUMN     "projectId" UUID;

-- CreateTable
CREATE TABLE "project" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "customerId" UUID,
    "propertyId" UUID,
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_phase" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "ProjectPhaseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_milestone" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "projectId" UUID,
    "title" TEXT NOT NULL,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'OPEN',
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "projectId" UUID,
    "uploaderId" TEXT,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_subscription" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "moduleKey" "ModuleKey" NOT NULL,
    "status" "ModuleSubscriptionStatus" NOT NULL DEFAULT 'PLANNED',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_activation" (
    "id" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "propertyId" UUID,
    "buildingId" UUID,
    "status" "ModuleActivationStatus" NOT NULL DEFAULT 'PENDING',
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_activation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_configuration" (
    "id" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heat_project" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "propertyId" UUID,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "heat_project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_schedule" (
    "id" UUID NOT NULL,
    "heatProjectId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "intervalDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupancy_change" (
    "id" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "occupancy_change_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heat_statement" (
    "id" UUID NOT NULL,
    "heatProjectId" UUID NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "heat_statement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocation_key" (
    "id" UUID NOT NULL,
    "heatProjectId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allocation_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charging_project" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "propertyId" UUID,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charging_project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charge_point" (
    "id" UUID NOT NULL,
    "chargingProjectId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charge_point_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charging_session" (
    "id" UUID NOT NULL,
    "chargePointId" UUID NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "energyKwh" DECIMAL(14,3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charging_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "load_management_plan" (
    "id" UUID NOT NULL,
    "chargingProjectId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "load_management_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charging_authorization" (
    "id" UUID NOT NULL,
    "chargingProjectId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charging_authorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_case" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "chargingProjectId" UUID,
    "program" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funding_case_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_organizationId_status_idx" ON "project"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "project_organizationId_name_key" ON "project"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "project_phase_projectId_position_key" ON "project_phase"("projectId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "project_phase_projectId_label_key" ON "project_phase"("projectId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "project_milestone_projectId_label_key" ON "project_milestone"("projectId", "label");

-- CreateIndex
CREATE INDEX "work_order_organizationId_status_idx" ON "work_order"("organizationId", "status");

-- CreateIndex
CREATE INDEX "work_order_projectId_idx" ON "work_order"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "document_storageKey_key" ON "document"("storageKey");

-- CreateIndex
CREATE INDEX "document_organizationId_createdAt_idx" ON "document"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "document_projectId_idx" ON "document"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "module_subscription_organizationId_moduleKey_key" ON "module_subscription"("organizationId", "moduleKey");

-- CreateIndex
CREATE INDEX "module_activation_subscriptionId_idx" ON "module_activation"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "module_configuration_subscriptionId_version_key" ON "module_configuration"("subscriptionId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "heat_project_organizationId_name_key" ON "heat_project"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "reading_schedule_heatProjectId_label_key" ON "reading_schedule"("heatProjectId", "label");

-- CreateIndex
CREATE INDEX "occupancy_change_unitId_occurredAt_idx" ON "occupancy_change"("unitId", "occurredAt");

-- CreateIndex
CREATE INDEX "heat_statement_heatProjectId_periodStart_idx" ON "heat_statement"("heatProjectId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "allocation_key_heatProjectId_key_key" ON "allocation_key"("heatProjectId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "charging_project_organizationId_name_key" ON "charging_project"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "charge_point_chargingProjectId_label_key" ON "charge_point"("chargingProjectId", "label");

-- CreateIndex
CREATE INDEX "charging_session_chargePointId_startedAt_idx" ON "charging_session"("chargePointId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "load_management_plan_chargingProjectId_name_key" ON "load_management_plan"("chargingProjectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "charging_authorization_chargingProjectId_kind_identifier_key" ON "charging_authorization"("chargingProjectId", "kind", "identifier");

-- CreateIndex
CREATE INDEX "funding_case_organizationId_idx" ON "funding_case"("organizationId");

-- AddForeignKey
ALTER TABLE "access_scope" ADD CONSTRAINT "access_scope_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_phase" ADD CONSTRAINT "project_phase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_milestone" ADD CONSTRAINT "project_milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_subscription" ADD CONSTRAINT "module_subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_activation" ADD CONSTRAINT "module_activation_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "module_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_activation" ADD CONSTRAINT "module_activation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_activation" ADD CONSTRAINT "module_activation_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_configuration" ADD CONSTRAINT "module_configuration_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "module_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heat_project" ADD CONSTRAINT "heat_project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heat_project" ADD CONSTRAINT "heat_project_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_schedule" ADD CONSTRAINT "reading_schedule_heatProjectId_fkey" FOREIGN KEY ("heatProjectId") REFERENCES "heat_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupancy_change" ADD CONSTRAINT "occupancy_change_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heat_statement" ADD CONSTRAINT "heat_statement_heatProjectId_fkey" FOREIGN KEY ("heatProjectId") REFERENCES "heat_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_key" ADD CONSTRAINT "allocation_key_heatProjectId_fkey" FOREIGN KEY ("heatProjectId") REFERENCES "heat_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charging_project" ADD CONSTRAINT "charging_project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charging_project" ADD CONSTRAINT "charging_project_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_point" ADD CONSTRAINT "charge_point_chargingProjectId_fkey" FOREIGN KEY ("chargingProjectId") REFERENCES "charging_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charging_session" ADD CONSTRAINT "charging_session_chargePointId_fkey" FOREIGN KEY ("chargePointId") REFERENCES "charge_point"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_management_plan" ADD CONSTRAINT "load_management_plan_chargingProjectId_fkey" FOREIGN KEY ("chargingProjectId") REFERENCES "charging_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charging_authorization" ADD CONSTRAINT "charging_authorization_chargingProjectId_fkey" FOREIGN KEY ("chargingProjectId") REFERENCES "charging_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_case" ADD CONSTRAINT "funding_case_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_case" ADD CONSTRAINT "funding_case_chargingProjectId_fkey" FOREIGN KEY ("chargingProjectId") REFERENCES "charging_project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
