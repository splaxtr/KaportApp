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

class VehicleModel {
  const VehicleModel({
    required this.id,
    required this.plate,
    required this.brand,
    required this.model,
    required this.year,
    required this.customerName,
    required this.shopId,
    this.createdAt,
  });

  final String id;
  final String plate;
  final String brand;
  final String model;
  final int year;
  final String customerName;
  final String shopId;
  final Timestamp? createdAt;

  factory VehicleModel.fromMap(Map<String, dynamic> map) {
    return VehicleModel(
      id: map['id'] as String? ?? '',
      plate: map['plate'] as String? ?? '',
      brand: map['brand'] as String? ?? '',
      model: map['model'] as String? ?? '',
      year: (map['year'] as num?)?.toInt() ?? 0,
      customerName: map['customerName'] as String? ?? '',
      shopId: map['shopId'] as String? ?? '',
      createdAt: _timestampFromValue(map['createdAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'plate': plate,
      'brand': brand,
      'model': model,
      'year': year,
      'customerName': customerName,
      'shopId': shopId,
      'createdAt': createdAt,
    };
  }

  VehicleModel copyWith({
    String? id,
    String? plate,
    String? brand,
    String? model,
    int? year,
    String? customerName,
    String? shopId,
    Timestamp? createdAt,
  }) {
    return VehicleModel(
      id: id ?? this.id,
      plate: plate ?? this.plate,
      brand: brand ?? this.brand,
      model: model ?? this.model,
      year: year ?? this.year,
      customerName: customerName ?? this.customerName,
      shopId: shopId ?? this.shopId,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  factory VehicleModel.fromSnapshot(DocumentSnapshot snapshot) {
    final data = snapshot.data() as Map<String, dynamic>?;
    if (data == null) {
      throw StateError('Belge içeriği bulunamadı.');
    }
    return VehicleModel.fromMap({...data, 'id': data['id'] ?? snapshot.id});
  }

  Map<String, dynamic> toFirestore() => toMap();
}
