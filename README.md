# KaportApp

Kaportaj atölyeleri için araç ve parça yönetim sistemi. Flutter ve Firebase ile geliştirilmiş, gerçek zamanlı veri senkronizasyonu sağlayan bir mobil uygulama.

## Özellikler

### Rol Bazlı Yetkilendirme
- **Admin**: Sistem yönetimi ve dükkan oluşturma
- **Owner (Dükkan Sahibi)**: Dükkan yönetimi, çalışan atama, araç ve parça yönetimi
- **Employee (Çalışan)**: Araç ve parça görüntüleme ve düzenleme

### Ana Modüller

#### 1. Dükkan Yönetimi
- Dükkan oluşturma ve düzenleme
- Çalışan atama ve yönetimi
- Atanmamış kullanıcıları listeleme

#### 2. Araç Yönetimi
- Araç ekleme, düzenleme ve silme
- Araç bilgileri: Marka, model, yıl, plaka, müşteri adı
- Dükkan bazlı araç filtreleme

#### 3. Parça Yönetimi (Sprint 3)
- Araç bazlı parça yönetimi
- Parça ekleme, düzenleme ve silme
- Parça durumu takibi:
  - Beklemede (pending)
  - Sipariş Verildi (ordered)
  - Takıldı (installed)
- Her parça için: İsim, pozisyon, miktar, durum

## Teknoloji Yığını

- **Framework**: Flutter 3.35.6
- **Dil**: Dart 3.9.2
- **State Management**: Riverpod 3.0.3
- **Backend**: Firebase
  - Cloud Firestore (Veritabanı)
  - Firebase Authentication (Kimlik Doğrulama)
- **Platform**: Android (API 21+)

## Firestore Veri Yapısı

### Collections

```
users/
  └── {userId}
      ├── email: string
      ├── role: "admin" | "owner" | "employee"
      ├── shopId: string?
      └── createdAt: timestamp

shops/
  └── {shopId}
      ├── name: string
      ├── ownerId: string
      ├── users: string[]
      └── createdAt: timestamp

vehicles/
  └── {vehicleId}
      ├── brand: string
      ├── model: string
      ├── year: int
      ├── plate: string
      ├── customerName: string
      ├── shopId: string
      └── createdAt: timestamp

parts/
  └── {partId}
      ├── vehicleId: string
      ├── shopId: string
      ├── name: string
      ├── position: string
      ├── quantity: int
      ├── status: "pending" | "ordered" | "installed"
      ├── createdAt: timestamp
      └── updatedAt: timestamp
```

## Güvenlik Kuralları

Firestore security rules şunları sağlar:
- Kullanıcılar sadece kendi dükkanlarındaki verilere erişebilir
- Owner'lar dükkanlarını yönetebilir ve çalışan atayabilir
- Admin'ler tüm dükkanları görebilir ve yönetebilir
- Tüm okuma/yazma işlemleri kimlik doğrulaması gerektirir
- ShopId bazlı veri izolasyonu

## Kurulum

### Gereksinimler

- Flutter SDK 3.35.6 veya üzeri
- Dart SDK 3.9.2 veya üzeri
- Android Studio / VS Code
- Firebase projesi

### Adımlar

1. Repoyu klonlayın:
```bash
git clone <repo-url>
cd kaportapp
```

2. Bağımlılıkları yükleyin:
```bash
flutter pub get
```

3. Firebase yapılandırması:
   - Firebase Console'da yeni proje oluşturun
   - Android uygulaması ekleyin (com.splaxtr.kaportapp)
   - `google-services.json` dosyasını `android/app/` dizinine ekleyin
   - Firestore ve Authentication'ı etkinleştirin
   - `firestore.rules.recommended` dosyasındaki kuralları Firestore'a uygulayın

4. Uygulamayı çalıştırın:
```bash
flutter run
```

## Geliştirme

### Proje Yapısı

```
lib/
├── main.dart                 # Uygulama giriş noktası
├── models/                   # Veri modelleri
│   ├── user_model.dart
│   ├── shop_model.dart
│   ├── vehicle_model.dart
│   └── part_model.dart
├── services/                 # Firebase servisleri
│   ├── auth_service.dart
│   ├── shop_service.dart
│   ├── vehicle_service.dart
│   └── part_service.dart
├── state/                    # Riverpod providers
│   ├── user_session.dart
│   ├── shop_providers.dart
│   ├── vehicle_providers.dart
│   └── part_providers.dart
└── screens/                  # UI ekranları
    ├── login_screen.dart
    ├── admin_dashboard_screen.dart
    ├── owner_dashboard_screen.dart
    ├── employee_dashboard_screen.dart
    └── vehicle_detail_screen.dart
```

### Kod Standartları

- Dart dosyaları için `flutter analyze` kullanın
- Her servis metodu için actor validation zorunludur
- Firestore query'leri shopId filtresi içermelidir
- Riverpod providers StreamProvider.autoDispose pattern kullanır
- Hata yönetimi için custom exception sınıfları kullanın

## Sprint Geçmişi

### Sprint 1: Temel Altyapı
- Firebase entegrasyonu
- Kullanıcı kimlik doğrulama
- Rol bazlı yetkilendirme

### Sprint 2: Dükkan ve Araç Yönetimi
- Dükkan CRUD işlemleri
- Araç CRUD işlemleri
- Çalışan atama sistemi

### Sprint 3: Araç Bazlı Parça Yönetimi (Aktif)
- Global stok sisteminin kaldırılması
- Araç detay ekranı oluşturulması
- Parça CRUD işlemlerinin araç bazlı yapılması
- VehicleDetailScreen implementasyonu
- Firestore security rules güncellemeleri

## Bilinen Sorunlar ve Çözümler

### 1. Firestore Permission Denied
**Sorun**: Parçalar yüklenirken PERMISSION_DENIED hatası
**Çözüm**: Query'ye hem vehicleId hem shopId filtresi eklendi

### 2. Unassigned Users Query
**Sorun**: Firestore null değerleri whereIn ile desteklemiyor
**Çözüm**: Tüm kullanıcılar fetch edilip client-side filtreleme yapıldı

### 3. Employee Assignment
**Sorun**: Owner çalışan atayamıyor
**Çözüm**: Firestore rules'a owner update izni eklendi

## Lisans

Bu proje özel mülkiyettir.

## İletişim

Sorularınız için: [İletişim bilgisi]
