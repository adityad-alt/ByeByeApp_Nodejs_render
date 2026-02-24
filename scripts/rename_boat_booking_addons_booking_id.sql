-- Rename boat_booking_addons.booking_transaction_id -> booking_id
-- Uses app_boat_booking_transactions.id as the referenced "booking id".

-- 1) If you have a foreign key, find its name then drop it (replace <FK_NAME>):
--    SHOW CREATE TABLE boat_booking_addons;
--    ALTER TABLE boat_booking_addons DROP FOREIGN KEY <FK_NAME>;

-- 2) Rename column (run this in all cases):
ALTER TABLE boat_booking_addons
  CHANGE COLUMN booking_transaction_id booking_id BIGINT NOT NULL;

-- 3) Re-add foreign key if you dropped one in step 1:
-- ALTER TABLE boat_booking_addons
--   ADD CONSTRAINT fk_boat_booking_addons_booking
--   FOREIGN KEY (booking_id) REFERENCES app_boat_booking_transactions(id) ON DELETE CASCADE;
