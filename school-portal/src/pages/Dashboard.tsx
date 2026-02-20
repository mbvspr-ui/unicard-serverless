import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { SkeletonDashboard } from '../components/ui/skeleton';
import { Header } from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { studentApi, batchApi, staffApi } from '../lib/api';

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  ordersInProgress: number;
  ordersCompleted: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { school } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalStaff: 0,
    ordersInProgress: 0,
    ordersCompleted: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch total students count
      const studentsResponse = await studentApi.getAll({ page: 1, limit: 1 });
      // API response structure: { success, data: Student[], pagination: {...} }
      const totalStudents = (studentsResponse as any).pagination?.total || 0;

      // Fetch total staff count
      const staffResponse = await staffApi.getAll({ page: 1, limit: 1 });
      const totalStaff = (staffResponse as any).pagination?.total || 0;

      // Fetch batch submissions
      const batchesResponse = await batchApi.getAll({ page: 1, limit: 100 });
      const batches = Array.isArray(batchesResponse.data) ? batchesResponse.data : [];
      
      const ordersInProgress = batches.filter(
        (b: any) => b.status === 'submitted' || b.status === 'processing'
      ).length;
      
      const ordersCompleted = batches.filter(
        (b: any) => b.status === 'completed'
      ).length;

      setStats({
        totalStudents,
        totalStaff,
        ordersInProgress,
        ordersCompleted,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Dashboard" />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header with Samiul Graphics Branding */}
      <Header title="Dashboard" />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 hover:shadow-xl transition-all duration-300 cursor-pointer group animate-fadeIn" onClick={() => navigate('/students')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Students</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">{stats.totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-xl transition-all duration-300 cursor-pointer group animate-fadeIn" style={{ animationDelay: '0.1s' }} onClick={() => navigate('/staff')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Staff</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">{stats.totalStaff}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-xl transition-all duration-300 cursor-pointer group animate-fadeIn" style={{ animationDelay: '0.2s' }} onClick={() => navigate('/submissions')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Orders In Progress</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-400 bg-clip-text text-transparent">{stats.ordersInProgress}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-xl transition-all duration-300 cursor-pointer group animate-fadeIn" style={{ animationDelay: '0.3s' }} onClick={() => navigate('/submissions')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Orders Completed</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">{stats.ordersCompleted}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>
          </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Quick Actions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card 
                className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group border-l-4 border-l-blue-500 animate-fadeIn"
                style={{ animationDelay: '0.4s' }}
                onClick={() => navigate('/students/add')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Add Student</h3>
                    <p className="text-sm text-gray-600">Add a new student record</p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group border-l-4 border-l-purple-500 animate-fadeIn"
                style={{ animationDelay: '0.5s' }}
                onClick={() => navigate('/staff/add')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Add Staff</h3>
                    <p className="text-sm text-gray-600">Add a new staff member</p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group border-l-4 border-l-green-500 animate-fadeIn"
                style={{ animationDelay: '0.6s' }}
                onClick={() => navigate('/students')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">View Students</h3>
                    <p className="text-sm text-gray-600">Manage student list</p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group border-l-4 border-l-indigo-500 animate-fadeIn"
                style={{ animationDelay: '0.7s' }}
                onClick={() => navigate('/staff')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">View Staff</h3>
                    <p className="text-sm text-gray-600">Manage staff list</p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group border-l-4 border-l-amber-500 animate-fadeIn"
                style={{ animationDelay: '0.8s' }}
                onClick={() => navigate('/batch-submission')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Submit Batch</h3>
                    <p className="text-sm text-gray-600">Submit for printing</p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group border-l-4 border-l-orange-500 animate-fadeIn"
                style={{ animationDelay: '0.9s' }}
                onClick={() => navigate('/submissions')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">View Submissions</h3>
                    <p className="text-sm text-gray-600">Track submission status</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
