-- CreateTable
CREATE TABLE "public"."BookingHistory" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "commerceId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "priceAtBooking" DOUBLE PRECISION NOT NULL,
    "durationAtBooking" INTEGER NOT NULL,
    "timeStart" TIMESTAMP(3) NOT NULL,
    "timeEnd" TIMESTAMP(3) NOT NULL,
    "status" "public"."BookingStatus" NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "BookingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingHistory_bookingId_key" ON "public"."BookingHistory"("bookingId");
