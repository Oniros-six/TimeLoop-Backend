/*
  Warnings:

  - You are about to drop the `BookingHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BookingHistory" DROP CONSTRAINT "BookingHistory_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "BookingHistory" DROP CONSTRAINT "BookingHistory_customerId_fkey";

-- DropTable
DROP TABLE "BookingHistory";

-- CreateTable
CREATE TABLE "booking_histories" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "commerceId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "priceAtBooking" DOUBLE PRECISION NOT NULL,
    "durationAtBooking" INTEGER NOT NULL,
    "timeStart" TIMESTAMP(3) NOT NULL,
    "timeEnd" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "booking_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "booking_histories_bookingId_key" ON "booking_histories"("bookingId");

-- AddForeignKey
ALTER TABLE "booking_histories" ADD CONSTRAINT "booking_histories_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_histories" ADD CONSTRAINT "booking_histories_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_histories" ADD CONSTRAINT "booking_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
