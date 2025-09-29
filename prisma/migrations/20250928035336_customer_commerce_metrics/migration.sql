-- CreateTable
CREATE TABLE "CustomerCommerce" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "commerceId" INTEGER NOT NULL,
    "firstReservationAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerCommerce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerCommerce_customerId_commerceId_key" ON "CustomerCommerce"("customerId", "commerceId");

-- AddForeignKey
ALTER TABLE "CustomerCommerce" ADD CONSTRAINT "CustomerCommerce_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCommerce" ADD CONSTRAINT "CustomerCommerce_commerceId_fkey" FOREIGN KEY ("commerceId") REFERENCES "commerces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
