import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

import 'package:kaportapp/core/models/user_model.dart';

/// Custom exception for AuthService errors
class AuthServiceException implements Exception {
  AuthServiceException(this.message);

  final String message;

  @override
  String toString() => 'AuthServiceException: $message';
}

/// Authentication service handling Firebase Auth and user data
class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  /// Stream of authentication state changes
  Stream<User?> authChanges() => _auth.authStateChanges();

  /// Sign in with email and password
  Future<User?> signIn(String email, String password) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      return credential.user;
    } on FirebaseAuthException catch (e) {
      debugPrint('AuthService.signIn error: ${e.code} - ${e.message}');
      throw AuthServiceException(_getAuthErrorMessage(e.code));
    } catch (e) {
      debugPrint('AuthService.signIn unexpected error: $e');
      throw AuthServiceException(
        'Giriş yapılırken beklenmeyen bir hata oluştu',
      );
    }
  }

  /// Create new user account and user document
  Future<User?> signUp({
    required String email,
    required String password,
    required String name,
    String role = 'employee',
    String? shopId,
  }) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      final user = credential.user;
      if (user == null) {
        throw AuthServiceException('Kullanıcı oluşturulamadı');
      }

      // Create user document in Firestore
      await _db.collection('users').doc(user.uid).set({
        'name': name,
        'email': email,
        'role': role,
        'shopId': shopId,
      });

      return user;
    } on FirebaseAuthException catch (e) {
      debugPrint('AuthService.signUp error: ${e.code} - ${e.message}');
      throw AuthServiceException(_getAuthErrorMessage(e.code));
    } catch (e) {
      if (e is AuthServiceException) rethrow;
      debugPrint('AuthService.signUp unexpected error: $e');
      throw AuthServiceException('Kayıt olurken beklenmeyen bir hata oluştu');
    }
  }

  /// Sign out current user
  Future<void> signOut() async {
    try {
      await _auth.signOut();
    } catch (e) {
      debugPrint('AuthService.signOut error: $e');
      throw AuthServiceException('Çıkış yapılırken hata oluştu');
    }
  }

  /// Fetch user model from Firestore
  Future<UserModel?> fetchUserModel(String uid) async {
    try {
      final doc = await _db.collection('users').doc(uid).get();
      if (!doc.exists) return null;

      final data = doc.data();
      if (data == null) return null;

      return UserModel.fromDoc(doc.id, data);
    } on FirebaseException catch (e) {
      debugPrint('AuthService.fetchUserModel error: ${e.code} - ${e.message}');
      throw AuthServiceException('Kullanıcı bilgileri alınamadı');
    }
  }

  /// Update user display name in Firestore
  /// This updates the 'name' field in users/{uid} document
  Future<void> updateUserName(String uid, String newName) async {
    try {
      if (newName.trim().isEmpty) {
        throw AuthServiceException('İsim boş olamaz');
      }

      await _db.collection('users').doc(uid).update({'name': newName.trim()});
    } on FirebaseException catch (e) {
      debugPrint('AuthService.updateUserName error: ${e.code} - ${e.message}');
      throw AuthServiceException('İsim güncellenemedi: ${e.message ?? e.code}');
    } catch (e) {
      if (e is AuthServiceException) rethrow;
      debugPrint('AuthService.updateUserName unexpected error: $e');
      throw AuthServiceException('İsim güncellenirken beklenmeyen hata oluştu');
    }
  }

  /// Update user password with reauthentication
  /// Requires current password for security
  Future<void> updatePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final user = _auth.currentUser;
      if (user == null) {
        throw AuthServiceException('Kullanıcı oturumu bulunamadı');
      }

      if (user.email == null) {
        throw AuthServiceException('E-posta adresi bulunamadı');
      }

      if (newPassword.length < 6) {
        throw AuthServiceException('Yeni şifre en az 6 karakter olmalıdır');
      }

      // Reauthenticate with current password
      final credential = EmailAuthProvider.credential(
        email: user.email!,
        password: currentPassword,
      );

      await user.reauthenticateWithCredential(credential);

      // Update password
      await user.updatePassword(newPassword);
    } on FirebaseAuthException catch (e) {
      debugPrint('AuthService.updatePassword error: ${e.code} - ${e.message}');

      if (e.code == 'wrong-password') {
        throw AuthServiceException('Mevcut şifre hatalı');
      }

      if (e.code == 'weak-password') {
        throw AuthServiceException('Yeni şifre çok zayıf');
      }

      if (e.code == 'requires-recent-login') {
        throw AuthServiceException(
          'Şifre değiştirmek için yeniden giriş yapmanız gerekiyor',
        );
      }

      throw AuthServiceException(_getAuthErrorMessage(e.code));
    } catch (e) {
      if (e is AuthServiceException) rethrow;
      debugPrint('AuthService.updatePassword unexpected error: $e');
      throw AuthServiceException(
        'Şifre güncellenirken beklenmeyen hata oluştu',
      );
    }
  }

  /// Legacy method - kept for backward compatibility
  /// Use updateUserName instead
  @Deprecated('Use updateUserName instead')
  Future<void> updateDisplayName(String uid, String newName) async {
    return updateUserName(uid, newName);
  }

  /// Legacy method - kept for backward compatibility
  /// Use updatePassword with currentPassword parameter instead
  @Deprecated('Use updatePassword with currentPassword parameter instead')
  Future<void> changePassword(String newPassword) async {
    try {
      final user = _auth.currentUser;
      if (user == null) {
        throw AuthServiceException('Kullanıcı oturumu bulunamadı');
      }

      await user.updatePassword(newPassword);
    } on FirebaseAuthException catch (e) {
      debugPrint('AuthService.changePassword error: ${e.code} - ${e.message}');

      if (e.code == 'requires-recent-login') {
        throw AuthServiceException(
          'Şifre değiştirmek için yeniden giriş yapmanız gerekiyor',
        );
      }

      throw AuthServiceException(_getAuthErrorMessage(e.code));
    }
  }

  /// Convert Firebase Auth error codes to user-friendly Turkish messages
  String _getAuthErrorMessage(String code) {
    switch (code) {
      case 'user-not-found':
        return 'Kullanıcı bulunamadı';
      case 'wrong-password':
        return 'Hatalı şifre';
      case 'email-already-in-use':
        return 'Bu e-posta adresi zaten kullanımda';
      case 'invalid-email':
        return 'Geçersiz e-posta adresi';
      case 'weak-password':
        return 'Şifre çok zayıf (en az 6 karakter)';
      case 'user-disabled':
        return 'Bu hesap devre dışı bırakılmış';
      case 'too-many-requests':
        return 'Çok fazla deneme yapıldı, lütfen daha sonra tekrar deneyin';
      case 'operation-not-allowed':
        return 'Bu işlem şu anda izin verilmiyor';
      case 'requires-recent-login':
        return 'Bu işlem için yeniden giriş yapmanız gerekiyor';
      default:
        return 'Kimlik doğrulama hatası: $code';
    }
  }
}
