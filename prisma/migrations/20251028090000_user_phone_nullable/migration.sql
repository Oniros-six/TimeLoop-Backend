/*
  Change: Make users.phone nullable with default NULL (implicit in PostgreSQL)
*/

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;


