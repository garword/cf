#!/bin/bash

# Email Routing Manager - Local Development Script
# Untuk development lokal dengan Wrangler

set -e

echo "🔧 Email Routing Manager - Local Development"
echo "=========================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI tidak ditemukan. Install dengan:"
    echo "npm install -g wrangler"
    exit 1
fi

# Build CSS in watch mode
echo "🎨 Building CSS dengan watch..."
npm run tailwind &
TAILWIND_PID=$!

# Start local development server
echo "🚀 Starting local development server..."
echo "🌐 Aplikasi akan tersedia di: http://localhost:8787"
echo "📊 Logs akan muncul di bawah ini"
echo ""

# Trap to kill tailwind on exit
trap "echo '🛑 Stopping Tailwind...'; kill $TAILWIND_PID 2>/dev/null; exit" INT TERM

# Start wrangler dev
wrangler dev --local --port 8787