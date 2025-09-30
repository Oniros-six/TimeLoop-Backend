-- AlterTable
ALTER TABLE "commerces" ADD COLUMN     "logo" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "services" ALTER COLUMN "description" SET DEFAULT '';
