const User = require("./User");
const Boat = require("./Boat");
const BoatCategory = require("./BoatCategory");
const BoatSubCategory = require("./BoatSubCategory");
const BoatAmenity = require("./BoatAmenity");
const BoatBooking = require("./BoatBooking");
const BoatBookingTransaction = require("./BoatBookingTransaction");

const BoatBanner = require("./BoatBanner");
const BoatCoupon = require("./BoatCoupon");
const BoatParking = require("./BoatParking");
const BoatParkingBooking = require("./BoatParkingBooking");
const Seafarer = require("./Seafarer");
const SeafarerTransaction = require("./SeafarerTransaction");
const AppUserBoat = require("./AppUserBoat");
const AppUserAddress = require("./AppUserAddress");
const TransitVehicle = require("./TransitVehicle");
const TransitCarBooking = require("./TransitCarBooking");
const TransitTripBooking = require("./TransitTripBooking");
const Jet = require("./Jet");
const JetBooking = require("./JetBooking");
const EscortBooking = require("./EscortBooking");
const DeliveryOrder = require("./DeliveryOrder");
const DeliverySelectionConfig = require("./DeliverySelectionConfig");
const Chalet = require("./Chalet");
const ChaletBooking = require("./ChaletBooking");
const CateringOrder = require("./CateringOrder");
const Caterer = require("./Caterer");
const CatererMenuItem = require("./CatererMenuItem");
const AppShop = require("./AppShop");
const ShopOrder = require("./ShopOrder");
const ShopOrderItem = require("./ShopOrderItem");
const AppNotification = require("./AppNotification");

// Shop order associations
ShopOrder.hasMany(ShopOrderItem, { foreignKey: "order_id", as: "ShopOrderItems" });
ShopOrderItem.belongsTo(ShopOrder, { foreignKey: "order_id" });
ShopOrderItem.belongsTo(AppShop, { foreignKey: "item_id" });

module.exports = {
  User,
  Boat,
  BoatCategory,
  BoatSubCategory,
  BoatAmenity,
  BoatBooking,
  BoatBookingTransaction,
  BoatBanner,
  BoatCoupon,
  BoatParking,
  BoatParkingBooking,
  Seafarer,
  SeafarerTransaction,
  AppUserBoat,
  AppUserAddress,
  TransitVehicle,
  TransitCarBooking,
  TransitTripBooking,
  Jet,
  JetBooking,
  EscortBooking,
  DeliveryOrder,
  DeliverySelectionConfig,
  Chalet,
  ChaletBooking,
  CateringOrder,
  Caterer,
  CatererMenuItem,
  AppShop,
  ShopOrder,
  ShopOrderItem,
  AppNotification
};
