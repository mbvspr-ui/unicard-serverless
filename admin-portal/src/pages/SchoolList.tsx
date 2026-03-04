import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Search, Eye, RefreshCw, ArrowLeft } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

interface School {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  logo_url: string | null;
  signature_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function SchoolList() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSchools, setTotalSchools] = useState(0);
  const [limit] = useState(50); // Show 50 schools per page

  const fetchSchools = async (showRefreshIndicator = false, page = 1) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/schools?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch schools');
      }

      const data = await response.json();
      setSchools(data.data || []);
      setFilteredSchools(data.data || []);
      
      if (data.pagination) {
        setTotalPages(data.pagination.pages);
        setTotalSchools(data.pagination.total);
        setCurrentPage(data.pagination.page);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load schools');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchools(false, currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSchools(schools);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = schools.filter(
        (school) =>
          school.name.toLowerCase().includes(query) ||
          school.email.toLowerCase().includes(query) ||
          school.address?.toLowerCase().includes(query) ||
          school.phone?.toLowerCase().includes(query)
      );
      setFilteredSchools(filtered);
    }
  }, [searchQuery, schools]);



  const handleRefresh = () => {
    fetchSchools(true, currentPage);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold flex-1">Schools</h1>
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

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search schools by name, email, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            Total Schools: <span className="font-semibold">{totalSchools}</span>
            {totalPages > 1 && (
              <span className="ml-2">
                (Page {currentPage} of {totalPages})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSchools.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? 'No schools found matching your search' : 'No schools registered yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSchools.map((school) => (
            <Card key={school.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{school.name}</CardTitle>
                    <p className="text-sm text-muted-foreground truncate mt-1">{school.email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {school.phone && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Phone:</span> {school.phone}
                  </p>
                )}
                {school.address && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    <span className="font-medium">Address:</span> {school.address}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Registered: {new Date(school.created_at).toLocaleDateString()}
                </p>

                {/* Action Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/schools/${school.id}`)}
                  className="w-full min-h-[44px]"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Details
                </Button>
              </CardContent>
            </Card>
          ))
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && !isLoading && (
          <div className="flex flex-col items-center gap-3 pt-6 pb-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalSchools)} of {totalSchools} schools
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="min-h-[44px]"
              >
                Previous
              </Button>
              <span className="text-sm font-medium px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="min-h-[44px]"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
