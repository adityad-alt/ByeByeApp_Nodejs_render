-- Add product/addon name to boat_booking_addons (optional, for display in app).
ALTER TABLE boat_booking_addons
  ADD COLUMN name VARCHAR(255) NULL;
