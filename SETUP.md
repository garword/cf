# 🚀 Setup Instructions untuk Repository Anda

Repository Anda sudah siap! Berikut langkah-langkah untuk deployment:

## 📁 **Repository Status**
✅ **Repository**: https://github.com/garword/cf.git
✅ **Files**: 17 files berhasil di-push
✅ **Commit**: Email Routing Manager for Cloudflare Workers
✅ **Branch**: main

## 🛠 **Setup Cloudflare Workers**

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login ke Cloudflare
```bash
wrangler login
```

### 3. Clone Repository Anda
```bash
git clone https://github.com/garword/cf.git
cd cf
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Buat D1 Database
```bash
wrangler d1 create email-routing-db
```

### 6. Update wrangler.toml
Edit file `wrangler.toml` dan ganti:
- `your-d1-database-id` dengan ID D1 database yang baru dibuat
- `your-kv-namespace-id` dengan KV namespace ID (jika perlu)

### 7. Apply Database Migrations
```bash
npm run db:migrate
```

### 8. Build CSS
```bash
npm run build
```

### 9. Deploy ke Cloudflare Workers
```bash
npm run deploy
```

## 🌐 **Deployment Result**

Setelah deployment, aplikasi Anda akan tersedia di:
- **URL**: https://email-routing-manager.your-subdomain.workers.dev
- **Custom Domain**: Bisa setup custom domain

## 📊 **Fitur yang Tersedia**

### ✅ **Multiple Konfigurasi (Max 4)**
- Tambah, edit, hapus konfigurasi Cloudflare
- Switch antar konfigurasi dengan dropdown
- Validasi nama unik dan dependency checks

### ✅ **Email Routing Management**
- Auto mode dengan generator nama Indonesia
- Manual mode untuk custom alias
- Real-time preview email yang akan dibuat
- Copy to clipboard functionality

### ✅ **Modern UI/UX**
- Responsive design untuk mobile & desktop
- Dark mode support
- Toast notifications
- Loading states dan animations

### ✅ **Security Features**
- Input validation dengan Zod
- CORS protection
- API token encryption
- Error handling yang komprehensif

## 🔧 **Konfigurasi Tambahan**

### Environment Variables
```bash
# Set secrets untuk production
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put DATABASE_ENCRYPTION_KEY
```

### Custom Domain
```bash
# Tambahkan custom domain
wrangler custom-domains add yourdomain.com
```

### Rate Limiting (Optional)
Tambahkan di `src/utils.js`:
```javascript
export async function rateLimit(ip, limit = 100) {
  const key = `rate_limit:${ip}`;
  const count = await env.CACHE.get(key);
  if (count && parseInt(count) > limit) {
    throw new Error('Rate limit exceeded');
  }
  await env.CACHE.put(key, (parseInt(count || 0) + 1).toString(), { 
    expirationTtl: 3600 
  });
}
```

## 🎯 **Quick Start Commands**

```bash
# Development lokal
npm run dev

# Production deployment
npm run deploy

# View logs
wrangler tail

# Database operations
wrangler d1 execute email-routing-db "SELECT * FROM cloudflare_configs"
```

## 📞 **Support**

Jika mengalami masalah:
1. Check `wrangler.toml` configuration
2. Verify D1 database permissions
3. Review error logs dengan `wrangler tail`
4. Check environment variables
5. Refer ke `DEPLOYMENT.md` untuk detail

---

**🎉 Selamat! Repository Anda sudah siap untuk deployment ke Cloudflare Workers!**