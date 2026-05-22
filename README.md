# 🐾 PetCode.rs — Produkcijski deploy vodič

## Šta je u ovom projektu

```
petcode-rs-prod/
├── backend/
│   └── schema.sql          ← PostgreSQL schema (pokreni u Supabase)
└── frontend/
    ├── src/app/
    │   ├── page.tsx            ← Landing page (prodaja privezaka)
    │   ├── naruci/             ← Forma za narudžbinu
    │   ├── p/[code]/           ← QR redirect
    │   ├── aktivacija/[code]/  ← Prva aktivacija
    │   ├── ljubimac/[id]/      ← Javni profil ljubimca
    │   ├── dashboard/          ← Panel vlasnika
    │   ├── login/              ← Prijava
    │   ├── admin/              ← Tvoj admin panel
    │   ├── api/orders/         ← API za narudžbine + email
    │   └── not-found.tsx       ← 404 stranica
    ├── src/middleware.ts       ← Zaštita ruta
    ├── src/components/         ← LangSwitcher
    └── src/lib/                ← Supabase, i18n, types
```

---

## KORAK 1 — Supabase (5 min)

1. Idi na **supabase.com** → New Project
   - Naziv: `petcode`
   - Region: **Frankfurt** (eu-central-1)
   - Sačekaj 2 min

2. **SQL Editor** → New Query → nalepi `backend/schema.sql` → **Run**
   - Ovo kreira sve tabele + 200 početnih QR kodova

3. **Storage** → New bucket
   - Naziv: `pet-photos`
   - Public: ✅ DA

4. **Project Settings → API** → kopiraj:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`

---

## KORAK 2 — Resend email (5 min, opciono ali preporučeno)

1. Idi na **resend.com** → besplatan nalog
2. Add Domain → dodaj `petcode.rs` (ili koristi njihov test domen)
3. API Keys → Create API Key → kopiraj

---

## KORAK 3 — Vercel deploy (5 min)

### Opcija A: GitHub (preporučeno za auto-deploy)
```bash
# 1. Push na GitHub
git init && git add . && git commit -m "init"
git remote add origin https://github.com/tvoj-user/petcode-rs.git
git push -u origin main

# 2. vercel.com → New Project → Import → odaberi repo
# 3. Root Directory: frontend
# 4. Environment Variables → dodaj sve iz .env.example
# 5. Deploy
```

### Opcija B: CLI
```bash
cd frontend
npm install
npx vercel login
npx vercel --prod
# Vercel će pitati za env varijable interaktivno
```

---

## KORAK 4 — Environment Variables

U Vercel dashboardu (Settings → Environment Variables):

| Key | Vrednost |
|-----|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJxxx... |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJxxx... |
| `NEXT_PUBLIC_SITE_URL` | https://petcode.rs |
| `ADMIN_SECRET` | tvoj_pin_za_admin (minimum 8 znakova) |
| `RESEND_API_KEY` | re_xxx (ako koristiš email) |
| `RESEND_FROM` | narudzbine@petcode.rs |
| `ADMIN_EMAIL` | tvoj@email.com |

---

## KORAK 5 — Domen petcode.rs

1. Vercel → tvoj projekat → **Settings → Domains**
2. Dodaj: `petcode.rs` i `www.petcode.rs`
3. Kod DNS registrara dodaj:
```
A     @    76.76.21.21
CNAME www  cname.vercel-dns.com
```

---

## KORAK 6 — Test pre lansiranja

Provjeri svaki flow:

1. **QR sken** → otvori `petcode.rs/p/PC-XXXX` (uzmi kod iz admina)
   - ✅ Vodi na `/aktivacija/PC-XXXX`
2. **Aktivacija** → registruj se, unesi podatke, sačuvaj
   - ✅ Vodi na profil sa porukom "Privezak aktiviran"
3. **Javni profil** → otvori link u incognito prozoru
   - ✅ Vidi profil, dugme Pozovi radi
4. **Dashboard** → prijavi se na `/login`
   - ✅ Može menjati podatke, dodavati zdravstvene zapise
5. **Narudžbina** → popuni formu na `/naruci`
   - ✅ Pojavljuje se u admin panelu, prima email
6. **Admin** → `/admin` → PIN iz env varijable
   - ✅ Vidi narudžbine, QR kodove, ljubimce

---

## Admin panel (`/admin`)

PIN = vrednost `ADMIN_SECRET` iz env varijable

Funkcije:
- 📦 **Narudžbine** — sve narudžbine, promena statusa (nova/potvrđena/poslata/isporučena)
- 🔲 **QR Kodovi** — generisanje, export CSV za štampu, deaktivacija
- 🐾 **Ljubimci** — pregled svih profila sa vlasnicima

---

## Cenovni model

| Pakovanje | Cena | Ušteda |
|-----------|------|--------|
| 1 privezak | 990 RSD | — |
| 2 privezka | 1.690 RSD | -290 RSD |
| 4 privezka | 3.980 → 2.980 RSD | -980 RSD |

---

## Skaliranje (kad prerastes besplatni plan)

| Kada | Akcija | Cena |
|------|--------|------|
| 500MB baza | Supabase Pro | $25/mes |
| 1GB storage | Supabase Pro | uključeno |
| 100GB bandwidth | Vercel Pro | $20/mes |
| Dovoljno za | ~5.000 ljubimaca | — |

---

## Dva odvojena dela sajta

```
petcode.rs/          ← PRODAJA
├── /                   Landing page
└── /naruci             Forma za narudžbinu

petcode.rs/          ← PROFILI (ne znaju ništa o prodaji)
├── /p/[kod]            QR redirect
├── /aktivacija/[kod]   Aktivacija
├── /ljubimac/[id]      Javni profil
├── /login              Prijava
└── /dashboard          Panel vlasnika
```
