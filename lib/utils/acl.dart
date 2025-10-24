import '../models/user_model.dart';

class Acl {
  static bool canManageShop(UserModel user) =>
      user.role == 'admin' || user.role == 'owner';

  static bool canAdminShops(UserModel user) => user.role == 'admin';

  static bool shopScope(UserModel user, String targetShopId) =>
      user.role == 'admin' ||
      (user.shopId != null && user.shopId == targetShopId);

  static bool canCrudInventory(UserModel user, String targetShopId) =>
      (user.role == 'owner' || user.role == 'employee') &&
      user.shopId != null &&
      user.shopId == targetShopId;

  static bool canManageUsers(UserModel user, String targetShopId) =>
      user.role == 'admin' ||
      (user.role == 'owner' &&
          user.shopId != null &&
          user.shopId == targetShopId);
}
