# Chalet vs Caterer – different tables

Chalet and caterer use **separate tables** (no sharing).

| Feature   | Table             | Model          | Purpose                |
|----------|-------------------|----------------|------------------------|
| **Chalet**  | `chalet_bookings`  | ChaletBooking  | Chalet stay bookings   |
| **Caterer** | `catering_orders`  | CateringOrder  | Catering/food orders   |

- Chalet APIs: `POST /chalets/booking`, `GET /chalets/my-bookings` → use **chalet_bookings** only.
- Caterer APIs: `POST /caterer/orders`, `GET /caterer/orders` → use **catering_orders** only.

See `chalet_bookings.sql` for chalet table. Catering uses existing `catering_orders` (see models/CateringOrder.js).
