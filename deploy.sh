#!/bin/bash

# Yukon Savings SACCO Deployment Script
echo "🚀 Deploying Yukon Savings SACCO..."

# Step 1: Build assets
echo "📦 Building production assets..."
npm install
npm run build

# Step 2: Install PHP dependencies
echo "🐘 Installing PHP dependencies..."
composer install --optimize-autoloader --no-dev

# Step 3: Set up environment
echo "⚙️ Setting up production environment..."
cp .env.production .env
php artisan key:generate --force

# Step 4: Database setup
echo "🗄️ Setting up database..."
php artisan migrate --force

# Step 5: Cache optimization
echo "⚡ Optimizing caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Step 6: Set permissions
echo "🔐 Setting file permissions..."
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

echo "✅ Deployment complete!"
echo "🔗 Don't forget to:"
echo "   - Update your .env with production values"
echo "   - Set up SSL certificate"
echo "   - Configure your web server"
echo "   - Create admin user in database"
