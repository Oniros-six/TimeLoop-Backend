-- CreateEnum
CREATE TYPE "public"."BusinessCategory" AS ENUM ('Peluqueria', 'Barberia', 'Estetica', 'EntrenamientoPersonal', 'Spa', 'Fotografia', 'Tatuajes', 'Otros');

-- CreateEnum
CREATE TYPE "public"."AvailabilityType" AS ENUM ('full', 'half', 'off');

-- CreateEnum
CREATE TYPE "public"."ReminderChannel" AS ENUM ('email', 'whatsapp', 'sms');

-- CreateEnum
CREATE TYPE "public"."ReminderStatus" AS ENUM ('pending', 'sent', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "public"."EntityType" AS ENUM ('BOOKING', 'CUSTOMER', 'USER', 'COMMERCE', 'SERVICE', 'USER_CONFIG', 'COMMERCE_CONFIG', 'USER_WORKING_OVERRIDE', 'COMMERCE_WORKING_OVERRIDE', 'USER_WORKING_PATTERN', 'COMMERCE_WORKING_PATTERN');

-- CreateEnum
CREATE TYPE "public"."ChangeType" AS ENUM ('CREATED', 'UPDATED', 'CANCELLED', 'SUSPENDED', 'REINSTATED');

-- CreateTable
CREATE TABLE "public"."commerces" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "businessCategory" "public"."BusinessCategory" NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "commerces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "internalNote" TEXT NOT NULL,
    "commerceId" INTEGER NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bookings" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeStart" TIMESTAMP(3) NOT NULL,
    "timeEnd" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "statusId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "commerceId" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "commerceId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reminders" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "commerceId" INTEGER NOT NULL,
    "channel" "public"."ReminderChannel" NOT NULL,
    "status" "public"."ReminderStatus" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."commerce_configs" (
    "id" SERIAL NOT NULL,
    "commerceId" INTEGER NOT NULL,
    "standardDurationMinutes" INTEGER NOT NULL,
    "allowCancel" BOOLEAN NOT NULL,
    "allowReschedule" BOOLEAN NOT NULL,
    "allowNotifications" BOOLEAN NOT NULL,
    "openTime" TIMESTAMP(3) NOT NULL,
    "closeTime" TIMESTAMP(3) NOT NULL,
    "welcomeMessage" TEXT NOT NULL,

    CONSTRAINT "commerce_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_configs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "darkMode" BOOLEAN NOT NULL,
    "reminder" BOOLEAN NOT NULL,
    "reminderFrequency" INTEGER NOT NULL,

    CONSTRAINT "user_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_working_patterns" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "weekday" INTEGER NOT NULL,
    "availabilityType" "public"."AvailabilityType" NOT NULL,
    "morningStart" TIMESTAMP(3),
    "morningEnd" TIMESTAMP(3),
    "afternoonStart" TIMESTAMP(3),
    "afternoonEnd" TIMESTAMP(3),

    CONSTRAINT "user_working_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_working_overrides" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "overrideType" "public"."AvailabilityType" NOT NULL,
    "morningStart" TIMESTAMP(3),
    "morningEnd" TIMESTAMP(3),
    "afternoonStart" TIMESTAMP(3),
    "afternoonEnd" TIMESTAMP(3),
    "notes" TEXT NOT NULL,

    CONSTRAINT "user_working_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."commerce_working_patterns" (
    "id" SERIAL NOT NULL,
    "commerceId" INTEGER NOT NULL,
    "weekday" INTEGER NOT NULL,
    "availabilityType" "public"."AvailabilityType" NOT NULL,
    "morningStart" TIMESTAMP(3),
    "morningEnd" TIMESTAMP(3),
    "afternoonStart" TIMESTAMP(3),
    "afternoonEnd" TIMESTAMP(3),

    CONSTRAINT "commerce_working_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."commerce_working_overrides" (
    "id" SERIAL NOT NULL,
    "commerceId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "overrideType" "public"."AvailabilityType" NOT NULL,
    "morningStart" TIMESTAMP(3),
    "morningEnd" TIMESTAMP(3),
    "afternoonStart" TIMESTAMP(3),
    "afternoonEnd" TIMESTAMP(3),
    "notes" TEXT NOT NULL,

    CONSTRAINT "commerce_working_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" SERIAL NOT NULL,
    "entityId" INTEGER NOT NULL,
    "userId" INTEGER,
    "commerceId" INTEGER,
    "customerId" INTEGER,
    "entityType" "public"."EntityType" NOT NULL,
    "changeType" "public"."ChangeType" NOT NULL,
    "detail" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "commerceId" INTEGER NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."statuses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."booking_services" (
    "bookingId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "booking_services_pkey" PRIMARY KEY ("bookingId","serviceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_configs_commerceId_key" ON "public"."commerce_configs"("commerceId");

-- CreateIndex
CREATE UNIQUE INDEX "user_configs_userId_key" ON "public"."user_configs"("userId");

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_commerceId_fkey" FOREIGN KEY ("commerceId") REFERENCES "public"."commerces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_commerceId_fkey" FOREIGN KEY ("commerceId") REFERENCES "public"."commerces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_commerceId_fkey" FOREIGN KEY ("commerceId") REFERENCES "public"."commerces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminders" ADD CONSTRAINT "reminders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminders" ADD CONSTRAINT "reminders_commerceId_fkey" FOREIGN KEY ("commerceId") REFERENCES "public"."commerces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commerce_configs" ADD CONSTRAINT "commerce_configs_commerceId_fkey" FOREIGN KEY ("commerceId") REFERENCES "public"."commerces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_configs" ADD CONSTRAINT "user_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_working_patterns" ADD CONSTRAINT "user_working_patterns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_working_overrides" ADD CONSTRAINT "user_working_overrides_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commerce_working_patterns" ADD CONSTRAINT "commerce_working_patterns_commerceId_fkey" FOREIGN KEY ("commerceId") REFERENCES "public"."commerces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commerce_working_overrides" ADD CONSTRAINT "commerce_working_overrides_commerceId_fkey" FOREIGN KEY ("commerceId") REFERENCES "public"."commerces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_commerceId_fkey" FOREIGN KEY ("commerceId") REFERENCES "public"."commerces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_commerceId_fkey" FOREIGN KEY ("commerceId") REFERENCES "public"."commerces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_services" ADD CONSTRAINT "booking_services_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_services" ADD CONSTRAINT "booking_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
