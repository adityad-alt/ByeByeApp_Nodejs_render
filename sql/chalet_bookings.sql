-- CHALET ONLY (not for caterer). Caterer uses catering_orders table.
-- Create chalet_bookings table for chalet reservation API
-- Run this in your MySQL/MariaDB client (adjust DB name if needed)

CREATE TABLE IF NOT EXISTS chalet_bookings (
  id BIGINT NOT NULL AUTO_INCREMENT,
  chalet_id INT NOT NULL,
  customer_id INT NULL,
  check_in_date DATE NULL,
  check_out_date DATE NULL,
  guest_name VARCHAR(255) NULL,
  contact_number VARCHAR(50) NULL,
  email_id VARCHAR(255) NULL,
  total_amount DECIMAL(10, 2) NULL,
  booking_status VARCHAR(30) NULL DEFAULT 'booked',
  notes TEXT NULL,
  created_at DATETIME NULL,
  PRIMARY KEY (id),
  INDEX idx_chalet_bookings_customer_id (customer_id),
  INDEX idx_chalet_bookings_chalet_id (chalet_id),
  INDEX idx_chalet_bookings_check_in (check_in_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
