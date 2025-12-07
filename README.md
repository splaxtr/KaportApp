# 🛠️ **KaportaAPP — Kaporta Süreç Yönetim Sistemi**

**Next.js + Prisma + PostgreSQL + Docker + Caddy**

KaportaAPP, kaporta & hasar onarım süreçlerini uçtan uca yönetmek için tasarlanmış modern, güvenli ve yüksek performanslı bir platformdur.
Uygulama; araç kabul, müşteri yönetimi, araç dosyaları, parça süreçleri, işçilik adımları, fotoğraf yönetimi, eksper iş akışları ve sigorta inceleme sistemi gibi tüm operasyonları tek bir çözümde toplar.

Platform, tamamen **kapalı bir özel alt domain** altında çalışır:

```
https://kaporta.firmaadi.com
```

Erişim sadece yetkili kullanıcılar ile sağlanır. Sigorta inceleme ekranları token bazlı güvenlik ile korunur.

KaportaAPP, Docker üzerinde izole bir Next.js + PostgreSQL ortamı ile çalışır ve **Caddy reverse proxy** otomatik SSL sertifikası üretir.

---

# 📌 **Özellikler**

### ✔ Kullanıcı Yönetimi (Rol & Yetki Sistemi)

* system_admin (değiştirilemez tam yetkili)
* admin
* employee
  Tüm ekranlar permission bazlı görünür.

### ✔ Müşteri Yönetimi

* Araç sahipleri
* Çoklu telefon
* Adres & notlar
* Soft delete + restore

### ✔ Araç Yönetimi

* Sadece plaka tutulur
* İlk / son geliş tarihi
* Toplam geliş sayısı
* Plaka aramada otomatik öneri (boşlukları yok sayar)

### ✔ Araç Dosyaları (VehicleFile)

* brandModel, color, customer, expert
* accidentDate (opsiyon)
* fileNumber (opsiyon)
* quickNote
* status (open / pending / completed)
* Önceki dosyadan otomatik bilgi çekme

### ✔ Parçalar (Parts)

* Dinamik PartStatus tablosu
* Adet, açıklama, statü yönetimi
* Soft delete + restore

### ✔ İşlemler (Operations)

* Free text işlem adı
* Dinamik OperationStatus tablosu
* Açıklama + statü
* Soft delete + restore

### ✔ Fotoğraflar (Photos)

* Çoklu yükleme
* Başlık (title) + açıklama (note)
* Soft delete + restore

### ✔ Eksper Yönetimi (Expert)

* Eksper listesi
* Eksper dosyaya atanabilir
* Eksper bilgileri sigorta modunda görünür

### ✔ Sigorta İnceleme Modu (Review Mode)

* Her dosya için özel bir token oluşturulur
* Giriş istemez, sadece görüntüleme yapılabilir
* Parça, işlem ve fotoğraflar görülebilir
* Token iptali ile link kapanır

---

# ⚙️ **Teknik Mimarİ**

## **Frontend ve Backend**

* Next.js (App Router)
* React Server Components
* TailwindCSS
* API Routes (Backend)

## **Veritabanı**

* PostgreSQL
* Prisma ORM
* Soft Delete tüm tablolarda
* Restore desteği
* İlişkisel güçlü veri modeli

## **Deployment**

* Docker Compose
* Caddy Reverse Proxy (Otomatik SSL)
* İzole konteyner mimarisi
* PostgreSQL için kalıcı volume

---

# 📁 **Proje Dizini**

```
kaportapp/
│
├── docker/
│   ├── Dockerfile          # Next.js build + runtime
│   ├── docker-compose.yml  # Caddy + Next.js + PostgreSQL
│   └── Caddyfile           # Reverse proxy + SSL
│
├── prisma/
│   ├── schema.prisma
│
├── src/
│   ├── app/
│   │   ├── (auth)
│   │   ├── (admin)
│   │   ├── (employee)
│   │   ├── api/
│   │   └── review/
│   │
│   ├── components/
│   ├── lib/
│   └── styles/
│
├── .env
├── package.json
└── README.md
```

---

# 🐳 **Docker Mimarisi**

## **docker-compose.yml**

```yaml
version: "3.9"

services:
  caddy:
    image: caddy:latest
    container_name: kaportapp_caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - web

  web:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    container_name: kaportapp_web
    restart: always
    env_file: ../.env
    ports:
      - "3000:3000"
    depends_on:
      - db

  db:
    image: postgres:16
    container_name: kaportapp_db
    restart: always
    environment:
      POSTGRES_USER: kaporta
      POSTGRES_PASSWORD: strongpassword
      POSTGRES_DB: kaportaapp
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  migrate:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    container_name: kaportapp_migrate
    entrypoint: ["npx", "prisma", "migrate", "deploy"]
    env_file: ../.env
    depends_on:
      - db

volumes:
  db_data:
  caddy_data:
  caddy_config:
```

---

# 📄 **Caddyfile**

```
kaporta.firmaadi.com {
    encode gzip
    reverse_proxy web:3000

    tls youremail@example.com
}
```

---

# 🧱 **Dockerfile (Next.js)**

```Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app ./
EXPOSE 3000

CMD ["npm", "start"]
```

---

# 🔐 **Environment Değişkenleri (.env)**

```
DATABASE_URL="postgresql://kaporta:strongpassword@db:5432/kaportaapp?schema=public"

JWT_SECRET="super-secret-string"

APP_URL="https://kaporta.firmaadi.com"
```

---

# 🧬 **Prisma Migration**

Şema tamamlandıktan sonra migrate çalıştırılır:

```
docker compose run migrate
```

---

# 🚀 **Deployment**

Proje ayağa kaldırmak için:

```
docker compose up -d --build
```

Güncelleme gerektiğinde:

```
docker compose pull
docker compose up -d --build
docker compose run migrate
```

---

# 🧩 **Geliştirme Süreci (Codex İçin Resmi Plan)**

1. Next.js + Docker + Caddy altyapısı
2. Prisma schema oluşturma (tüm modeller)
3. Auth + RBAC + Permission sistemi
4. Admin panel skeleton
5. Customer modülü
6. Vehicle modülü (plaka suggestion dahil)
7. VehicleFile modülü
8. Parçalar modülü
9. İşlemler modülü
10. Fotoğraflar modülü
11. Eksper modülü
12. Sigorta inceleme modu
13. Özet ekranı
14. Silinenler ekranı
15. Responsive UI
16. Üretim optimizasyonu

---

# 📌 **Özet**

KaportaAPP; yüksek güvenlikli, üretime hazır, Docker + Caddy altyapısı üzerinde çalışan, modern bir kaporta süreç yönetim platformudur.
Bu README, hem geliştirme hem deploy sürecinin eksiksiz referans dökümanıdır.