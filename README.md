# Memulai Cepat

## 1. Instal Dependencies
```bash
npm install
```

FOR WINDOWS
```bash
npm install -g pnpm
```

## 2. Atur Variabel Lingkungan (Environment Variables)
```bash
cp .env.example .env.local
```
Kemudian edit `.env.local` dengan API key asli Anda (lihat instruksi dalam file tersebut).

## 3. Jalankan Development Server
FOR WINDOWS
```bash
pnpm install
pnpm dev
```

FOR MAC OS / LINUX
```bash
npm install --legacy-peer-deps
npm run dev
```

## Pengaturan Environment

### API Key yang Diperlukan

Proyek ini memerlukan API key Groq untuk fitur bertenaga AI.

**Setup Cepat:**
1. Salin `.env.example` ke `.env.local`
2. Dapatkan API key Groq dari [Groq Console](https://console.groq.com/)
3. Ganti placeholder di `.env.local`

**Instruksi detail ada di file `.env.example`.**

⚠️ **Penting:** Jangan pernah commit file `.env.local` - file tersebut berisi API key sensitif!

---

# Quick Start

## 1. Install Dependencies
```bash
npm install
```

FOR WINDOWS
```bash
npm install -g pnpm
```

## 2. Set Up Environment Variables
```bash
cp .env.example .env.local
```
Then edit `.env.local` with your actual API keys (see instructions in the file).

## 3. Run the Development Server
FOR WINDOWS
```bash
pnpm install
pnpm dev
```

FOR MAC OS / LINUX
```bash
npm install --legacy-peer-deps
npm run dev
```

## Environment Setup

### Required API Keys

This project requires a Groq API key for AI-powered features.

**Quick Setup:**
1. Copy `.env.example` to `.env.local`
2. Get your Groq API key from [Groq Console](https://console.groq.com/)
3. Replace the placeholder in `.env.local`

**Detailed instructions are in the `.env.example` file.**

⚠️ **Important:** Never commit your `.env.local` file - it contains sensitive API keys!