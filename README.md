# BuddyMatcher

BuddyMatcher, TR-DE kultur degisim programlari icin gelistirilmis veri odakli bir buddy eslestirme platformudur.
Katilimcilarin profil ve anket verilerini birlestirir, uyumluluk skorlarina gore eslestirme yapar ve hem kullanici hem de admin tarafi icin operasyonel ekranlar sunar.

## One Cikan Ozellikler

- Email + sifre tabanli kayit/giris ve sifre sifirlama akisi
- TR/DE dilli arayuz
- Profil + private cevaplar ile uyumluluk odakli eslestirme
- Admin panelinden CSV ile toplu katilimci importu
- Admin icin tek tikla eslestirme calistirma
- Katilimcilar listesi, sosyal linkler ve profil goruntuleme
- Dokumantasyon icin HTML ve PDF user guide ciktilari

## Proje Yapisi

- `buddymatcher-web/`: Next.js uygulamasi (ana kod tabani)
- `buddymatcher-web/docs/`: Kullanici kilavuzu HTML/PDF ve ekran goruntuleri
- `buddymatcher-web/scripts/`: Dokumantasyon PDF uretim scripti
- `vercel.json`: Vercel deploy ayarlari

## Hizli Baslangic

1. Proje klasorune gir:

```bash
cd buddymatcher-web
```

2. Bagimliliklari kur:

```bash
npm install
```

3. Ortam degiskenlerini ayarla:

```bash
copy .env.example .env
```

4. Veritabani ve Prisma adimlari:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. Gelistirme sunucusunu baslat:

```bash
npm run dev
```

Uygulama varsayilan olarak `http://localhost:3000` adresinde calisir.

## Yararli Komutlar

`buddymatcher-web` icinde:

```bash
npm run dev
npm run build
npm run lint
npm run docs:pdf
```

## Dokumantasyon ve PDF Uretimi

- HTML rehber: `buddymatcher-web/docs/BuddyMatcher-Guide-EN.html`
- PDF rehber: `buddymatcher-web/docs/BuddyMatcher-Introduction-and-User-Guide-EN.pdf`
- Ekran goruntuleri: `buddymatcher-web/docs/screenshots/`

PDF uretimi `playwright` ile yapilir. Varsayilan olarak `DOCS_BASE_URL=http://127.0.0.1:3000` kullanir.
Istersen su degiskenleri set ederek ozellestirebilirsin:

- `DOCS_BASE_URL`
- `DOCS_ADMIN_IDENTIFIER`
- `DOCS_ADMIN_PASSWORD`

## Deployment

Vercel build akisi icin uygulama tarafinda `vercel-build` scripti tanimlidir:

```bash
prisma generate && prisma db push && next build
```

## Not

Bu repoda kok dizin, proje dokumantasyonunu ve deploy dosyalarini tutar.
Uygulamanin ana gelistirme sureci `buddymatcher-web` altinda yurur.
