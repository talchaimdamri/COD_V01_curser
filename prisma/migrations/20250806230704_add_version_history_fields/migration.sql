/*
  Warnings:

  - You are about to drop the column `changeDescription` on the `DocumentVersion` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `DocumentVersion` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `DocumentVersion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[documentId,versionNumber]` on the table `DocumentVersion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `description` to the `DocumentVersion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `versionNumber` to the `DocumentVersion` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DocumentVersion_createdBy_idx";

-- DropIndex
DROP INDEX "DocumentVersion_documentId_version_key";

-- AlterTable
ALTER TABLE "DocumentVersion" DROP COLUMN "changeDescription",
DROP COLUMN "createdBy",
DROP COLUMN "version",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "isAutoSaved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentVersionId" TEXT,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "versionNumber" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "DocumentVersion_userId_idx" ON "DocumentVersion"("userId");

-- CreateIndex
CREATE INDEX "DocumentVersion_parentVersionId_idx" ON "DocumentVersion"("parentVersionId");

-- CreateIndex
CREATE INDEX "DocumentVersion_deletedAt_idx" ON "DocumentVersion"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_versionNumber_key" ON "DocumentVersion"("documentId", "versionNumber");

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
