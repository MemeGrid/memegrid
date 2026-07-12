# Memegrid — Arsitektur Platform Marketplace AI Agent Memecoin

Versi: draft v1 · Chain target: Robinhood Chain (ID 4663) via NOXA Fun launchpad (`fun.noxa.fi/rh`)

---

## 1. Ringkasan sistem

Memegrid adalah lapisan orkestrasi di atas launchpad NOXA Fun. AI agent (bisa Claude, atau agent lain) meng-install **skill Memegrid**, lalu cukup mengetik perintah `deploy` atau `claim`. Memegrid yang menangani:

- Pembuatan wallet custodial per agent (agent tidak pernah pegang private key)
- Validasi & pembentukan transaksi launch ke kontrak NOXA
- Pencatatan token yang di-deploy dan siapa deployer-nya
- Split fee kreator 70% agent / 30% Memegrid
- Proses claim fee on-demand

Prinsip desain: **agent hanya bicara lewat dua command (`deploy`, `claim`)**. Semua kompleksitas — wallet, gas, kontrak, signing, split fee — disembunyikan di backend Memegrid.

```
Agent (Claude, dsb) → Skill "memegrid" → Memegrid API → Signer service → NOXA Fun (Robinhood Chain)
                                              ↓
                                        Ledger DB (fee 70/30)
```

---

## 2. Komponen sistem

| Komponen | Fungsi | Teknologi disarankan |
|---|---|---|
| **Skill package** | Interface yang di-install agent; command `deploy`/`claim`/`status`/`balance` | `SKILL.md` + script tipis yang panggil API |
| **API Gateway** | Endpoint publik yang dipanggil skill | Node.js/Fastify atau Python/FastAPI |
| **Agent Registry** | Simpan identitas agent, API key, payout address | PostgreSQL |
| **Wallet Provisioning Service** | Bikin & simpan wallet custodial per agent | KMS/HSM (AWS KMS, GCP KMS, atau Fireblocks/Turnkey) |
| **Deploy Orchestrator** | Validasi input, build tx, kirim ke signer | Node.js + viem/ethers |
| **Signer Service** | Satu-satunya komponen yang boleh akses private key | Terisolasi, idealnya microservice terpisah dengan network policy ketat |
| **Chain Indexer** | Dengarkan event `TokenLaunched` & event fee dari pool V3 | Node.js worker + RPC websocket, atau The Graph subgraph kustom |
| **Fee Ledger** | Catat accrued fee per token/per agent, hitung split 70/30 | PostgreSQL tabel `fee_ledger` |
| **Claim Processor** | Eksekusi klaim fee on-chain lalu distribusi 70/30 | Signer service + queue (BullMQ/Redis) |
| **Marketplace frontend** | UI publik menampilkan token yang sudah di-deploy | Next.js |

---

## 3. Struktur repo (usulan)

```
memegrid/
├── apps/
│   ├── api/                  # REST API gateway (deploy, claim, status)
│   ├── indexer/               # worker dengar event on-chain
│   ├── signer/                 # isolated signer service (akses KMS)
│   └── web/                   # marketplace frontend (Next.js)
├── packages/
│   ├── noxa-adapter/          # wrapper kontrak NOXA (ABI, address per chain)
│   ├── db/                    # schema + migrations
│   └── shared-types/
├── memegrid-skill/            # skill yang didistribusikan ke agent
│   ├── SKILL.md
│   ├── scripts/
│   │   ├── deploy.py
│   │   ├── claim.py
│   │   └── status.py
│   └── references/
│       └── api-spec.md
└── infra/
    ├── terraform/              # KMS, DB, network policy
    └── docker-compose.yml
```

---

## 4. Skema database (inti)

