# Email Routing Manager - Cloudflare Workers Version

Versi Email Routing Manager yang dapat di-deploy di Cloudflare Workers dengan semua fitur yang sama seperti versi Next.js.

## 🚀 Fitur Utama

### ✅ Multiple Konfigurasi Cloudflare (Maksimal 4)
- **Tambah Konfigurasi**: Hingga 4 konfigurasi Cloudflare berbeda
- **Edit Konfigurasi**: Update API token dan settings
- **Hapus Konfigurasi**: Soft delete dengan validasi
- **Switch Config**: Dropdown selector untuk ganti konfigurasi aktif

### ✅ Email Routing Management
- **Buat Email Routing**: Otomatis dan manual mode
- **Nama Indonesia Generator**: Auto-generate nama Indonesia + random
- **Domain Selection**: Load zones dari Cloudflare API
- **Email Destination**: Pilih dari pre-configured emails
- **Delete Routing**: Hapus dengan konfirmasi

### ✅ UI/UX Modern
- **Responsive Design**: Optimal di desktop dan mobile
- **Dark Mode**: Mode gelap untuk kenyamanan mata
- **Real-time Updates**: Auto-refresh data
- **Toast Notifications**: Feedback untuk setiap aksi
- **Loading States**: Indikator loading yang jelas

### ✅ Keamanan
- **API Token Encryption**: Token tersimpan aman di D1 database
- **Input Validation**: Validasi semua input user
- **CORS Protection**: Konfigurasi CORS yang aman
- **Error Handling**: Comprehensive error messages

## 🛠 Teknologi

### Backend (Cloudflare Workers)
- **Runtime**: Cloudflare Workers (V8 isolates)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare KV untuk caching
- **Router**: Itty-Router untuk API routing
- **Validation**: Zod untuk input validation

### Frontend
- **Framework**: Vanilla JavaScript dengan Alpine.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide icons (SVG)
- **State Management**: Alpine.js reactivity
- **Build**: Tailwind CLI untuk CSS generation

## 📁 Struktur Project

```
cloudflare-workers-version/
├── src/
│   ├── index.js                 # Main Workers entry point
│   ├── utils.js                 # Utility functions
│   └── api/
│       ├── configs.js           # Configuration API handlers
│       ├── zones.js            # Zones API handlers
│       └── email-routing.js   # Email routing API handlers
├── public/
│   ├── index.html              # Main HTML file
│   ├── app.js                 # Frontend JavaScript
│   └── styles.css             # Generated CSS
├── migrations/
│   └── 0001_initial_schema.sql # Database schema
├── wrangler.toml               # Wrangler configuration
├── package.json               # Dependencies
├── tailwind.config.js        # Tailwind configuration
└── postcss.config.js        # PostCSS configuration
```

## 🚀 Installation & Setup

### 1. Prerequisites
- Node.js 18+
- Wrangler CLI
- Akun Cloudflare dengan Workers & D1 enabled

### 2. Install Dependencies
```bash
cd cloudflare-workers-version
npm install
```

### 3. Environment Setup
Edit `wrangler.toml`:
```toml
# Ganti dengan ID D1 database Anda
[[d1_databases]]
binding = "DB"
database_name = "email-routing-db"
database_id = "your-d1-database-id"

# Ganti dengan KV namespace Anda
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

### 4. Database Migration
```bash
# Create D1 database
wrangler d1 create email-routing-db

# Apply migrations
npm run db:migrate

# For local development
npm run db:local
```

### 5. Build CSS
```bash
# Development dengan watch
npm run tailwind

# Production build
npm run build
```

## 🚀 Deployment

### Development
```bash
# Local development
npm run dev
```

### Production
```bash
# Deploy ke production
npm run deploy

# Deploy ke staging
wrangler deploy --env staging
```

## 📊 API Endpoints

### Configuration Management
- **GET** `/api/configs` - Get all configurations
- **POST** `/api/configs` - Create new configuration
- **PUT** `/api/configs` - Update configuration
- **DELETE** `/api/configs?id={id}` - Delete configuration

### Zone Management
- **GET** `/api/zones?configId={id}` - Get zones for configuration

### Email Routing
- **GET** `/api/email-routing?configId={id}` - Get email routing list
- **POST** `/api/email-routing` - Create email routing
- **DELETE** `/api/email-routing/{id}` - Delete email routing

## 🔧 Environment Variables

### wrangler.toml
```toml
[vars]
ENVIRONMENT = "production"
MAX_CONFIGS = "4"

[env.production.vars]
ENVIRONMENT = "production"
ALLOWED_ORIGINS = "https://your-domain.com"
```

### Secrets
```bash
# Set secrets untuk production
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put DATABASE_ENCRYPTION_KEY
```

## 🎨 Customization

### Branding
Edit `public/index.html`:
```html
<title>Your App Name</title>
<meta name="description" content="Your description">
```

### Colors
Edit `tailwind.config.js`:
```js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#your-color',
        // ... color variants
      }
    }
  }
}
```

## 🔒 Security Features

### Input Validation
- Zod schemas untuk semua input
- Type checking dan sanitization
- SQL injection prevention

### API Security
- CORS configuration
- Rate limiting (dapat ditambahkan)
- Request validation

### Data Protection
- Sensitive data encryption
- Environment variable usage
- No hardcoded credentials

## 📈 Performance

### Caching
- KV storage untuk cache zones
- Browser caching untuk static assets
- Optimized database queries

### Optimization
- Minimal bundle size
- Efficient CSS generation
- Fast API responses

## 🐛 Debugging

### Local Development
```bash
# Enable verbose logging
wrangler dev --log-level debug

# View D1 database
wrangler d1 execute email-routing-db --local "SELECT * FROM cloudflare_configs"
```

### Production Debugging
```bash
# View logs
wrangler tail

# Real-time metrics
wrangler analytics
```

## 🔄 Migration dari Next.js

### Data Migration
1. Export data dari Next.js app
2. Import ke D1 database
3. Update API endpoints

### API Compatibility
- Semua endpoint memiliki signature yang sama
- Response format identik
- Error handling konsisten

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Advanced Features

### Rate Limiting (Optional)
```javascript
// Tambahkan di src/utils.js
export async function rateLimit(ip, limit = 100) {
  const key = `rate_limit:${ip}`;
  const count = await env.CACHE.get(key);
  
  if (count && parseInt(count) > limit) {
    throw new Error('Rate limit exceeded');
  }
  
  await env.CACHE.put(key, (parseInt(count || 0) + 1).toString(), { expirationTtl: 3600 });
}
```

### Analytics Integration
```javascript
// Tambahkan tracking
export async function trackEvent(event, data) {
  await env.CACHE.put(`analytics:${Date.now()}`, JSON.stringify({ event, data }));
}
```

## 📞 Support

### Documentation
- [Cloudflare Workers docs](https://developers.cloudflare.com/workers/)
- [D1 Database docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI docs](https://developers.cloudflare.com/workers/wrangler/)

### Troubleshooting
1. Check wrangler.toml configuration
2. Verify D1 database permissions
3. Check environment variables
4. Review migration files

---

**Email Routing Manager Workers Version** - Solusi modern untuk mengelola email Cloudflare di Cloudflare Workers! 🚀