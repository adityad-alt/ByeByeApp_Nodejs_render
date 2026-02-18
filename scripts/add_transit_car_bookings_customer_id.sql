-- Add customer_id to transit_car_bookings (same pattern as boat_bookings.customer_id).
-- Run in MySQL: mysql -u USER -p DB_NAME < scripts/add_transit_car_bookings_customer_id.sql

ALTER TABLE transit_car_bookings
  ADD COLUMN customer_id INT NULL COMMENT 'Logged-in user id (app_user.id); used for my-bookings'
  AFTER vehicle_number;
