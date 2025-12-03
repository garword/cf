# Deployment Guide for Email Routing Manager - Cloudflare Workers

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd cloudflare-workers-version
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Cloudflare Account
```bash
# Login ke Cloudflare
wrangler login

# Buat D1 database
wrangler d1 create email-routing-db

# Catat database ID yang muncul
```

### 4. Configure wrangler.toml
Edit `wrangler.toml` dan ganti:
- `your-d1-database-id` dengan ID D1 database Anda
- `your-kv-namespace-id` dengan KV namespace ID (buat jika perlu)

### 5. Deploy
```bash
# Development
npm run dev

# Production
npm run deploy
```

## 🔧 Configuration Details

### D1 Database Setup
```bash
# Buat database
wrangler d1 create email-routing-db

# Apply migrations
npm run db:migrate

# Verify setup
wrangler d1 execute email-routing-db "SELECT COUNT(*) as count FROM cloudflare_configs"
```

### KV Namespace Setup (Optional)
```bash
# Buat KV namespace
wrangler kv:namespace create "CACHE"

# Update wrangler.toml dengan ID yang muncul
```

### Environment Variables
```bash
# Set secrets untuk production
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put ENCRYPTION_KEY
```

## 🌐 Deployment Options

### Option 1: Automatic Script
```bash
./scripts/deploy.sh
```

### Option 2: Manual Commands
```bash
# Build CSS
npm run build

# Deploy
wrangler deploy
```

### Option 3: Staging Environment
```bash
wrangler deploy --env staging
```

## 📊 Monitoring & Debugging

### View Logs
```bash
# Real-time logs
wrangler tail

# Historical logs
wrangler tail --since 1h
```

### Database Operations
```bash
# Query database
wrangler d1 execute email-routing-db "SELECT * FROM cloudflare_configs"

# Local development
wrangler d1 execute email-routing-db --local "SELECT * FROM cloudflare_configs"
```

### Performance Analytics
```bash
# View analytics
wrangler analytics

# Export data
wrangler analytics --format csv > analytics.csv
```

## 🔒 Security Configuration

### CORS Setup
Edit `wrangler.toml`:
```toml
[env.production.vars]
ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com"
```

### Rate Limiting (Optional)
Tambahkan di `src/utils.js`:
```javascript
export async function rateLimit(ip, limit = 100) {
  const key = `rate_limit:${ip}`;
  const count = await env.CACHE.get(key);
  
  if (count && parseInt(count) > limit) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  
  await env.CACHE.put(key, (parseInt(count || 0) + 1).toString(), { 
    expirationTtl: 3600 
  });
}
```

## 🚀 Production Checklist

### Pre-deployment
- [ ] Update `wrangler.toml` dengan production values
- [ ] Set environment variables
- [ ] Test semua API endpoints
- [ ] Verify database migrations
- [ ] Check CORS configuration

### Post-deployment
- [ ] Test aplikasi di production URL
- [ ] Verify semua fitur berfungsi
- [ ] Check error logs
- [ ] Monitor performance metrics

## 🔄 Updates & Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Build dan deploy
npm run build
npm run deploy
```

### Database Updates
```bash
# Buat migration baru
wrangler d1 migrations create email-routing-db --sql

# Apply migration
npm run db:migrate
```

### Rollback
```bash
# Deploy ke versi sebelumnya
wrangler deploy --compatibility-date 2023-10-01
```

## 📱 Custom Domain Setup

### Custom Domain
```bash
# Tambahkan custom domain
wrangler custom-domains add yourdomain.com

# Verify SSL certificate
wrangler custom-domains list
```

### DNS Configuration
```
Type: CNAME
Name: your-subdomain
Value: your-worker.your-subdomain.workers.dev
TTL: 300
```

## 🎯 Best Practices

### Performance
- Gunakan caching untuk static assets
- Optimasi database queries
- Minify CSS dan JavaScript
- Enable compression

### Security
- Validasi semua input
- Gunakan HTTPS
- Implement rate limiting
- Regular security audits

### Monitoring
- Track error rates
- Monitor response times
- Set up alerts
- Regular log reviews

## 🆘 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Check D1 binding
wrangler d1 list

# Verify database ID
wrangler d1 info email-routing-db
```

#### 2. CORS Error
```bash
# Check environment variables
wrangler secret list

# Test CORS headers
curl -H "Origin: https://yourdomain.com" https://your-worker.workers.dev/api/configs
```

#### 3. Build Error
```bash
# Clear cache
rm -rf public/styles.css

# Rebuild
npm run build
```

#### 4. Deployment Failed
```bash
# Check wrangler auth
wrangler whoami

# Re-authenticate
wrangler login
```

### Debug Commands
```bash
# Verbose logging
wrangler dev --log-level debug

# Local testing
wrangler dev --local

# Preview deployment
wrangler deploy --dry-run
```

## 📞 Support

### Documentation
- [Cloudflare Workers docs](https://developers.cloudflare.com/workers/)
- [D1 Database docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI docs](https://developers.cloudflare.com/workers/wrangler/)

### Community
- [Cloudflare Discord](https://discord.gg/cloudflare)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/cloudflare-workers)
- [GitHub Issues](https://github.com/cloudflare/workers-sdk/issues)

---

**Happy deploying! 🚀**