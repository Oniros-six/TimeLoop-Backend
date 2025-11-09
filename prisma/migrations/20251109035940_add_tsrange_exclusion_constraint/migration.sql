-- Enable btree_gist extension for range operators with equality
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add time_range column as a generated column from timeStart and timeEnd
-- Using tstzrange (timestamptz range) since our columns use timezone
ALTER TABLE bookings 
ADD COLUMN time_range tstzrange 
GENERATED ALWAYS AS (tstzrange("timeStart", "timeEnd", '[)')) STORED;

-- Create exclusion constraint to prevent overlapping bookings
-- for the same user with active statuses
-- The && operator checks if ranges overlap
ALTER TABLE bookings
ADD CONSTRAINT unique_user_booking_range
EXCLUDE USING GIST (
  "userId" WITH =,
  time_range WITH &&
)
WHERE (status IN ('PENDING', 'CONFIRMED', 'RESCHEDULED'));

-- Add comments for documentation
COMMENT ON COLUMN bookings.time_range IS 
  'Generated range from timeStart to timeEnd. Used with exclusion constraint to prevent overlapping bookings for the same user.';

COMMENT ON CONSTRAINT unique_user_booking_range ON bookings IS 
  'Prevents overlapping bookings for the same user in active statuses. Uses GIST with range overlap operator (&&).';
