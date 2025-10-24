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
  final String role; // 'admin' | 'owner' | 'employee'
  final String? shopId;

  factory UserModel.fromDoc(String id, Map<String, dynamic> data) {
    return UserModel(
      id: id,
      name: (data['name'] as String?) ?? '',
      email: (data['email'] as String?) ?? '',
      role: (data['role'] as String?) ?? 'employee',
      shopId: data['shopId'] as String?,
    );
  }

  Map<String, dynamic> toMap() => {
    'name': name,
    'email': email,
    'role': role,
    'shopId': shopId,
  };

  UserModel copyWith({
    String? name,
    String? email,
    String? role,
    String? shopId,
  }) {
    return UserModel(
      id: id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      shopId: shopId ?? this.shopId,
    );
  }
}
