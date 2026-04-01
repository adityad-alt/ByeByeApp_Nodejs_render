const User = require("./User");
const Boat = require("./Boat");
const BoatCategory = require("./BoatCategory");
const BoatSubCategory = require("./BoatSubCategory");
const BoatAmenity = require("./BoatAmenity");
const BoatBookingTransaction = require("./BoatBookingTransaction");

const BoatBanner = require("./advertisement_banners");
const BoatParking = require("./BoatParking");
const BoatParkingBooking = require("./BoatParkingBooking");
const Seafarer = require("./Seafarer");
const SeafarerTransaction = require("./SeafarerTransaction");
const SeafarerJob = require("./SeafarerJob");
const AppUserBoat = require("./AppUserBoat");
const AppUserAddress = require("./AppUserAddress");
const TransitVehicle = require("./TransitVehicle");
const TransitCarBooking = require("./TransitCarBooking");
const TransitTripBooking = require("./TransitTripBooking");
const Jet = require("./Jet");
const JetBooking = require("./JetBooking");
const EscortBooking = require("./EscortBooking");
const DeliveryOrder = require("./DeliveryOrder");
const GlobalgoLocalShipment = require("./GlobalgoLocalShipment");
const GlobalgoSeaCargoShipment = require("./GlobalgoSeaCargoShipment");
const GlobalgoInternationalShipment = require("./GlobalgoInternationalShipment");
const GlobalgoCarShipment = require("./GlobalgoCarShipment");
const Chalet = require("./Chalet");
const ChaletBooking = require("./ChaletBooking");
const ChaletReview = require("./ChaletReview");
const CateringOrder = require("./CateringOrder");
const Caterer = require("./Caterer");
const CatererMenuItem = require("./CatererMenuItem");
const AppShop = require("./AppShop");
const ShopOrder = require("./ShopOrder");
const ShopOrderItem = require("./ShopOrderItem");
const AppNotification = require("./AppNotification");
const ChaletIntroBanner = require("./ChaletIntroBanner");
const EcommerceIntroBanner = require("./EcommerceIntroBanner");
const BoatAddonItem = require("./BoatAddonItem");
const BoatSpecialPackage = require("./BoatSpecialPackage");
const BoatProduct = require("./BoatProduct");
const BoatAddonRestaurant = require("./BoatAddonRestaurant");
const BoatAddonRestaurantCategory = require("./BoatAddonRestaurantCategory");
const BluewaveAddonRestaurant = require("./BluewaveAddonRestaurant");
const BluewaveAddMenu = require("./BluewaveAddMenu");
const ChaletAddonItem = require("./ChaletAddonItem");
const ChaletSpecialPackage = require("./ChaletSpecialPackage");
const ChaletAddonRestaurant = require("./ChaletAddonRestaurant");
const ChaletAddonRestaurantCategory = require("./ChaletAddonRestaurantCategory");
const ChaletAddMenu = require("./ChaletAddMenu");
const ChaletCategory = require("./ChaletCategory");
const ChaletSubCategory = require("./ChaletSubCategory");
const BoatProductCategory = require("./BoatProductCategory");
const BoatBookingAddon = require("./BoatBookingAddon");
const BoatDestination = require("./BoatDestination");
const BluewavePolicy = require("./BluewavePolicy");
const BYEFeedback = require("./BYEFeedback");
const AboutUs = require("./AboutUs");
const GlobalgoTripVehicle = require("./GlobalgoTripVehicle");

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
  BoatBookingTransaction,
  BoatBanner,
  BoatParking,
  BoatParkingBooking,
  Seafarer,
  SeafarerTransaction,
  SeafarerJob,
  AppUserBoat,
  AppUserAddress,
  TransitVehicle,
  TransitCarBooking,
  TransitTripBooking,
  Jet,
  JetBooking,
  EscortBooking,
  DeliveryOrder,
  GlobalgoLocalShipment,
  GlobalgoSeaCargoShipment,
  GlobalgoInternationalShipment,
  GlobalgoCarShipment,
  Chalet,
  ChaletBooking,
  ChaletReview,
  CateringOrder,
  Caterer,
  CatererMenuItem,
  AppShop,
  ShopOrder,
  ShopOrderItem,
  AppNotification,
  BoatAddonItem,
  BoatSpecialPackage,
  BoatProduct,
  BoatAddonRestaurant,
  BoatAddonRestaurantCategory,
  BluewaveAddonRestaurant,
  BluewaveAddMenu,
  BoatProductCategory,
  BoatBookingAddon,
  BoatDestination,
  ChaletIntroBanner,
  EcommerceIntroBanner,
  ChaletAddonItem,
  ChaletSpecialPackage,
  ChaletAddonRestaurant,
  ChaletAddonRestaurantCategory,
  ChaletAddMenu,
  ChaletCategory,
  ChaletSubCategory,
  BluewavePolicy,
  BYEFeedback,
  AboutUs,
  GlobalgoTripVehicle
};
