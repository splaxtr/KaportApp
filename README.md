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
=======
KaportApp, kaporta atölyelerinin günlük iş akışlarını tek bir uygulama üzerinden
kontrol edebilmesi için geliştirilmiş Flutter + Firebase tabanlı bir çözümdür.
Araç kabulünden çoklu parça siparişine, çalışan görevlendirmesinden raporlamaya
kadar tüm süreçleri merkezileştirir.

## ✨ Öne Çıkan Özellikler

- **Çoklu parça girişi:** Çok satırlı metin alanına satır satır parça isimleri
  yazıp her satırı checkbox listesine dönüştürerek Firestore’a tek seferde
  kaydedebilirsiniz.
- **Rol bazlı paneller:** İşletme sahibi, çalışan ve yönetici rollerine özel
  paneller sadece ilgili araç kuyruklarını ve görevleri gösterir.
- **Firebase entegrasyonu:** Kimlik doğrulama, araç ve parça verileri Firebase
  Auth + Cloud Firestore’da tutulur; Riverpod ile arayüz reaktif kalır.
- **Otomasyon hazır:** Makefile ve GitHub Actions, analiz, test ve üretim
  paketlerini (APK, AAB, Web) otomatik olarak oluşturur.

## 🗂️ Proje Yapısı

```
lib/
├── core/               # Ortak modeller, servisler, state ve konfigürasyon
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── home/
│   ├── part/
│   ├── profile/
│   ├── shop/
│   └── vehicle/
└── main.dart           # Uygulama başlangıç noktası ve yönlendirmeler
```

Her feature kendi sunum ve (gerekirse) application katmanlarını içerir.
Ortak servisler ve yardımcılar `lib/core/` altında toplanır.

## 🚀 Başlarken

### Gereksinimler

- Flutter **3.24.0** veya üzeri (`flutter --version`)
- Dart SDK (Flutter ile birlikte gelir)
- Firebase projesi (Auth + Firestore yapılandırılmış olmalı) — `flutterfire configure`
- Opsiyonel: GitHub CLI (`gh`) — sürüm yayını için

### Kurulum

```bash
git clone https://github.com/<your-org>/kaportapp.git
cd kaportapp
flutter pub get
```

Firebase yapılandırmasını ilk kez yapacaksanız aşağıdaki komut ile
`lib/core/config/firebase_options.dart` dosyasını oluşturabilirsiniz:

```bash
flutterfire configure
```

## 🧑‍💻 Geliştirme Akışı

Sık kullanılan komutlar projedeki Makefile içinde tanımlıdır:

```bash
make analyze         # flutter analyze
make test            # Unit/widget testlerini coverage ile çalıştırır
make build-web       # Web üretim build’i
make build-apk       # Android APK (release) build’i
make build-aab       # Android App Bundle (release) build’i
make prepare-release # Tüm çıktıların dist/ klasörüne alınması
```

Dilerseniz Flutter komutlarını doğrudan da çalıştırabilirsiniz.

### Uygulamayı Çalıştırma

```bash
flutter run
```

<<<<<<< HEAD
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
=======
`-d chrome`, `-d linux` gibi parametrelerle farklı platformlara koşabilirsiniz.

### Testler

```bash
make test
```

Coverage raporları `coverage/` klasörüne yazılır ve `lcov`, `genhtml` gibi
araçlarla görüntülenebilir.

## 📦 Yayınlama

1. GitHub CLI kullanacaksanız `gh auth login` ile giriş yapın.
2. Tüm build çıktıları için:

   ```bash
   make prepare-release
   ```

   Oluşturulan dosyalar:
   - `dist/app-release.apk`
   - `dist/kaportapp-v$(VERSION).aab`
   - `dist/web/` ve `dist/web.zip`

3. GitHub releases’e yüklemek için:

   ```bash
   make publish-release
   ```

## 🧪 Sürekli Entegrasyon

`.github/workflows/flutter_ci.yml`, `main` ve `develop` dallarına yapılan push’larda,
`main` hedefine açılan pull request’lerde ve yayınlanan GitHub sürümlerinde
çalışır. Akış şu adımları içerir:

1. Dart 3.9.x kısıtını karşılamak için Flutter master kanalı kurulur.
2. Pub bağımlılık cache’i geri yüklenir.
3. `flutter analyze` ve `flutter test --coverage` çalıştırılır.
4. Web, APK ve AAB build’leri oluşturulur (main/release akışlarında).
5. Artifaktlar yüklenerek sonraki adımlarda kullanıma sunulur.

## 🤝 Katkıda Bulunma

1. Depoyu fork’layıp klonlayın.
2. Feature dalınızı oluşturun (`git checkout -b feature/yeni-ozellik`).
3. Push etmeden önce `make analyze test` komutlarını çalıştırın.
4. `develop` dalına (veya belirlenen entegrasyon dalına) pull request gönderin.

## 📚 Ek Kaynaklar

- [Flutter dokümantasyonu](https://docs.flutter.dev)
- [Riverpod dokümantasyonu](https://riverpod.dev)
- [Flutter için Firebase](https://firebase.google.com/docs/flutter/setup)

---

Daha hızlı teslim süreleri ve daha az koordinasyon toplantısı isteyen atölye
ekipleri için ❤️ ile geliştirildi.
