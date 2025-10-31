import 'package:cloud_firestore/cloud_firestore.dart';

import 'package:kaportapp/core/models/user_model.dart';

class UserService {
  UserService({FirebaseFirestore? firestore})
    : _firestore = firestore ?? FirebaseFirestore.instance,
      _collection = (firestore ?? FirebaseFirestore.instance).collection(
        'users',
      );

  final FirebaseFirestore _firestore;
  final CollectionReference<Map<String, dynamic>> _collection;

  Future<void> addItem(UserModel model) async {
    try {
      await _collection
          .doc(model.id)
          .set(model.toMap(), SetOptions(merge: true));
    } on FirebaseException catch (exception) {
      throw UserServiceException(
        'Kullanıcı eklenemedi: ${exception.message ?? exception.code}',
      );
    }
  }

  Future<void> updateItem(String id, Map<String, dynamic> data) async {
    try {
      final payload = Map<String, dynamic>.from(data)
        ..['updatedAt'] = FieldValue.serverTimestamp();
      await _collection.doc(id).update(payload);
    } on FirebaseException catch (exception) {
      throw UserServiceException(
        'Kullanıcı güncellenemedi: ${exception.message ?? exception.code}',
      );
    }
  }

  Future<void> deleteItem(String id) async {
    try {
      await _collection.doc(id).delete();
    } on FirebaseException catch (exception) {
      throw UserServiceException(
        'Kullanıcı silinemedi: ${exception.message ?? exception.code}',
      );
    }
  }

  Stream<List<UserModel>> getUsersByRole(List<String?> roles) {
    final roleSet = roles.toSet();
    final includeNull = roleSet.contains(null);
    final allowedRoles = roleSet.whereType<String>().toSet();

    return _collection.snapshots().map((snapshot) {
      return snapshot.docs
          .map((doc) => UserModel.fromDoc(doc.id, doc.data()))
          .where((user) {
            final role = user.role;
            if (role == null || role.isEmpty) {
              return includeNull;
            }
            return allowedRoles.contains(role);
          })
          .toList(growable: false);
    });
  }

  Stream<List<UserModel>> watchUsersByShop(String? shopId) {
    Query<Map<String, dynamic>> query = _collection;
    if (shopId == null) {
      query = query.where('shopId', isNull: true);
    } else {
      query = query.where('shopId', isEqualTo: shopId);
    }

    return query.snapshots().map(
      (snapshot) => snapshot.docs
          .map((doc) => UserModel.fromDoc(doc.id, doc.data()))
          .toList(growable: false),
    );
  }

  Future<void> assignUserRole(String uid, String? role, String? shopId) async {
    try {
      await _firestore.runTransaction((transaction) async {
        final docRef = _collection.doc(uid);
        final snapshot = await transaction.get(docRef);
        if (!snapshot.exists) {
          throw UserServiceException('Kullanıcı bulunamadı');
        }

        final data = snapshot.data();
        if (data == null) {
          throw UserServiceException('Kullanıcı verisi bulunamadı');
        }
        final currentShopId = data['shopId'] as String?;

        if (shopId != null && shopId.isNotEmpty) {
          if (currentShopId != null &&
              currentShopId.isNotEmpty &&
              currentShopId != shopId) {
            throw UserServiceException('Kullanıcı farklı bir dükkana bağlı');
          }
        }

        transaction.update(docRef, {
          'role': role,
          'shopId': shopId,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      });
    } on UserServiceException {
      rethrow;
    } on FirebaseException catch (exception) {
      throw UserServiceException(
        'Kullanıcı rolü atanamadı: ${exception.message ?? exception.code}',
      );
    }
  }

  Stream<List<UserModel>> getItemsByShop(String shopId) {
    return _collection
        .where('shopId', isEqualTo: shopId)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => UserModel.fromDoc(doc.id, doc.data()))
              .toList(growable: false),
        );
  }

  Future<UserModel?> getItemById(String id) async {
    try {
      final snapshot = await _collection.doc(id).get();
      if (!snapshot.exists) {
        return null;
      }
      return UserModel.fromDoc(snapshot.id, snapshot.data()!);
    } on FirebaseException catch (exception) {
      throw UserServiceException(
        'Kullanıcı getirilemedi: ${exception.message ?? exception.code}',
      );
    }
  }

  Future<UserModel?> getItemByEmail(String email) async {
    try {
      final query = await _collection
          .where('email', isEqualTo: email.trim().toLowerCase())
          .limit(1)
          .get();
      if (query.docs.isEmpty) {
        return null;
      }
      final doc = query.docs.first;
      return UserModel.fromDoc(doc.id, doc.data());
    } on FirebaseException catch (exception) {
      throw UserServiceException(
        'Kullanıcı getirilemedi: ${exception.message ?? exception.code}',
      );
    }
  }

  Stream<UserModel?> watchUserById(String id) {
    return _collection.doc(id).snapshots().map((snapshot) {
      final data = snapshot.data();
      if (data == null) {
        return null;
      }
      return UserModel.fromDoc(snapshot.id, data);
    });
  }
}

class UserServiceException implements Exception {
  UserServiceException(this.message);

  final String message;

  @override
  String toString() => message;
}
