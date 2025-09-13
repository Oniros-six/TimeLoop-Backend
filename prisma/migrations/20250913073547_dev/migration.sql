/*
  Warnings:

  - The values [EntrenamientoPersonal,Fotografia,Tatuajes,Otros] on the enum `BusinessCategory` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `closeTime` on the `commerce_configs` table. All the data in the column will be lost.
  - You are about to drop the column `openTime` on the `commerce_configs` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('MERCADO_PAGO', 'CASH');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('pending', 'approved', 'rejected', 'refunded');

-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('UYU', 'USD', 'EUR');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."BusinessCategory_new" AS ENUM ('Peluqueria', 'Barberia', 'Estetica', 'Spa', 'Salon', 'Masajes', 'Otro');
ALTER TABLE "public"."commerces" ALTER COLUMN "businessCategory" TYPE "public"."BusinessCategory_new" USING ("businessCategory"::text::"public"."BusinessCategory_new");
ALTER TYPE "public"."BusinessCategory" RENAME TO "BusinessCategory_old";
ALTER TYPE "public"."BusinessCategory_new" RENAME TO "BusinessCategory";
DROP TYPE "public"."BusinessCategory_old";
COMMIT;

-- AlterEnum
ALTER TYPE "public"."EntityType" ADD VALUE 'PAYMENT';

-- AlterTable
ALTER TABLE "public"."commerce_configs" DROP COLUMN "closeTime",
DROP COLUMN "openTime",
ADD COLUMN     "acceptedPaymentMethods" "public"."PaymentMethod"[];

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "commerceId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "public"."Currency" NOT NULL DEFAULT 'UYU',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'pending',
    "method" "public"."PaymentMethod" NOT NULL,
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MercadoPago" (
    "id" SERIAL NOT NULL,
    "commerceId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "publicKey" TEXT,
    "mpUserId" TEXT NOT NULL,
    "tokenExpires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MercadoPago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "public"."Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_commerceId_idx" ON "public"."Payment"("commerceId");

-- CreateIndex
CREATE UNIQUE INDEX "MercadoPago_commerceId_key" ON "public"."MercadoPago"("commerceId");

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_commerceId_fkey" FOREIGN KEY ("commerceId") REFERENCES "public"."commerces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
