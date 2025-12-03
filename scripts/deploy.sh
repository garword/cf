#!/bin/bash

# Email Routing Manager - Deployment Script
# Untuk deployment ke Cloudflare Workers

set -e

echo "🚀 Email Routing Manager - Cloudflare Workers Deployment"
echo "=================================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI tidak ditemukan. Install dengan:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is logged in
echo "🔍 Mengecek login status..."
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Login ke Cloudflare..."
    wrangler login
fi

# Build CSS
echo "🎨 Building CSS..."
npm run build

# Create D1 database if not exists
echo "💾 Setting up D1 database..."
if ! wrangler d1 list | grep -q "email-routing-db"; then
    echo "📝 Membuat D1 database baru..."
    wrangler d1 create email-routing-db
fi

# Apply migrations
echo "🔄 Applying database migrations..."
npm run db:migrate

# Deploy to production
echo "🚀 Deploying ke production..."
wrangler deploy

echo ""
echo "✅ Deployment selesai!"
echo "🌐 Aplikasi tersedia di: https://email-routing-manager.your-subdomain.workers.dev"
echo ""
echo "📊 Dashboard: https://dash.cloudflare.com"
echo "📝 Logs: wrangler tail"
echo ""
echo "🎉 Selamat menggunakan Email Routing Manager di Cloudflare Workers!"