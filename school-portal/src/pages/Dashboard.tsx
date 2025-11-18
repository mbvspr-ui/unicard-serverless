import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Header } from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { studentApi, batchApi, activityApi } from '../lib/api';

interface DashboardStats {
  totalStudents: number;
  ordersInProgress: number;
  ordersCompleted: number;
}

interface RecentActivity {
  id: string;
  activity_type: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  metadata: any;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { school } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    ordersInProgress: 0,
    ordersCompleted: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

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
        ordersInProgress,
        ordersCompleted,
      });

      // Fetch recent activities
      try {
        const activitiesResponse = await activityApi.getRecent(10);
        console.log('Activities response:', activitiesResponse);
        if (activitiesResponse.success && activitiesResponse.data) {
          setRecentActivities(activitiesResponse.data);
        } else {
          console.error('Activities fetch failed:', activitiesResponse);
        }
      } catch (activityError) {
        console.error('Failed to fetch activities:', activityError);
        // Don't fail the whole dashboard if activities fail
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header with UniCraft Branding */}
      <Header title="Dashboard" />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/students')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/submissions')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Orders In Progress</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.ordersInProgress}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/submissions')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Orders Completed</p>
                  <p className="text-3xl font-bold text-green-600">{stats.ordersCompleted}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card 
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate('/students/add')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Add Student</h3>
                    <p className="text-sm text-gray-600">Add a new student record</p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate('/students')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">View Students</h3>
                    <p className="text-sm text-gray-600">Manage student list</p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate('/students')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Submit Batch</h3>
                    <p className="text-sm text-gray-600">Submit for printing</p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate('/submissions')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">View Submissions</h3>
                    <p className="text-sm text-gray-600">Track submission status</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <Card className="p-4">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <p className="text-sm text-gray-500 font-medium mb-2">No recent activity</p>
                  <p className="text-xs text-gray-400">
                    Your activities will appear here when you add students, submit batches, or update your profile
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    // Determine icon and color based on activity type
                    let iconBg = 'bg-blue-100';
                    let iconColor = 'text-blue-600';
                    let icon = (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    );

                    if (activity.activity_type === 'student_added') {
                      iconBg = 'bg-green-100';
                      iconColor = 'text-green-600';
                      icon = (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      );
                    } else if (activity.activity_type === 'student_updated') {
                      iconBg = 'bg-yellow-100';
                      iconColor = 'text-yellow-600';
                      icon = (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      );
                    } else if (activity.activity_type === 'student_deleted') {
                      iconBg = 'bg-red-100';
                      iconColor = 'text-red-600';
                      icon = (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      );
                    } else if (activity.activity_type === 'batch_submitted') {
                      iconBg = 'bg-purple-100';
                      iconColor = 'text-purple-600';
                      icon = (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      );
                    } else if (activity.activity_type === 'profile_updated') {
                      iconBg = 'bg-indigo-100';
                      iconColor = 'text-indigo-600';
                      icon = (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      );
                    } else if (activity.activity_type === 'logo_uploaded' || activity.activity_type === 'signature_uploaded') {
                      iconBg = 'bg-cyan-100';
                      iconColor = 'text-cyan-600';
                      icon = (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      );
                    }

                    return (
                      <div key={activity.id} className="flex gap-3">
                        <div className={`w-8 h-8 ${iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className={iconColor}>{icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
