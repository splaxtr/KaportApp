# KaportaAPP

Kaporta/hasar süreçlerini yönetmek için geliştirilen Next.js + Prisma + PostgreSQL uygulaması. Müşteri, araç, araç dosyası, parça/işlem, fotoğraf, eksper ve sigorta inceleme (paylaşılabilir token + tek kullanımlık anahtar) modülleri içerir.

## Teknoloji
- Next.js (App Router, RSC), React 19
- Prisma ORM + PostgreSQL
- Tailwind (v4)
- Docker (çok aşamalı build)

## Başlangıç
1) Bağımlılıklar  
```bash
npm ci
```
2) Ortam dosyası  
`.env.example` dosyasını `.env` olarak kopyalayıp değerleri doldurun:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/kaportapp_db?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
ADMIN_EMAIL="admin@demo.com"
ADMIN_PASSWORD="Kaportapp@123"
ADMIN_NAME="Kaportapp Admin"
```
3) Migration + client  
```bash
npx prisma migrate dev --name init
npx prisma generate
```
4) Seed (opsiyonel, admin için)  
```bash
npx prisma db seed
```
5) Geliştirme  
```bash
npm run dev
```
Uygulama: http://localhost:3000

## Docker
Çok aşamalı Dockerfile eklendi:
```bash
docker build -t kaportapp .
docker run -p 3000:3000 --env-file .env kaportapp
```

## Kimlik Doğrulama
- Login sonrası `kaporta_auth` çerezi ile korunur; middleware login olmayanları giriş sayfasına yönlendirir.
- Varsayılan admin bilgileri `.env` ile seed edilir.

## Sigorta İnceleme Linkleri
- Her dosya için inceleme linki + 3 tek kullanımlık anahtar üretilir.
- `review/{token}` ekranı sadece geçerli anahtar ile salt-okunur görüntüleme sağlar.

## Scripts
- `npm run dev` – geliştirme
- `npm run build` / `npm run start` – prod build/çalıştırma
- `npm run lint` – lint kontrolü
- `npx prisma migrate deploy` – prod migration
- `npx prisma db seed` – seed

## Notlar
- Üretimde çerezi HttpOnly/Secure hale getirip imzalı/JWT session tercih edin.
- Sağlık kontrolü ve reverse proxy (örn. nginx/caddy) ile HTTPS sonlandırması önerilir.
