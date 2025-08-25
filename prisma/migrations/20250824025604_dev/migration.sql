/*
  Warnings:

  - You are about to drop the column `timeStart` on the `bookings` table. All the data in the column will be lost.
  - Changed the type of `timeEnd` on the `bookings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."bookings" DROP COLUMN "timeStart",
DROP COLUMN "timeEnd",
ADD COLUMN     "timeEnd" TIMESTAMP(3) NOT NULL;
