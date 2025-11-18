# Unicard Admin Portal

Mobile-first web application for system administrators to manage schools and download student data.

## Features

- 📱 Mobile-first responsive design
- 🔐 Secure admin authentication
- 🏫 School management (approve/reject registrations)
- 📦 Batch management
- 📥 Download student data (CSV)
- 🖼️ Download student photos (ZIP)
- 📊 Dashboard with statistics
- 🔍 Search and filter functionality

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.x
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: React Context API
- **Routing**: React Router v6
- **Notifications**: Sonner

## Prerequisites

- Node.js 18.x or higher
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install --legacy-peer-deps
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables:
```env
VITE_API_URL=http://localhost:3001
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5174`

## Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── ui/          # UI components (buttons, inputs, etc.)
│   ├── auth/        # Authentication components
│   └── BottomNav.tsx
├── contexts/        # React contexts
├── hooks/           # Custom hooks
├── lib/             # Utilities and helpers
├── pages/           # Page components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── SchoolList.tsx
│   ├── SchoolDetails.tsx
│   ├── BatchList.tsx
│   └── BatchDetails.tsx
├── types/           # TypeScript types
└── App.tsx          # Main app component
```

## Key Features

### School Management
- View all schools (pending, approved, rejected)
- Search schools by name or email
- View detailed school information
- Approve or reject school registrations
- Provide rejection reasons
- View school logo and signature

### Batch Management
- View all batch submissions
- Filter by status (submitted, processing, completed)
- Search by school name or batch ID
- View batch details with student list
- Download student data as CSV
- Download all photos as ZIP (includes school assets)

### Dashboard
- Overview of pending schools
- Overview of batch submissions
- Quick action buttons
- Recent submissions list
- Statistics cards

## Mobile Optimization

- Bottom navigation bar for mobile
- All touch targets minimum 44px
- Responsive layouts (mobile-first)
- Large, easy-to-tap buttons
- Full-screen dialogs on mobile
- Card-based layouts on mobile
- Pull-to-refresh support
- Swipeable tabs

## API Integration

The portal communicates with the serverless API for:
- Admin authentication
- School management
- Batch management
- File downloads (CSV, ZIP)

## Security

- JWT-based authentication
- Role-based access control
- Secure token storage
- Protected routes
- Admin-only access

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Proprietary - All rights reserved
