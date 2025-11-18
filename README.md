# Unicard Serverless - ID Card Management System

A modern, mobile-first serverless ID card management platform for schools and administrators.

## 🏗️ Architecture

This project consists of three main components:

1. **School Portal** (`school-portal/`) - React 18 + TypeScript + Vite
2. **Admin Portal** (`admin-portal/`) - React 18 + TypeScript + Vite  
3. **API** (`api/`) - Node.js serverless functions

## 🚀 Tech Stack

### Frontend (Both Portals)
- React 18 with TypeScript
- Vite 5.x for blazing fast builds
- Tailwind CSS 3.x for styling
- shadcn/ui components (Radix UI)
- React Router v6 for routing
- React Hook Form + Zod for forms
- Sonner for toast notifications

### Backend API
- Node.js 18.x
- Express.js
- PostgreSQL (Aiven)
- Cloudflare R2 for file storage
- JWT authentication
- Bcrypt for password hashing

### Additional Services
- Python Flask background removal service (separate deployment)

## 📦 Installation

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- PostgreSQL database (Aiven)
- Cloudflare R2 account

### Setup Instructions

1. **Clone and navigate to the project:**
```bash
cd unicard-serverless
```

2. **Install dependencies for all projects:**

```bash
# School Portal
cd school-portal
npm install

# Admin Portal
cd ../admin-portal
npm install

# API
cd ../api
npm install
```

3. **Configure environment variables:**

```bash
# School Portal
cd school-portal
cp .env.example .env
# Edit .env with your API URLs

# Admin Portal
cd ../admin-portal
cp .env.example .env
# Edit .env with your API URL

# API
cd ../api
cp .env.example .env
# Edit .env with your database and service credentials
```

## 🏃 Running Locally

### Development Mode

Open three terminal windows:

**Terminal 1 - School Portal:**
```bash
cd school-portal
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Admin Portal:**
```bash
cd admin-portal
npm run dev
# Runs on http://localhost:3002
```

**Terminal 3 - API:**
```bash
cd api
npm run dev
# Runs on http://localhost:3001
```

### Access the Applications

- School Portal: http://localhost:3000
- Admin Portal: http://localhost:3002
- API Health Check: http://localhost:3001/api/health

## 🏗️ Project Structure

```
unicard-serverless/
├── school-portal/          # School management portal
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities
│   │   └── types/          # TypeScript types
│   ├── public/
│   └── package.json
│
├── admin-portal/           # Admin management portal
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   └── package.json
│
└── api/                    # Serverless API
    ├── src/
    │   ├── routes/         # API routes
    │   ├── controllers/    # Request handlers
    │   ├── models/         # Data models
    │   ├── middleware/     # Express middleware
    │   ├── utils/          # Utility functions
    │   └── index.ts        # Entry point
    └── package.json
```

## 📱 Mobile-First Design

This system is optimized for mobile devices with:

- ✅ Touch-friendly UI (minimum 44px touch targets)
- ✅ Responsive layouts (mobile, tablet, desktop)
- ✅ Bottom navigation on mobile
- ✅ Swipe gestures
- ✅ Pull-to-refresh
- ✅ Camera integration for photo uploads
- ✅ Optimized for slow 3G connections

## 🔐 Authentication

- JWT-based authentication
- Role-based access control (School, Admin)
- Secure password hashing with bcrypt
- 24-hour token expiration

## 📊 Database Schema

The system uses PostgreSQL with the following main tables:

- `schools` - School information and credentials
- `students` - Student records
- `batch_submissions` - Batch submissions for printing
- `submission_students` - Junction table for batches
- `admins` - Admin users

## 🚀 Deployment

### Vercel Deployment

**School Portal:**
```bash
cd school-portal
vercel --prod
```

**Admin Portal:**
```bash
cd admin-portal
vercel --prod
```

**API:**
```bash
cd api
vercel --prod
```

### Environment Variables (Production)

Set these in your Vercel dashboard:

**School Portal:**
- `VITE_API_URL`
- `VITE_BG_REMOVAL_URL`

**Admin Portal:**
- `VITE_API_URL`

**API:**
- `DATABASE_URL`
- `JWT_SECRET`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
- `BG_REMOVAL_URL`

## 📝 Features

### School Portal
- ✅ School registration and login
- ✅ Add/edit/delete students
- ✅ Photo upload with editor
- ✅ Background removal
- ✅ Batch submission for printing
- ✅ Student list with search and filters
- ✅ Dashboard with statistics

### Admin Portal
- ✅ Admin login
- ✅ School approval/rejection
- ✅ View all batch submissions
- ✅ Download student data as CSV
- ✅ Download photos as ZIP
- ✅ Dashboard with system statistics

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint
```

## 📚 Documentation

For detailed documentation, see:
- [Requirements](./.kiro/specs/serverless-unicard-system/requirements.md)
- [Design](./.kiro/specs/serverless-unicard-system/design.md)
- [Tasks](./.kiro/specs/serverless-unicard-system/tasks.md)

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🔧 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port 3000 (School Portal)
npx kill-port 3000

# Kill process on port 3002 (Admin Portal)
npx kill-port 3002

# Kill process on port 3001 (API)
npx kill-port 3001
```

**Database connection issues:**
- Verify DATABASE_URL in api/.env
- Check SSL certificate configuration
- Ensure Aiven PostgreSQL is accessible

**Build errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

For support, please contact the development team or refer to the project documentation.

---

Built with ❤️ for modern schools
