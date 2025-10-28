import 'package:cloud_firestore/cloud_firestore.dart';

Timestamp? _timestampFromValue(Object? value) {
  if (value is Timestamp) {
    return value;
  }
  if (value is DateTime) {
    return Timestamp.fromDate(value);
  }
  return null;
}

class PartModel {
  const PartModel({
    required this.id,
    required this.vehicleId,
    required this.name,
    required this.position,
    required this.status,
    required this.quantity,
    required this.shopId,
    this.createdAt,
  });

  final String id;
  final String vehicleId;
  final String name;
  final String position;
  final String status;
  final int quantity;
  final String shopId;
  final Timestamp? createdAt;

  factory PartModel.fromMap(Map<String, dynamic> map) {
    return PartModel(
      id: map['id'] as String? ?? '',
      vehicleId: map['vehicleId'] as String? ?? '',
      name: map['name'] as String? ?? '',
      position: map['position'] as String? ?? '',
      status: map['status'] as String? ?? '',
      quantity: (map['quantity'] as num?)?.toInt() ?? 0,
      shopId: map['shopId'] as String? ?? '',
      createdAt: _timestampFromValue(map['createdAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'vehicleId': vehicleId,
      'name': name,
      'position': position,
      'status': status,
      'quantity': quantity,
      'shopId': shopId,
      'createdAt': createdAt,
    };
  }

  PartModel copyWith({
    String? id,
    String? vehicleId,
    String? name,
    String? position,
    String? status,
    int? quantity,
    String? shopId,
    Timestamp? createdAt,
  }) {
    return PartModel(
      id: id ?? this.id,
      vehicleId: vehicleId ?? this.vehicleId,
      name: name ?? this.name,
      position: position ?? this.position,
      status: status ?? this.status,
      quantity: quantity ?? this.quantity,
      shopId: shopId ?? this.shopId,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  factory PartModel.fromSnapshot(DocumentSnapshot snapshot) {
    final data = snapshot.data() as Map<String, dynamic>?;
    if (data == null) {
      throw StateError('Belge içeriği bulunamadı.');
    }
    return PartModel.fromMap({...data, 'id': data['id'] ?? snapshot.id});
  }

  Map<String, dynamic> toFirestore() => toMap();
}
