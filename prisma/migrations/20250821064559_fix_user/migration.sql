/*
  Warnings:

  - You are about to drop the column `roleId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `role` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Roles" AS ENUM ('ADMIN', 'EMPLOYEE');

-- DropForeignKey
ALTER TABLE "public"."role_permissions" DROP CONSTRAINT "role_permissions_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."role_permissions" DROP CONSTRAINT "role_permissions_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_roleId_fkey";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "roleId",
ADD COLUMN     "role" "public"."Roles" NOT NULL;

-- DropTable
DROP TABLE "public"."permissions";

-- DropTable
DROP TABLE "public"."role_permissions";

-- DropTable
DROP TABLE "public"."roles";
