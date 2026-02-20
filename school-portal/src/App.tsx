import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { BottomNav } from './components/BottomNav'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingSpinner } from './components/ui/loading-spinner'
import { SessionExpiryWarning } from './components/SessionExpiryWarning'
import InstallPrompt from './components/InstallPrompt'
import OfflineIndicator from './components/OfflineIndicator'
import UpdateNotification from './components/UpdateNotification'
import HelpButton from './components/HelpButton'
import WelcomeGuide from './components/WelcomeGuide'

// Maintenance mode - uncomment below to enable
// import Maintenance from './pages/Maintenance'

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })))
const Register = lazy(() => import('./pages/Register').then(module => ({ default: module.Register })))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AddStudent = lazy(() => import('./pages/AddStudent'))
const StudentList = lazy(() => import('./pages/StudentList'))
const EditStudent = lazy(() => import('./pages/EditStudent'))
const AddStaff = lazy(() => import('./pages/AddStaff'))
const StaffList = lazy(() => import('./pages/StaffList'))
const EditStaff = lazy(() => import('./pages/EditStaff'))
const BatchSubmission = lazy(() => import('./pages/BatchSubmission'))
const SubmissionHistory = lazy(() => import('./pages/SubmissionHistory'))
const SubmissionDetail = lazy(() => import('./pages/SubmissionDetail'))
const Profile = lazy(() => import('./pages/Profile'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}

function AppContent() {
  const location = useLocation();
  const showBottomNav = !['/login', '/register', '/verify-email', '/change-password'].includes(location.pathname);
  const isProtectedRoute = !['/login', '/register', '/verify-email', '/change-password'].includes(location.pathname);

  return (
    <>
      <UpdateNotification />
      {isProtectedRoute && <SessionExpiryWarning />}
      {isProtectedRoute && <HelpButton />}
      {isProtectedRoute && <WelcomeGuide />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/change-password" element={<ChangePassword />} />
        
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <StudentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/add"
          element={
            <ProtectedRoute>
              <AddStudent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/edit/:studentId"
          element={
            <ProtectedRoute>
              <EditStudent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <StaffList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/add"
          element={
            <ProtectedRoute>
              <AddStaff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/edit/:staffId"
          element={
            <ProtectedRoute>
              <EditStaff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/batch-submission"
          element={
            <ProtectedRoute>
              <BatchSubmission />
            </ProtectedRoute>
          }
        />
        <Route
          path="/submissions"
          element={
            <ProtectedRoute>
              <SubmissionHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/submissions/:id"
          element={
            <ProtectedRoute>
              <SubmissionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        </Routes>
      </Suspense>
      {showBottomNav && <BottomNav />}
      <InstallPrompt />
      <OfflineIndicator />
      <Toaster position="top-center" richColors />
    </>
  );
}

function App() {
  // MAINTENANCE MODE - Uncomment below to enable
  // return <Maintenance />
  
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <AppContent />
          </div>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
