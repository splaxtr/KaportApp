import 'package:cloud_firestore/cloud_firestore.dart';

import 'package:kaportapp/core/models/user_model.dart';

class UserService {
  UserService({FirebaseFirestore? firestore})
    : _collection = (firestore ?? FirebaseFirestore.instance).collection(
        'users',
      );

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
}

class UserServiceException implements Exception {
  UserServiceException(this.message);

  final String message;

  @override
  String toString() => message;
}
