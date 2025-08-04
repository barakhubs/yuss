#!/bin/bash

# Production Deployment Script for Yukon Savings SACCO
echo "🚀 Starting Production Deployment..."

# Step 1: Set environment to production
echo "⚙️ Setting production environment..."
export APP_ENV=production
export APP_DEBUG=false

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
composer install --optimize-autoloader --no-dev --no-interaction
npm ci --production=false

# Step 3: Clear all caches
echo "🧹 Clearing caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Step 4: Build production assets
echo "🏗️ Building production assets..."
npm run build

# Step 5: Optimize Laravel for production
echo "⚡ Optimizing for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Step 6: Run database migrations
echo "🗄️ Running migrations..."
php artisan migrate --force

# Step 7: Set proper permissions
echo "🔐 Setting file permissions..."
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache public/build

# Step 8: Verify build files
echo "✅ Verifying build files..."
if [ -f "public/build/manifest.json" ]; then
    echo "✓ Manifest file exists"
else
    echo "✗ Manifest file missing - rebuilding..."
    npm run build
fi

if [ -f "public/build/assets/welcome-"*.js ]; then
    echo "✓ Welcome component built successfully"
else
    echo "✗ Welcome component missing"
    exit 1
fi

echo "🎉 Deployment complete!"
echo ""
echo "📋 Post-deployment checklist:"
echo "  - Verify your web server points to /public directory"
echo "  - Ensure .env file has correct production values"
echo "  - Check file permissions on storage/ and bootstrap/cache/"
echo "  - Verify SSL certificate is active"
echo "  - Test the application in a browser"
