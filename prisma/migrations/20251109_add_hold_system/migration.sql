-- Migration: Add HOLD system for temporary reservations
-- Date: 2024-11-09
-- Description: Adds HOLD status, expiresAt column, and updates exclusion constraint

-- 1. Add HOLD status to BookingStatus enum
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'HOLD';

-- 2. Add expiresAt column for temporary holds (15 minutes expiration)
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMPTZ;

-- 3. Create index for efficient cleanup of expired holds
CREATE INDEX IF NOT EXISTS "bookings_expiresAt_idx" ON "bookings"("expiresAt");

-- 4. Update exclusion constraint to include HOLD status
-- This ensures that HOLD reservations also prevent overlapping bookings
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "unique_user_booking_range";

ALTER TABLE "bookings" ADD CONSTRAINT "unique_user_booking_range" 
  EXCLUDE USING GIST ("userId" WITH =, time_range WITH &&) 
  WHERE (status IN ('HOLD', 'PENDING', 'CONFIRMED', 'RESCHEDULED'));

-- Comments for documentation
COMMENT ON COLUMN "bookings"."expiresAt" IS 'Expiration timestamp for HOLD status bookings. NULL for permanent bookings.';
COMMENT ON INDEX "bookings_expiresAt_idx" IS 'Index for efficient cleanup of expired hold bookings by cron job.';

