import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FormInput } from '../components/ui/form-input';
import { FormSelect } from '../components/ui/form-select';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Header } from '../components/Header';
import { staffApi } from '../lib/api';
import { Staff } from '../types';
import { RefreshCw, Edit, Trash2, Briefcase, Eye } from 'lucide-react';
import { addCacheBuster } from '../utils/photo';

const STAFF_TYPES = ['Teaching', 'Non-Teaching', 'Administrative', 'Support'];

export default function StaffList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [staffTypeFilter, setStaffTypeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStaff, setTotalStaff] = useState(0);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const limit = 50;

  // Fetch staff
  const fetchStaff = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const response = await staffApi.getAll({
        page: currentPage,
        limit,
        search: searchQuery || undefined,
        staff_type: staffTypeFilter || undefined,
        department: departmentFilter || undefined,
        refresh: forceRefresh,
      });

      if (response.success) {
        const staffData = Array.isArray(response.data) ? response.data : [];
        // Add cache buster to all photo URLs
        const staffWithFreshPhotos = staffData.map(member => ({
          ...member,
          photo_url: member.photo_url ? addCacheBuster(member.photo_url) : null
        }));
        setStaff(staffWithFreshPhotos);
        
        // Extract unique departments
        const uniqueDepts = Array.from(new Set(
          staffData
            .map(s => s.department)
            .filter(d => d) as string[]
        )).sort();
        setDepartments(uniqueDepts);
        
        const paginationData = (response as any).pagination;
        if (paginationData) {
          setTotalPages(paginationData.pages || 1);
          setTotalStaff(paginationData.total || 0);
        } else {
          setTotalPages(1);
          setTotalStaff(staffData.length);
        }
      } else {
        setStaff([]);
        toast.error('Failed to load staff');
      }
    } catch (error) {
      console.error('Fetch staff error:', error);
      setStaff([]);
      toast.error('An error occurred while loading staff');
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff on mount and when filters change
  useEffect(() => {
    fetchStaff();
  }, [currentPage, searchQuery, staffTypeFilter, departmentFilter, refreshKey]);

  // Refresh data when navigating back to this page
  useEffect(() => {
    // Force refresh when coming back from edit page
    setRefreshKey(prev => prev + 1);
  }, [location.key]);

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleStaffTypeFilter = (value: string) => {
    setStaffTypeFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleDepartmentFilter = (value: string) => {
    setDepartmentFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  // Handle delete
  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) {
      return;
    }

    try {
      const response = await staffApi.delete(staffId);
      if (response.success) {
        toast.success('Staff member deleted successfully');
        fetchStaff();
      } else {
        toast.error(response.error?.message || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An error occurred while deleting the staff member');
    }
  };

  // Handle view details
  const handleViewDetails = (member: Staff) => {
    setSelectedStaff(member);
    setShowDetailsDialog(true);
  };

  // Format date for display
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <Header title="Staff" showHome />
      
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchStaff(true)}
              variant="outline"
              className="h-10"
              disabled={loading}
              title="Refresh staff count"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <span className="text-sm text-gray-600">
              {totalStaff} staff member{totalStaff !== 1 ? 's' : ''}
            </span>
          </div>
          <Button
            onClick={() => navigate('/staff/add')}
            className="h-10"
          >
            + Add Staff
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <FormInput
            placeholder="Search by name, employee ID, or department..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filters - Always visible on mobile */}
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormSelect
              label="Staff Type"
              placeholder="Select Staff Type"
              value={staffTypeFilter || 'all'}
              onValueChange={handleStaffTypeFilter}
              options={[
                { value: 'all', label: 'All Staff Types' },
                ...STAFF_TYPES.map(t => ({ value: t, label: t }))
              ]}
            />
            <FormSelect
              label="Department"
              placeholder="Select Department"
              value={departmentFilter || 'all'}
              onValueChange={handleDepartmentFilter}
              options={[
                { value: 'all', label: 'All Departments' },
                ...departments.map(d => ({ value: d, label: d }))
              ]}
            />
            {(staffTypeFilter || departmentFilter) && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStaffTypeFilter('');
                    setDepartmentFilter('');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : staff.length === 0 ? (
          <Card className="p-8 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">No staff members found</p>
            <Button onClick={() => navigate('/staff/add')}>
              Add Your First Staff Member
            </Button>
          </Card>
        ) : (
          <>
            {/* Results Info */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {staff.length} of {totalStaff} staff members
              </p>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map((member) => (
                <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Photo */}
                    <div className="flex-shrink-0">
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          alt={member.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <Briefcase className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{member.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{member.designation}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Type:</span> {member.staff_type}
                        </p>
                        {member.department && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Dept:</span> {member.department}
                          </p>
                        )}
                        {member.employee_id && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">ID:</span> {member.employee_id}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(member)}
                          className="flex-1"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/staff/edit/${member.id}`)}
                          className="flex-1"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Staff Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Staff Details</DialogTitle>
            <DialogDescription>
              Complete information about the staff member
            </DialogDescription>
          </DialogHeader>

          {selectedStaff && (
            <div className="space-y-6 py-4">
              {/* Photo and Basic Info */}
              <div className="flex items-start gap-4">
                {selectedStaff.photo_url ? (
                  <img
                    src={selectedStaff.photo_url}
                    alt={selectedStaff.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                    <Briefcase className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedStaff.name}</h3>
                  <p className="text-gray-600">{selectedStaff.designation}</p>
                  {selectedStaff.employee_id && (
                    <p className="text-sm text-gray-500 mt-1">
                      Employee ID: {selectedStaff.employee_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-900">Personal Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Father's/Spouse Name:</span>
                    <p className="font-medium">{selectedStaff.father_spouse_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date of Birth:</span>
                    <p className="font-medium">{formatDate(selectedStaff.date_of_birth)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Gender:</span>
                    <p className="font-medium">{selectedStaff.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Blood Group:</span>
                    <p className="font-medium">{selectedStaff.blood_group || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone Number:</span>
                    <p className="font-medium">{selectedStaff.phone_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-900">Employment Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Staff Type:</span>
                    <p className="font-medium">{selectedStaff.staff_type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Department:</span>
                    <p className="font-medium">{selectedStaff.department || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date of Joining:</span>
                    <p className="font-medium">{formatDate(selectedStaff.date_of_joining)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Qualification:</span>
                    <p className="font-medium">{selectedStaff.qualification || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-900">Address Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Address:</span>
                    <p className="font-medium">{selectedStaff.address || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-500">City:</span>
                      <p className="font-medium">{selectedStaff.city}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">District:</span>
                      <p className="font-medium">{selectedStaff.district}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">State:</span>
                      <p className="font-medium">{selectedStaff.state}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Pincode:</span>
                      <p className="font-medium">{selectedStaff.pincode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {(selectedStaff.emergency_contact_name || selectedStaff.emergency_contact_number) && (
                <div>
                  <h4 className="font-semibold mb-3 text-gray-900">Emergency Contact</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Contact Name:</span>
                      <p className="font-medium">{selectedStaff.emergency_contact_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Contact Number:</span>
                      <p className="font-medium">{selectedStaff.emergency_contact_number || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Relationship:</span>
                      <p className="font-medium">{selectedStaff.emergency_contact_relationship || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowDetailsDialog(false);
                    navigate(`/staff/edit/${selectedStaff.id}`);
                  }}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Staff
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
