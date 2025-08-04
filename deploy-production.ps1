# Production Deployment Script for Yukon Savings SACCO (Windows)
Write-Host "🚀 Starting Production Deployment..." -ForegroundColor Green

# Step 1: Set environment to production
Write-Host "⚙️ Setting production environment..." -ForegroundColor Yellow
$env:APP_ENV = "production"
$env:APP_DEBUG = "false"

# Step 2: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
composer install --optimize-autoloader --no-dev --no-interaction
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm ci --production=false
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Step 3: Clear all caches
Write-Host "🧹 Clearing caches..." -ForegroundColor Yellow
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Step 4: Build production assets
Write-Host "🏗️ Building production assets..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { 
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit $LASTEXITCODE 
}

# Step 5: Optimize Laravel for production
Write-Host "⚡ Optimizing for production..." -ForegroundColor Yellow
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Step 6: Run database migrations
Write-Host "🗄️ Running migrations..." -ForegroundColor Yellow
php artisan migrate --force

# Step 7: Verify build files
Write-Host "✅ Verifying build files..." -ForegroundColor Yellow
if (Test-Path "public/build/manifest.json") {
    Write-Host "✓ Manifest file exists" -ForegroundColor Green
} else {
    Write-Host "✗ Manifest file missing - rebuilding..." -ForegroundColor Red
    npm run build
}

$welcomeFiles = Get-ChildItem -Path "public/build/assets" -Filter "welcome-*.js"
if ($welcomeFiles.Count -gt 0) {
    Write-Host "✓ Welcome component built successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Welcome component missing" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Post-deployment checklist:" -ForegroundColor Cyan
Write-Host "  - Verify your web server points to /public directory"
Write-Host "  - Ensure .env file has correct production values"
Write-Host "  - Check file permissions on storage/ and bootstrap/cache/"
Write-Host "  - Verify SSL certificate is active"
Write-Host "  - Test the application in a browser"
