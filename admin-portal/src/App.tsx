import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute'
import BottomNav from './components/BottomNav'

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const SchoolList = lazy(() => import('./pages/SchoolList'))
const SchoolDetails = lazy(() => import('./pages/SchoolDetails'))
const BatchList = lazy(() => import('./pages/BatchList'))
const BatchDetails = lazy(() => import('./pages/BatchDetails'))

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
  const showBottomNav = location.pathname !== '/login';

  return (
    <>
      <div className="min-h-screen bg-background pb-16 md:pb-0">
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
          </Routes>
        </Suspense>
        {showBottomNav && <BottomNav />}
      </div>
      <Toaster position="top-center" richColors />
    </>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AdminAuthProvider>
        <AppContent />
      </AdminAuthProvider>
    </Router>
  );
}

export default App
