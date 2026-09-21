-- CreateEnum
CREATE TYPE "HandlerExecutionStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "domain_event" ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "event_handler_execution" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "handlerName" TEXT NOT NULL,
    "status" "HandlerExecutionStatus" NOT NULL DEFAULT 'RUNNING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_handler_execution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "eventId" UUID,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "recipient" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "payload" JSONB,
    "subject" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_handler_execution_status_idx" ON "event_handler_execution"("status");

-- CreateIndex
CREATE UNIQUE INDEX "event_handler_execution_eventId_handlerName_key" ON "event_handler_execution"("eventId", "handlerName");

-- CreateIndex
CREATE INDEX "notification_status_createdAt_idx" ON "notification"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_eventId_templateKey_recipient_key" ON "notification"("eventId", "templateKey", "recipient");

-- AddForeignKey
ALTER TABLE "event_handler_execution" ADD CONSTRAINT "event_handler_execution_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "domain_event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "domain_event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
