import 'package:cloud_firestore/cloud_firestore.dart';

class ShopModel {
  const ShopModel({
    required this.id,
    required this.name,
    required this.ownerId,
    required this.users,
    required this.createdAt,
  });

  final String id;
  final String name;
  final String ownerId;
  final List<String> users;
  final DateTime? createdAt;

  factory ShopModel.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? <String, dynamic>{};
    return ShopModel(
      id: doc.id,
      name: (data['name'] as String?) ?? '',
      ownerId: (data['ownerId'] as String?) ?? '',
      users: ((data['users'] as List?) ?? const <dynamic>[])
          .map((e) => e.toString())
          .toList(),
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
    );
  }

  Map<String, dynamic> toMap() => {
    'name': name,
    'ownerId': ownerId,
    'users': users,
    'createdAt': createdAt == null ? null : Timestamp.fromDate(createdAt!),
  };
}
