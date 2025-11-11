-- Migration: Update booking exclusion constraint to include HOLD status
-- This migration debe ejecutarse después de agregar el nuevo valor HOLD al enum.

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS unique_user_booking_range;

ALTER TABLE bookings
ADD CONSTRAINT unique_user_booking_range
EXCLUDE USING GIST (
  "userId" WITH =,
  time_range WITH &&
)
WHERE (
  status IN ('HOLD', 'PENDING', 'CONFIRMED', 'RESCHEDULED')
);

COMMENT ON CONSTRAINT unique_user_booking_range ON bookings IS
  'Previene reservas superpuestas para el mismo usuario en estados activos (incluido HOLD).';


