/*
  Warnings:

  - You are about to drop the column `time_range` on the `bookings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uniqueName]` on the table `commerces` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uniqueName` to the `commerces` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "time_range",
ADD COLUMN     "timeRange" tstzrange;

-- AlterTable
ALTER TABLE "commerces" ADD COLUMN     "uniqueName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "commerces_uniqueName_key" ON "commerces"("uniqueName");
