import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Building2, Package, Users, Clock, CheckCircle, XCircle, ArrowRight, RefreshCw, TrendingUp } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

interface DashboardStats {
  pendingSchools: number;
  approvedSchools: number;
  rejectedSchools: number;
  totalBatches: number;
  submittedBatches: number;
  processingBatches: number;
  completedBatches: number;
}

interface RecentBatch {
  id: string;
  school_name: string;
  student_count: number;
  status: string;
  submitted_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    pendingSchools: 0,
    approvedSchools: 0,
    rejectedSchools: 0,
    totalBatches: 0,
    submittedBatches: 0,
    processingBatches: 0,
    completedBatches: 0,
  });
  const [recentBatches, setRecentBatches] = useState<RecentBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const token = localStorage.getItem('admin_token');
      
      // Fetch schools
      const schoolsResponse = await fetch(`${API_URL}/api/admin/schools`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      // Fetch batches
      const batchesResponse = await fetch(`${API_URL}/api/admin/batches?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!schoolsResponse.ok || !batchesResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const schoolsData = await schoolsResponse.json();
      const batchesData = await batchesResponse.json();

      const schools = schoolsData.data || [];
      const batches = batchesData.data || [];

      setStats({
        pendingSchools: schools.filter((s: any) => s.status === 'pending').length,
        approvedSchools: schools.filter((s: any) => s.status === 'approved').length,
        rejectedSchools: schools.filter((s: any) => s.status === 'rejected').length,
        totalBatches: batches.length,
        submittedBatches: batches.filter((b: any) => b.status === 'submitted').length,
        processingBatches: batches.filter((b: any) => b.status === 'processing').length,
        completedBatches: batches.filter((b: any) => b.status === 'completed').length,
      });

      setRecentBatches(batches.slice(0, 5));
    } catch (error: any) {
      toast.error(error.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="min-h-[44px] min-w-[44px]"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* School Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-3">School Management</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/schools')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Total Schools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-blue-600">{stats.approvedSchools}</p>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Registered schools
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/schools')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Active Schools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-green-600">{stats.approvedSchools}</p>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  With student data
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ID Card Orders Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-3">ID Card Orders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/batches?status=submitted')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  New Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-blue-600">{stats.submittedBatches}</p>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                {stats.submittedBatches > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Ready to process
                  </p>
                )}
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/batches?status=processing')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-yellow-600">{stats.processingBatches}</p>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                {stats.processingBatches > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Being processed
                  </p>
                )}
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/batches?status=completed')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-green-600">{stats.completedBatches}</p>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                {stats.completedBatches > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Ready for delivery
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/analytics')}
              className="h-auto py-4 justify-start"
            >
              <TrendingUp className="w-5 h-5 mr-3" />
              <div className="text-left">
                <p className="font-semibold">View Analytics</p>
                <p className="text-xs text-muted-foreground">Charts and insights</p>
              </div>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/schools')}
              className="h-auto py-4 justify-start"
            >
              <Building2 className="w-5 h-5 mr-3" />
              <div className="text-left">
                <p className="font-semibold">Manage Schools</p>
                <p className="text-xs text-muted-foreground">View all registered schools</p>
              </div>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/batches')}
              className="h-auto py-4 justify-start"
            >
              <Package className="w-5 h-5 mr-3" />
              <div className="text-left">
                <p className="font-semibold">View ID Card Orders</p>
                <p className="text-xs text-muted-foreground">Download student data and photos</p>
              </div>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/audit-log')}
              className="h-auto py-4 justify-start"
            >
              <CheckCircle className="w-5 h-5 mr-3" />
              <div className="text-left">
                <p className="font-semibold">Audit Log</p>
                <p className="text-xs text-muted-foreground">Security and compliance</p>
              </div>
            </Button>
          </div>
        </div>

        {/* Recent Orders */}
        {recentBatches.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent ID Card Orders</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/batches')}
                  className="min-h-[44px]"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => navigate(`/batches/${batch.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{batch.school_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {batch.student_count} students • {new Date(batch.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                        batch.status === 'submitted'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : batch.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {batch.status === 'submitted' ? 'New' : batch.status === 'processing' ? 'In Progress' : 'Completed'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
