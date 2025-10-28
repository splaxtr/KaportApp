# KaportApp

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
