class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.shopId,
  });

  final String id;
  final String name;
  final String email;
  final String? role; // 'admin' | 'owner' | 'employee' | null
  final String? shopId;

  factory UserModel.fromDoc(String id, Map<String, dynamic> data) {
    return UserModel(
      id: id,
      name: (data['name'] as String?) ?? '',
      email: (data['email'] as String?) ?? '',
      role: data['role'] as String?,
      shopId: data['shopId'] as String?,
    );
  }

  Map<String, dynamic> toMap() => {
    'name': name,
    'email': email,
    'role': role,
    'shopId': shopId,
  };

  static const _sentinel = Object();

  UserModel copyWith({
    String? name,
    String? email,
    Object? role = _sentinel,
    Object? shopId = _sentinel,
  }) {
    return UserModel(
      id: id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: identical(role, _sentinel) ? this.role : role as String?,
      shopId: identical(shopId, _sentinel) ? this.shopId : shopId as String?,
    );
  }
}
