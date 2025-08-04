# Yukon Savings SACCO Management System

## Introduction

A comprehensive SACCO (Savings and Credit Cooperative Organization) management system built with Laravel 11 and React. This system provides everything needed to manage member savings, loans, quarterly operations, and interest distribution for the Yukon Savings SACCO.

## Features

### Core SACCO Features

- **Member Management**: Complete member profiles with role-based access (Admin, Chairperson, Secretary, Treasurer, Disburser, Member)
- **Quarterly Savings Management**: Automated quarterly savings target setting and tracking
- **Monthly Savings Collection**: Streamlined monthly savings recording with admin oversight
- **Loan Management**: End-to-end loan processing with approval workflows and repayment tracking
- **Interest Distribution**: Automated interest calculations and fair distribution based on savings contributions
- **Share-out System**: End-of-quarter profit sharing with member decision tracking
- **Email Notifications**: Comprehensive notification system for all SACCO activities
- **Real-time Filtering**: Advanced filtering and search capabilities across all modules

### Technical Architecture

- **Frontend**: React 19 with TypeScript and Inertia.js
- **Backend**: Laravel 11 with UUID-based database structure
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Database**: SQLite (development) with support for production databases
- **Authentication**: Laravel Breeze with role-based permissions

## Quick Start

### 1. Installation

```bash
git clone <repository-url>
cd yuss
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
```

### 2. Setup Default Admin User

The seeder creates a default admin user for the SACCO:

- **Email**: `admin@yukonsoftware.com`
- **Password**: `password`
- **Role**: Chairperson (Admin)

Additional demo members are also created for testing.

### 3. Development

```bash
npm run dev
php artisan serve
```

Visit `http://localhost:8000` and log in with the admin credentials above.

## SACCO System Overview

### User Roles

- **Chairperson**: Full administrative access, loan approvals, system oversight
- **Secretary**: Member management, record keeping, system administration
- **Treasurer**: Financial oversight, savings management, reporting
- **Disburser**: Loan disbursement and repayment processing
- **Member**: Personal savings and loan management, share-out participation

### Quarterly Operations

The SACCO operates on a quarterly basis:

1. **Q1**: January - April (Months 01-04)
2. **Q2**: May - August (Months 05-08)
3. **Q3**: September - December (Months 09-12)

### Savings Management

- **Target Setting**: Members set quarterly savings targets at the beginning of each quarter
- **Monthly Collection**: Admins initiate monthly savings based on targets
- **Tracking**: Real-time tracking of individual and collective savings progress
- **History**: Comprehensive savings history with detailed reporting

### Loan System

- **Application**: Members can apply for loans with purpose and amount
- **Approval Workflow**: Chairperson approval required for all loans
- **Interest Calculation**: Fixed 5% interest rate with automated calculations
- **Repayment Tracking**: Detailed repayment schedules and progress monitoring

## Database Structure

### Core Models

- **User**: SACCO members with role-based permissions
- **Quarter**: Quarterly periods for SACCO operations
- **MemberSavingsTarget**: Individual quarterly savings targets
- **Saving**: Monthly savings records
- **Loan**: Loan applications and management
- **LoanRepayment**: Loan repayment tracking
- **ShareoutDecision**: End-of-quarter profit sharing decisions

### UUID Implementation

The system uses UUID primary keys for enhanced security and scalability:

- All models use Laravel's `HasUuids` trait
- Foreign key relationships maintained with UUID references
- Permission system configured for UUID compatibility

## Key Features

### Admin Dashboard

- **Member Overview**: Complete member statistics and management
- **Quarterly Planning**: Quarter creation and management
- **Savings Administration**: Monthly savings initiation and tracking
- **Loan Processing**: Application review and approval workflows
- **Financial Reports**: Comprehensive reporting and analytics

### Member Portal

- **Personal Dashboard**: Individual savings and loan overview
- **Target Setting**: Quarterly savings target configuration
- **Loan Applications**: Apply for loans with detailed information
- **Transaction History**: Complete financial transaction history
- **Share-out Participation**: End-of-quarter profit sharing decisions

### Email Notifications

Comprehensive notification system for:

- Savings target reminders
- Monthly savings confirmations
- Loan application updates
- Approval notifications
- Share-out announcements
- General SACCO communications

### Interest Distribution System

- **Automatic Calculations**: Interest calculated based on savings contributions
- **Fair Distribution**: Proportional distribution based on individual savings
- **Member Choice**: Members can choose to take share-out or reinvest
- **Quarterly Processing**: End-of-quarter interest distribution
- **Detailed Tracking**: Complete audit trail of all distributions

## Usage Guide

### For SACCO Administrators

1. **Quarter Management**: Create and activate quarterly periods
2. **Member Onboarding**: Add new members and assign appropriate roles
3. **Savings Coordination**: Initiate monthly savings and track progress
4. **Loan Processing**: Review applications, approve loans, track repayments
5. **Financial Oversight**: Monitor SACCO financial health and generate reports

### For SACCO Members

1. **Set Savings Targets**: Configure quarterly savings goals
2. **Track Progress**: Monitor monthly savings and overall progress
3. **Apply for Loans**: Submit loan applications with required documentation
4. **Manage Repayments**: Track loan balances and make repayments
5. **Participate in Share-outs**: Make end-of-quarter profit sharing decisions

### Email Notification System

The system automatically sends notifications for:

- New member welcome emails
- Savings target reminders
- Monthly savings confirmations
- Loan application status updates
- Approval and disbursement notifications
- Share-out opportunity announcements

## Configuration

### Environment Variables

```env
# Database
DB_CONNECTION=sqlite

# Mail Configuration (Required for notifications)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_app_password
MAIL_FROM_ADDRESS=noreply@yukonsacco.com
MAIL_FROM_NAME="Yukon Savings SACCO"

# Application
APP_NAME="Yukon Savings SACCO"
APP_URL=http://localhost:8000
```

### SACCO Configuration

Key settings can be configured in the admin panel:

- Interest rates (currently fixed at 5%)
- Quarterly periods and dates
- Member roles and permissions
- Email notification templates

## Development

### Frontend Development

```bash
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run type-check # TypeScript checking
```

### Backend Development

```bash
php artisan serve                   # Start Laravel server
php artisan migrate:fresh --seed    # Reset database with sample data
php artisan queue:work              # Start queue worker for emails
```

### Testing

```bash
php artisan test          # Run PHP tests
npm run test             # Run JavaScript tests
```

## API Documentation

### Admin Endpoints

- `GET /admin/savings` - View savings overview
- `POST /admin/savings` - Initiate monthly savings
- `GET /admin/loans` - View all loan applications
- `PATCH /admin/loans/{loan}` - Approve/deny loans

### Member Endpoints

- `GET /dashboard` - Member dashboard
- `POST /savings-targets` - Set quarterly targets
- `POST /loans` - Apply for loans
- `GET /transactions` - View transaction history

## Deployment

### Production Setup

1. Configure production database (MySQL/PostgreSQL recommended)
2. Set up email service provider
3. Configure environment variables
4. Set up SSL certificates
5. Configure task scheduling for quarterly operations

### Environment Configuration

```env
APP_ENV=production
APP_DEBUG=false
QUEUE_CONNECTION=database
```

## Support

For SACCO system support:

1. Contact system administrator
2. Check user documentation
3. Review quarterly operation procedures

## Development Roadmap

### Planned Features

- Mobile application for members
- Advanced financial reporting
- Integration with banking systems
- Automated SMS notifications
- Member self-service portal enhancements

## License

This project is proprietary software developed specifically for Yukon Savings SACCO operations.