```sql
-- Identitas agent yang install skill
CREATE TABLE agents (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT NOT NULL,
    api_key_hash      TEXT NOT NULL UNIQUE,     -- hash, bukan plaintext
    wallet_address    TEXT NOT NULL UNIQUE,      -- wallet custodial Memegrid untuk agent ini
    wallet_key_ref    TEXT NOT NULL,             -- referensi ke KMS, BUKAN private key mentah
    payout_address    TEXT,                      -- alamat eksternal tujuan claim (opsional, default = wallet_address)
    status            TEXT NOT NULL DEFAULT 'active', -- active | suspended
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Token yang berhasil di-deploy
CREATE TABLE launches (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id              UUID NOT NULL REFERENCES agents(id),
    chain_id              INT NOT NULL DEFAULT 4663,     -- Robinhood
    token_address         TEXT NOT NULL UNIQUE,
    pool_address          TEXT NOT NULL,
    pair_token            TEXT NOT NULL,
    name                  TEXT NOT NULL,
    symbol                TEXT NOT NULL,
    logo_url              TEXT,
    description           TEXT,
    tx_hash               TEXT NOT NULL,
    launch_block          BIGINT NOT NULL,
    restriction_end_block BIGINT,
    initial_buy_amount    NUMERIC DEFAULT 0,
    fee_wallet            TEXT NOT NULL,          -- alamat yang didaftarkan sbg custom fee wallet ke NOXA
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ledger fee kreator, diisi oleh indexer, dipakai saat claim
CREATE TABLE fee_ledger (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    launch_id         UUID NOT NULL REFERENCES launches(id),
    accrued_amount    NUMERIC NOT NULL DEFAULT 0,   -- dalam pair_token (mis. WETH), diisi indexer
    claimed_amount    NUMERIC NOT NULL DEFAULT 0,
    last_synced_block BIGINT,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Riwayat setiap klaim + split
CREATE TABLE claims (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    launch_id         UUID NOT NULL REFERENCES launches(id),
    agent_id          UUID NOT NULL REFERENCES agents(id),
    gross_amount      NUMERIC NOT NULL,       -- total fee yang diklaim dari pool
    agent_amount      NUMERIC NOT NULL,       -- 70%
    memegrid_amount   NUMERIC NOT NULL,       -- 30%
    tx_hash_claim     TEXT NOT NULL,          -- tx claim dari pool ke fee_wallet
    tx_hash_payout    TEXT,                   -- tx distribusi ke agent (jika payout_address beda dari wallet Memegrid)
    status            TEXT NOT NULL DEFAULT 'pending', -- pending | completed | failed
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 5. Model wallet & custody

Prinsip: **agent tidak pernah menyentuh private key.** Saat agent pertama kali install skill dan register, Memegrid:

1. Generate keypair baru lewat KMS (AWS KMS / GCP Cloud KMS / Turnkey / Fireblocks) — private key **tidak pernah keluar** dari KMS dalam bentuk plaintext, tanda tangan dilakukan lewat KMS API.
2. Simpan hanya `wallet_key_ref` (ID referensi ke key di KMS) di database, bukan private key.
3. Berikan agent sebuah `api_key` (dipakai skill untuk autentikasi ke Memegrid API) dan `wallet_address` (read-only, buat agent tahu alamatnya).
4. Agent bisa top-up gas ke `wallet_address` miliknya sendiri, atau Memegrid bisa sponsor gas dari treasury pusat lalu potong dari fee yang terkumpul (model "gasless" — lebih ramah buat agent baru).

Kenapa bukan agent pegang private key sendiri? Karena command `deploy`/`claim` harus bisa dijalankan otomatis tanpa manusia approve tiap transaksi — kalau private key ada di sisi agent (misal di memory LLM atau file lokal), risiko kebocoran sangat tinggi. Custody terpusat + KMS + audit log jauh lebih aman untuk skenario "AI agent sign transaksi sendiri".

**Rekomendasi tambahan keamanan:**
- Wallet policy per agent: batas maksimum initial-buy per deploy, batas jumlah deploy per hari
- Wallet terpisah per agent (bukan shared pool) supaya kalau satu agent kompromi, kerugian terisolasi
- Withdrawal ke `payout_address` eksternal butuh 2 langkah: agent set payout address lewat command terpisah (bukan bagian dari `claim` otomatis) + delay/cooldown untuk address baru (anti account-takeover)

---

## 6. Mekanisme fee split 70% agent / 30% Memegrid

NOXA Fun punya fitur **Custom Fee Wallet** — deployer token bisa set alamat lain (bukan wallet yang connect) sebagai penerima fee trading. Ini titik masuk buat split otomatis. Dua opsi implementasi:

### Opsi A — Ledger off-chain (rekomendasi untuk MVP)
1. Saat `deploy`, Memegrid set `fee_wallet` = **wallet treasury Memegrid** (bukan wallet agent langsung).
2. Indexer memantau fee yang accrued di pool V3 tiap token (via event `Collect`/swap fee di kontrak V3).
3. Saat agent command `claim`:
   - Signer service memanggil fungsi claim fee di NOXA/Uniswap V3 position manager → fee cair ke `fee_wallet` (treasury Memegrid)
   - Backend hitung `agent_amount = gross * 0.70`, `memegrid_amount = gross * 0.30`
   - Backend kirim `agent_amount` dari treasury ke `payout_address` agent (transaksi terpisah)
   - Semua tercatat di tabel `claims`
4. Kelebihan: cepat dibangun, fleksibel ubah persentase kapan saja. Kekurangan: agent harus percaya Memegrid soal pembagian (trust assumption, bukan trustless).

### Opsi B — Smart contract splitter on-chain (rekomendasi untuk V2 / trust minimization)
1. Deploy kontrak `MemegridFeeSplitter` sekali per chain (bukan per token) dengan fungsi:
   ```solidity
   function claimAndSplit(address token, uint256 agentBps) external {
       // agentBps = 7000 (70%), sisanya otomatis ke treasury Memegrid
       // 1. claim fee dari posisi V3 milik token ini ke kontrak ini
       // 2. transfer agentBps% ke payout address agent (dibaca dari registry on-chain atau parameter)
       // 3. transfer sisanya ke treasury Memegrid
   }
   ```
2. Saat `deploy`, `fee_wallet` diset ke **alamat kontrak splitter ini** (bukan wallet Memegrid).
3. Split terjadi otomatis on-chain, transparan, dan bisa diverifikasi siapa pun — cocok kalau nanti banyak agent pihak ketiga yang tidak mau "percaya begitu saja" ke Memegrid.
4. Kekurangan: butuh audit kontrak, sedikit lebih mahal gas per claim, dan persentase per-agent butuh mekanisme setting on-chain (mapping token → agentBps yang diisi saat deploy).

**Rekomendasi jalan:** mulai dari Opsi A supaya cepat live, siapkan Opsi B begitu volume transaksi cukup besar untuk menjustifikasi audit kontrak — dan supaya klaim "70/30 otomatis" makin kredibel di mata agent/komunitas.

---

## 7. API internal yang dipanggil skill

Base URL contoh: `https://api.memegrid.xyz/v1`. Autentikasi: header `Authorization: Bearer <api_key>` (per-agent).

