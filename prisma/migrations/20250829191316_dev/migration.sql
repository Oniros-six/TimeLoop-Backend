-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('PENDING', 'SENT', 'PAID');

-- AlterEnum
ALTER TYPE "public"."EntityType" ADD VALUE 'INVOICE';

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" SERIAL NOT NULL,
    "commerceId" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "totalCanceled" INTEGER NOT NULL DEFAULT 0,
    "totalIncome" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "feePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "serviceFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Invoice_commerceId_periodStart_periodEnd_idx" ON "public"."Invoice"("commerceId", "periodStart", "periodEnd");

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_commerceId_fkey" FOREIGN KEY ("commerceId") REFERENCES "public"."commerces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
