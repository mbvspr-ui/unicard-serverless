# Unicard Serverless API

Backend API for the Unicard ID Card Management System built with Node.js, Express, and TypeScript.

## Overview

This is a serverless API designed to run on Vercel, providing endpoints for:
- School registration and authentication
- Student management
- File uploads (logos, signatures, photos)
- Batch submissions for ID card printing
- Admin school management
- Data export (CSV, ZIP)

## Tech Stack

- **Runtime**: Node.js 18.x
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Aiven PostgreSQL 15
- **File Storage**: Cloudflare R2 (S3-compatible)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Zod
- **File Upload**: Multer
- **Deployment**: Vercel Serverless Functions

## Project Structure

```
api/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # PostgreSQL connection
│   │   └── storage.ts   # Cloudflare R2 client
│   ├── controllers/     # Request handlers
│   │   ├── auth.ts      # Authentication logic
│   │   ├── upload.ts    # File upload logic
│   │   └── locations.ts # Location data
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # JWT authentication
│   │   └── upload.ts    # Multer file upload
│   ├── routes/          # API routes
│   │   ├── auth.ts      # Auth endpoints
│   │   ├── upload.ts    # Upload endpoints
│   │   └── locations.ts # Location endpoints
│   ├── types/           # TypeScript types
│   │   └── index.ts     # Shared types
│   ├── utils/           # Utility functions
│   │   ├── auth.ts      # JWT utilities
│   │   └── db-helpers.ts # Database helpers
│   ├── validators/      # Zod schemas
│   │   └── auth.ts      # Auth validation
│   └── index.ts         # Main application
├── migrations/          # Database migrations
│   └── 001_initial_schema.sql
├── .env.example         # Environment variables template
├── package.json
├── tsconfig.json
└── vercel.json         # Vercel configuration

```

## Setup

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- PostgreSQL database (Aiven)
- Cloudflare R2 bucket

### Installation

1. Clone the repository and navigate to the API directory:
```bash
cd unicard-serverless/api
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from template:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
# Database
DATABASE_URL=postgres://user:password@host:port/database?sslmode=require

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Cloudflare R2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=unicard-files
R2_PUBLIC_URL=https://your-custom-domain.com

# Server
PORT=3001
NODE_ENV=development
```

5. Run database migrations:
```bash
npm run migrate
```

6. Test database connection:
```bash
npm run db:test
```

### Development

Start the development server with hot reload:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Build

Compile TypeScript to JavaScript:
```bash
npm run build
```

### Production

Start the production server:
```bash
npm start
```

## API Endpoints

### Health Check

- `GET /` - Root endpoint
- `GET /api/health` - Health check

### Authentication

- `POST /api/auth/school/register` - Register a new school
- `POST /api/auth/school/login` - School login
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/verify` - Verify JWT token

### File Uploads

- `POST /api/schools/upload-logo` - Upload school logo
- `POST /api/schools/upload-signature` - Upload principal signature
- `POST /api/students/:studentId/photo` - Upload student photo

See [UPLOAD_API.md](./UPLOAD_API.md) for detailed upload documentation.

### Locations

- `GET /api/locations/states` - Get list of Indian states
- `GET /api/locations/districts/:state` - Get districts for a state

### Students (Coming Soon)

- `POST /api/students` - Create student
- `GET /api/students` - List students with pagination
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Batch Submissions (Coming Soon)

- `POST /api/batches` - Create batch submission
- `GET /api/batches` - List school's batches
- `GET /api/admin/batches` - List all batches (admin)
- `GET /api/admin/batches/:id/csv` - Download CSV
- `GET /api/admin/batches/:id/photos` - Download photos ZIP

### Admin (Coming Soon)

- `GET /api/admin/schools` - List all schools
- `GET /api/admin/schools/:id` - Get school details
- `PUT /api/admin/schools/:id/status` - Approve/reject school

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained from the login endpoints and are valid for 24 hours.

## Error Handling

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `INTERNAL_SERVER_ERROR` - Server error

## Database

### Connection

The API uses PostgreSQL with connection pooling via `pg-pool`. SSL is required for production connections.

### Migrations

Database migrations are stored in the `migrations/` directory. Run migrations with:

```bash
npm run migrate
```

### Schema

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for complete schema documentation.

## File Storage

Files are stored in Cloudflare R2 (S3-compatible storage) with the following structure:

```
unicard-files/
├── school-assets/
│   └── {school-id}/
│       ├── logo.png
│       └── signature.png
└── student-photos/
    └── {school-id}/
        └── {student-id}.png
```

See [R2_SETUP.md](./R2_SETUP.md) for R2 configuration details.

## Deployment

### Vercel

The API is configured for deployment on Vercel as serverless functions.

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `R2_PUBLIC_URL`

### Environment Variables

Required environment variables for production:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public URL for R2 files |
| `NODE_ENV` | Environment (production/development) |

## Testing

### Manual Testing

Use tools like Postman, Insomnia, or cURL to test endpoints.

Example:
```bash
# Health check
curl http://localhost:3001/api/health

# Register school
curl -X POST http://localhost:3001/api/auth/school/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test School",
    "email": "test@school.com",
    "password": "password123",
    "address": "123 School St",
    "phone": "+919876543210"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/school/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@school.com",
    "password": "password123"
  }'
```

### Unit Tests (Coming Soon)

```bash
npm test
```

## Security

- Passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens expire after 24 hours
- File uploads are validated for type and size
- SQL injection prevention via parameterized queries
- CORS configured for specific origins
- Rate limiting (to be implemented)

## Performance

- Connection pooling for database
- Response compression (gzip)
- Efficient database indexes
- Lazy loading and pagination
- File streaming for large downloads

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.
