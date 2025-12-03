#!/bin/bash

# Email Routing Manager - Quick Deploy Script
# Deployment otomatis ke Cloudflare Workers

set -e

echo "🚀 Email Routing Manager - Quick Deploy"
echo "===================================="

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fungsi helper
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v git &> /dev/null; then
    print_error "Git tidak terinstall. Install dengan: sudo apt-get install git"
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js tidak terinstall. Download dari https://nodejs.org"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "NPM tidak terinstall"
    exit 1
fi

print_success "Git, Node.js, dan NPM terinstall"

# Check wrangler
if ! command -v wrangler &> /dev/null; then
    print_info "Installing Wrangler CLI..."
    npm install -g wrangler
    if [ $? -eq 0 ]; then
        print_success "Wrangler CLI berhasil diinstall"
    else
        print_error "Gagal install Wrangler CLI"
        exit 1
    fi
else
    print_success "Wrangler CLI sudah terinstall"
fi

# Check login status
echo "🔐 Checking Cloudflare login..."
if ! wrangler whoami &> /dev/null; then
    print_warning "Anda belum login ke Cloudflare"
    print_info "Silakan login: wrangler login"
    wrangler login
    if [ $? -eq 0 ]; then
        print_success "Login berhasil"
    else
        print_error "Login gagal"
        exit 1
    fi
else
    print_success "Sudah login ke Cloudflare"
fi

# Clone atau update repository
REPO_DIR="email-routing-manager-cf"
if [ -d "$REPO_DIR" ]; then
    print_info "Repository sudah ada, mengupdate..."
    cd "$REPO_DIR"
    git pull origin main
else
    print_info "Mengclone repository..."
    git clone https://github.com/garword/cf.git "$REPO_DIR"
    cd "$REPO_DIR"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies berhasil diinstall"
else
    print_error "Gagal install dependencies"
    exit 1
fi

# Build CSS
echo "🎨 Building CSS..."
npm run build
if [ $? -eq 0 ]; then
    print_success "CSS berhasil dibuild"
else
    print_error "Gagal build CSS"
    exit 1
fi

# Setup D1 database
echo "💾 Setting up D1 database..."
if ! wrangler d1 list | grep -q "email-routing-db"; then
    print_info "Membuat D1 database baru..."
    wrangler d1 create email-routing-db
    if [ $? -eq 0 ]; then
        print_success "D1 database berhasil dibuat"
    else
        print_error "Gagal membuat D1 database"
        exit 1
    fi
else
    print_success "D1 database sudah ada"
fi

# Apply migrations
echo "🔄 Applying database migrations..."
npm run db:migrate
if [ $? -eq 0 ]; then
    print_success "Database migrations berhasil diapply"
else
    print_error "Gagal apply database migrations"
    exit 1
fi

# Update wrangler.toml dengan database ID
echo "⚙️ Updating wrangler.toml..."
DB_ID=$(wrangler d1 list --json | grep -o '"id":"[^"]*"' | grep -o '"[^"]*"' | tr -d '"' | head -1)
if [ ! -z "$DB_ID" ]; then
    # Update wrangler.toml dengan database ID
    sed -i "s/your-d1-database-id/$DB_ID/g" wrangler.toml
    print_success "Database ID berhasil diupdate: $DB_ID"
else
    print_warning "Database ID tidak ditemukan, silakan update manual wrangler.toml"
fi

# Deploy ke Cloudflare Workers
echo "🚀 Deploying ke Cloudflare Workers..."
wrangler deploy
if [ $? -eq 0 ]; then
    print_success "Deployment berhasil!"
    
    # Dapatkan URL deployment
    WORKER_URL=$(wrangler whoami | grep -o '"Account Name":"[^"]*"' | grep -o '"[^"]*"' | tr -d '"' | tr '[:upper:]' '[:lower:]')
    if [ ! -z "$WORKER_URL" ]; then
        echo ""
        print_info "Aplikasi tersedia di: https://email-routing-manager-cf.$WORKER_URL.workers.dev"
        echo ""
        print_info "Custom domain setup: wrangler custom-domains add yourdomain.com"
        echo ""
        print_info "View logs: wrangler tail"
        print_info "Local development: npm run dev"
    else
        print_warning "URL deployment tidak dapat ditentukan"
    fi
else
    print_error "Deployment gagal!"
    print_error "Silakan check error logs di atas"
    exit 1
fi

echo ""
print_success "🎉 Email Routing Manager berhasil di-deploy!"
echo "===================================="
echo ""
echo "📋 Quick Commands:"
echo "  View logs:      wrangler tail"
echo "  Local dev:     cd $REPO_DIR && npm run dev"
echo "  Redeploy:      cd $REPO_DIR && npm run deploy"
echo "  Database ops:   cd $REPO_DIR && wrangler d1 execute email-routing-db --local 'SELECT * FROM cloudflare_configs'"
echo ""
echo "🌐 Configuration:"
echo "  Edit config:    cd $REPO_DIR && nano wrangler.toml"
echo "  Add secrets:    wrangler secret put CLOUDFLARE_API_TOKEN"
echo "  Custom domain:   wrangler custom-domains add yourdomain.com"
echo ""