| Endpoint | Method | Fungsi |
|---|---|---|
| `/agents/register` | POST | Registrasi agent baru → generate wallet custodial, return `api_key` + `wallet_address` |
| `/agents/me` | GET | Info agent: wallet, payout address, status |
| `/agents/me/payout-address` | PUT | Set/ubah alamat tujuan claim (ada cooldown keamanan) |
| `/deploy` | POST | Body: `{ name, symbol, description, logo_url, socials, initial_buy? }` → validasi, build & kirim tx launch, return `token_address`, `tx_hash` |
| `/tokens` | GET | List token yang sudah di-deploy oleh agent tsb |
| `/tokens/:address` | GET | Detail token: pool, fee accrued, status restriksi anti-snipe |
| `/claim` | POST | Body: `{ token_address }` (atau kosong = klaim semua token milik agent) → eksekusi claim + split, return breakdown 70/30 |
| `/claims` | GET | Riwayat klaim agent |
| `/balance` | GET | Saldo wallet custodial agent (native token buat gas + fee yang belum diklaim) |

---

## 8. Alur end-to-end

### 8.1 Onboarding agent (sekali saja)
1. Agent install skill `memegrid`
2. Agent panggil command `register` (skill otomatis hit `/agents/register`)
3. Memegrid generate wallet via KMS, simpan `wallet_key_ref`, balikin `api_key` + `wallet_address` ke agent
4. Skill simpan `api_key` di config lokal agent (env var / secret store milik agent, bukan dikirim ke LLM context berulang-ulang)

### 8.2 Command `deploy`
1. Agent kasih brief (tema token, nama, simbol, dsb) → LLM di sisi agent generate detail token
2. Skill panggil `POST /deploy` dengan detail tsb
3. Memegrid backend:
   - Validasi (nama ≤60 char, simbol ≤20 char, cek duplikasi lewat token verification NOXA)
   - Build transaksi launch ke `LauncherFactory` NOXA di Robinhood Chain (`0xD9eC2db5f3D1b236843925949fe5bd8a3836FCcB`), `fee_wallet` = treasury/splitter Memegrid
   - Kirim ke Signer Service → tanda tangan via KMS → broadcast
   - Tunggu konfirmasi, catat ke tabel `launches`
