import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import BottomNav from './components/BottomNav'
import Header from './components/Header'
import MobileHeader from './components/MobileHeader'
import SessionExpiryWarning from './components/SessionExpiryWarning'
import InstallPrompt from './components/InstallPrompt'
import OfflineIndicator from './components/OfflineIndicator'

// Maintenance mode - uncomment below to enable
// import Maintenance from './pages/Maintenance'

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Analytics = lazy(() => import('./pages/Analytics'))
const SchoolList = lazy(() => import('./pages/SchoolList'))
const SchoolDetails = lazy(() => import('./pages/SchoolDetails'))
const BatchList = lazy(() => import('./pages/BatchList'))
const BatchDetails = lazy(() => import('./pages/BatchDetails'))
const AuditLog = lazy(() => import('./pages/AuditLog'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AppContent() {
  const location = useLocation();
  const showNav = location.pathname !== '/login';

  return (
    <>
      <div className="min-h-screen bg-background">
        {showNav && (
          <>
            <Header />
            <MobileHeader />
          </>
        )}
        <div className="pb-16 md:pb-0">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/schools" element={
                <AdminProtectedRoute>
                  <SchoolList />
                </AdminProtectedRoute>
              } />
              <Route path="/schools/:id" element={
                <AdminProtectedRoute>
                  <SchoolDetails />
                </AdminProtectedRoute>
              } />
              <Route path="/batches" element={
                <AdminProtectedRoute>
                  <BatchList />
                </AdminProtectedRoute>
              } />
              <Route path="/batches/:id" element={
                <AdminProtectedRoute>
                  <BatchDetails />
                </AdminProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <AdminProtectedRoute>
                  <Dashboard />
                </AdminProtectedRoute>
              } />
              <Route path="/analytics" element={
                <AdminProtectedRoute>
                  <Analytics />
                </AdminProtectedRoute>
              } />
              <Route path="/audit-log" element={
                <AdminProtectedRoute>
                  <AuditLog />
                </AdminProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </div>
        {showNav && <BottomNav />}
        <SessionExpiryWarning />
      </div>
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
        <AdminAuthProvider>
          <AppContent />
        </AdminAuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App
