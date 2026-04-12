# BuddyMatcher MVP

TR-DE kultur degisim programi icin buddy eslestirme web uygulamasi.

## Ozellikler

- Email + sifre ile kayit / giris
- Iki dilli arayuz (TR/DE)
- Big Five tabanli profil olusturma
- Admin icin CSV ile toplu katilimci import
- Admin icin tek tikla global optimum buddy eslestirme
- Kullaniciya eslesme sonucu ve skor aciklamasi gosterimi

## Teknoloji

- Next.js 16 (App Router, TypeScript)
- PostgreSQL + Prisma
- Cookie tabanli JWT oturum yonetimi
- Hungarian algoritmasi ile global optimum atama

## Kurulum

1. Bagimliliklar:

```bash
npm install
```

2. Ortam degiskenleri:

```bash
copy .env.example .env
```

3. `DATABASE_URL` degerini kendi PostgreSQL baglantinla guncelle.

4. Prisma migration + client generate:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. Gelistirme sunucusu:

```bash
npm run dev
```

Uygulama: http://localhost:3000

## Admin Yetkisi

`.env` icinde `ADMIN_EMAILS` alanina virgulle admin e-postalarini ekleyebilirsin.

Kayit olan kullanicinin e-postasi bu listede ise rol `ADMIN` olur.

## CSV Formati

Admin panelindeki import icin su kolonlar beklenir:

```text
name,email,country,openness,conscientiousness,extraversion,agreeableness,neuroticism,interests,bio,travelAfterProgram,password
```

`country`: `TR` veya `DE`
Big Five alanlari: 1-10 arasi tam sayi

## Eslestirme Kurali

- Sadece `TR` ile `DE` eslesir.
- 1-1 zorunlu oldugu icin TR ve DE sayilari esit degilse eslestirme calismaz.
- Skor bilesenleri:
	- Big Five benzerligi: %70
	- Ilgi alani ortusmesi: %20
	- Program sonrasi seyahat tercihi uyumu: %10

