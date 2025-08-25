/*
  Warnings:

  - You are about to drop the column `commerceId` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `internalNote` on the `customers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bookingId]` on the table `reminders` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."customers" DROP CONSTRAINT "customers_commerceId_fkey";

-- AlterTable
ALTER TABLE "public"."customers" DROP COLUMN "commerceId",
DROP COLUMN "internalNote";

-- CreateIndex
CREATE UNIQUE INDEX "reminders_bookingId_key" ON "public"."reminders"("bookingId");
