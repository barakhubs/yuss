# Laravel + React SaaS Template

## Introduction

A comprehensive SaaS template built with Laravel 12 and React, featuring multi-tenant organization management, subscription billing with Paddle, and a super admin system. This template provides everything you need to launch a fully-featured SaaS application.

## Features

### Core SaaS Features

- **Multi-tenant Organizations**: Complete organization management with role-based access
- **Super Admin System**: Comprehensive oversight and management capabilities
- **Subscription Billing**: Powered by Paddle for reliable payment processing
- **Flexible Pricing Plans**: Database-driven plans with customizable features
- **User Management**: Authentication, invitations, and role permissions
- **Modern UI**: Built with React 19, TypeScript, Tailwind CSS, and shadcn/ui

### Architecture

- **Frontend**: React 19 with TypeScript and Inertia.js
- **Backend**: Laravel 12 with robust multi-tenancy
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Payments**: Paddle integration for subscriptions and billing
- **Database**: SQLite (development) with migrations for production databases

## Quick Start

### 1. Installation

```bash
git clone <repository-url>
cd saas-template
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
```

### 2. Setup Paddle Integration

1. Sign up for a [Paddle account](https://paddle.com)
2. Get your credentials from the Paddle dashboard
3. Update your `.env` file:

```env
PADDLE_SELLER_ID=your_seller_id
PADDLE_CLIENT_SIDE_TOKEN=your_client_side_token
PADDLE_AUTH_CODE=your_auth_code
PADDLE_WEBHOOK_SECRET=your_webhook_secret
PADDLE_ENVIRONMENT=sandbox
```

4. Create products and prices in Paddle that match your plans:
    - Professional Plan: `pri_professional_monthly`
    - Enterprise Plan: `pri_enterprise_monthly`

5. Run the setup command:

```bash
php artisan paddle:setup-demo
```

### 3. Development

```bash
npm run dev
php artisan serve
```

Visit `http://localhost:8000` and log in with:

- **Admin**: `admin@example.com` / `password`
- **Super Admin**: `super@example.com` / `password`

## System Architecture

### User Roles

- **Super Admin**: Complete system oversight, plan management, organization monitoring
- **Organization Admin**: Organization management, subscription handling, user invitations
- **Organization User**: Basic access within assigned organization

### Organization Structure

- One organization per user (admin constraint)
- Role-based permissions using Spatie Laravel Permission
- Invitation system for team collaboration
- Plan-based feature limitations

### Subscription System

- Free plans (no payment required)
- Paid plans via Paddle integration
- Automatic plan assignment
- Webhook handling for subscription events
- Billing portal integration

## Usage Guide

### Super Admin Features

1. **Plan Management**: Create, edit, and manage subscription plans
2. **Organization Oversight**: View all organizations and their subscriptions
3. **Feature Configuration**: Set up plan features (limits, booleans, text)
4. **System Monitoring**: Complete administrative control

### Organization Management

1. **User Invitations**: Invite team members via email
2. **Subscription Management**: Subscribe to plans, manage billing
3. **Organization Settings**: Update organization details and preferences
4. **Team Management**: Manage user roles and permissions

### Subscription Flow

1. **Free Plans**: Immediate activation without payment
2. **Paid Plans**: Paddle checkout process with webhook confirmation
3. **Plan Switching**: Upgrade/downgrade with prorated billing
4. **Cancellation**: Maintain access until period end

## Configuration

### Environment Variables

```env
# Database
DB_CONNECTION=sqlite

# Paddle Integration
PADDLE_SELLER_ID=
PADDLE_CLIENT_SIDE_TOKEN=
PADDLE_AUTH_CODE=
PADDLE_WEBHOOK_SECRET=
PADDLE_ENVIRONMENT=sandbox

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_app_password
```

### Plans Configuration

Plans are managed through the super admin interface or database seeders:

```php
// Create a new plan
Plan::create([
    'name' => 'Starter',
    'slug' => 'starter',
    'price' => 0.00,
    'billing_period' => 'monthly',
    'paddle_price_id' => null, // Free plan
    'is_active' => true,
]);
```

## Development

### Frontend Development

```bash
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run type-check # TypeScript checking
```

### Backend Development

```bash
php artisan serve                 # Start Laravel server
php artisan migrate:fresh --seed  # Reset database
php artisan paddle:setup-demo     # Setup Paddle demo data
```

### Testing

```bash
php artisan test          # Run PHP tests
npm run test             # Run JavaScript tests
```

## API Documentation

### Subscription Endpoints

- `GET /organizations/{org}/subscriptions` - View subscription status
- `POST /organizations/{org}/subscriptions` - Create subscription
- `PATCH /organizations/{org}/subscriptions` - Update subscription
- `DELETE /organizations/{org}/subscriptions` - Cancel subscription

### Plan Management (Super Admin)

- `GET /super-admin/plans` - List all plans
- `POST /super-admin/plans` - Create new plan
- `PUT /super-admin/plans/{plan}` - Update plan
- `DELETE /super-admin/plans/{plan}` - Delete plan

## Deployment

### Production Setup

1. Configure production database
2. Set up production Paddle account
3. Configure environment variables
4. Set up SSL certificates
5. Configure webhooks URL in Paddle

### Environment Configuration

```env
APP_ENV=production
APP_DEBUG=false
PADDLE_ENVIRONMENT=live
```

## Support

For issues and questions:

1. Check the documentation
2. Review existing GitHub issues
3. Create a new issue with detailed information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

This SaaS template is open-sourced software licensed under the MIT license.
