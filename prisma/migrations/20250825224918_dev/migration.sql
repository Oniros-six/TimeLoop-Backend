/*
  Warnings:

  - The primary key for the `booking_services` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `serviceId` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."booking_services" DROP CONSTRAINT "booking_services_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "booking_services_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."bookings" DROP COLUMN "serviceId";

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
