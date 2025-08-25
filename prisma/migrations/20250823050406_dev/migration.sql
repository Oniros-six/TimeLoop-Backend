/*
  Warnings:

  - You are about to drop the column `statusId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the `statuses` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `status` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELED', 'NO_SHOW', 'COMPLETED', 'RESCHEDULED');

-- DropForeignKey
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_statusId_fkey";

-- AlterTable
ALTER TABLE "public"."bookings" DROP COLUMN "statusId",
ADD COLUMN     "status" "public"."BookingStatus" NOT NULL,
ALTER COLUMN "timeStart" SET DATA TYPE TIME,
ALTER COLUMN "timeEnd" SET DATA TYPE TIME;

-- DropTable
DROP TABLE "public"."statuses";