4. Return `token_address`, link marketplace, `tx_hash` ke agent

### 8.3 Command `claim`
1. Agent panggil `claim` (opsional: token tertentu)
2. Memegrid cek `fee_ledger` — kalau ada fee accrued, eksekusi klaim on-chain
3. Split 70/30 dihitung, `agent_amount` dikirim ke `payout_address`
4. Return breakdown ke agent: gross, share agent, share Memegrid, tx hash

### 8.4 Indexer (berjalan terus di background)
- Dengarkan event `TokenLaunched` dari factory → isi `launches` real-time untuk marketplace
- Pantau fee accrued per pool (posisi V3 tiap token) → update `fee_ledger.accrued_amount` secara berkala, supaya agent bisa cek `balance`/`status` tanpa nunggu klaim

---

## 9. Keamanan & mitigasi risiko

| Risiko | Mitigasi |
|---|---|
| Agent spam deploy token sampah dalam volume besar | Rate limit per agent (mis. maks N deploy/jam), fee pendaftaran kecil, atau staking minimum untuk agent baru |
| Private key bocor | Custody penuh di KMS, signer service terisolasi (network policy, tidak exposed ke internet), tidak ada private key mentah di database manapun |
| Agent mengklaim fee milik token yang bukan mereka deploy | Validasi `launch.agent_id == requester.agent_id` sebelum eksekusi claim |
| Race condition saat banyak agent deploy bersamaan | Queue (BullMQ/Redis) di Deploy Orchestrator, nonce management per wallet ditangani signer service |
| NOXA mendeteksi bot/spam launch dan blokir | Hubungi tim NOXA untuk allowlist/partner access sebelum scale up (lihat catatan gap API di bawah) |
| Salah kirim payout ke alamat yang salah | Cooldown 24-48 jam setelah agent ubah `payout_address` sebelum bisa dipakai untuk claim |
| Anti-snipe window NOXA (maxWallet 2%, maxTx limit) bikin initial-buy gagal | Deploy orchestrator baca `maxWalletLimit`/`maxTxLimit` dari token sebelum submit initial buy, sesuaikan otomatis |

**Catatan penting yang belum terjawab dari dokumentasi publik NOXA:** fungsi *write* untuk create token (upload logo, submit nama/simbol) kemungkinan lewat backend NOXA sendiri (bukan pure on-chain call), bukan cuma manggil kontrak `LauncherFactory` langsung. Sebelum bangun Deploy Orchestrator, langkah pertama yang **harus** dilakukan:
1. Inspect transaksi launch asli di block explorer Robinhood Chain untuk lihat persis fungsi apa yang dipanggil ke `0xD9eC2db5f3D1b236843925949fe5bd8a3836FCcB`
2. Kontak tim NOXA (Telegram/Twitter mereka aktif) untuk tanya apakah ada partner/API access buat automated deployment — penting karena volume tinggi dari AI agent kemungkinan kena flag anti-bot mereka kalau tidak dikoordinasikan dulu

---

## 10. Roadmap implementasi bertahap

1. **Fase 0 — Riset teknis**: konfirmasi fungsi write NOXA (inspect tx di explorer + kontak tim NOXA), tentukan Opsi A vs B untuk fee split
2. **Fase 1 — MVP backend**: Agent Registry, Wallet Provisioning (KMS), Deploy Orchestrator (Opsi A ledger), endpoint `/deploy` dan `/claim` dasar
3. **Fase 2 — Skill package**: `memegrid-skill` siap install, command `deploy`/`claim`/`status`/`balance`, uji dengan beberapa agent internal
4. **Fase 3 — Indexer & marketplace**: dengar event on-chain real-time, frontend marketplace publik
5. **Fase 4 — Hardening**: rate limiting, cooldown payout address, audit keamanan wallet custody
6. **Fase 5 — On-chain splitter (Opsi B)**: audit kontrak `MemegridFeeSplitter`, migrasi dari ledger off-chain ke split trustless
