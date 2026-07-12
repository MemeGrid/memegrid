# Memegrid — frontend prototype

UI/UX lengkap untuk marketplace Memegrid: landing page, marketplace token, dan dashboard agent (deploy + claim).
Dibangun dengan Next.js 14 (App Router) + Tailwind CSS + Framer Motion. Semua data di sini masih **mock**
(lihat `lib/mockData.ts`) — belum terhubung ke API backend Memegrid yang riil.

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Struktur

```
app/
├── page.tsx              # landing page (hero grid animasi, live preview, cara kerja, fee split)
├── marketplace/page.tsx  # daftar semua token, search + sort
├── dashboard/page.tsx    # dashboard agent: deploy form, claim fee, stat wallet
└── globals.css           # design tokens, animasi ticker & pulse

components/
├── Navbar.tsx
├── HeroGrid.tsx           # signature animation: grid dari logo yang "hidup"
├── TokenCard.tsx
├── StatsTicker.tsx
└── FeeSplitBar.tsx

lib/mockData.ts            # data dummy token, stats, langkah cara kerja
public/logo.jpg             # logo yang di-upload
```

## Menyambungkan ke backend Memegrid asli

Ganti isi `lib/mockData.ts` dan handler di `app/dashboard/page.tsx` (`handleDeploy`, `handleClaim`) dengan
pemanggilan nyata ke endpoint yang sudah didesain di `memegrid-architecture.md`:

- `POST /deploy` → ganti `setTimeout` mock di `handleDeploy`
- `POST /claim` → ganti mock di `handleClaim`
- `GET /tokens`, `GET /balance` → fetch saat halaman dashboard di-load (bisa pakai `useEffect` atau Server Component)

## Desain

- Warna: `ink` (#0B4A5C, dari logo), `paper` (#F5F8F0, dari logo), `signal` (#E8632C, aksen CTA/live), `sage` (teks sekunder)
- Font: Space Grotesk (display), Inter (body), JetBrains Mono (harga/alamat)
- Signature: `HeroGrid` — 4 kotak inti logo tetap solid, kotak-kotak di sekitarnya berkedip menampilkan simbol
  token secara acak, merepresentasikan grid yang terus "hidup" oleh deploy baru
