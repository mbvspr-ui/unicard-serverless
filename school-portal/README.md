# Unicard School Portal

Mobile-first web application for schools to manage students and submit ID card printing orders.

## Features

- 📱 Mobile-first responsive design
- 🔐 Secure authentication
- 👥 Student management (add, edit, delete)
- 📸 Photo editor with background removal
- 📤 Batch submission for printing
- 🔍 Search and filter students
- 📊 Dashboard with statistics

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.x
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: React Context API
- **Routing**: React Router v6
- **Form Handling**: React Hook Form + Zod
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
VITE_BG_REMOVAL_URL=http://localhost:5000
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

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
│   └── PhotoEditor.tsx
├── contexts/        # React contexts
├── hooks/           # Custom hooks
├── lib/             # Utilities and helpers
├── pages/           # Page components
├── types/           # TypeScript types
└── App.tsx          # Main app component
```

## Key Features

### Photo Editor
- Upload or capture photos
- Crop, rotate, flip
- Adjust brightness, contrast, saturation
- AI-powered background removal
- Background color selection
- Touch-optimized for mobile

### Student Management
- Add students with comprehensive information
- Edit existing student records
- Delete students
- Search by name, father name, or roll number
- Filter by class and section
- Pagination (50 students per page)

### Batch Submission
- Select multiple students
- Submit for ID card printing
- View submission history
- Track submission status

## Mobile Optimization

- All touch targets minimum 44px
- Touch event handlers for gestures
- Responsive layouts (mobile-first)
- Large, easy-to-tap buttons
- Full-screen modals on mobile
- Optimized keyboard types
- Pull-to-refresh support
- Card-based layouts on mobile

## API Integration

The portal communicates with the serverless API for:
- Authentication
- Student CRUD operations
- File uploads
- Batch submissions
- Background removal

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Proprietary - All rights reserved
