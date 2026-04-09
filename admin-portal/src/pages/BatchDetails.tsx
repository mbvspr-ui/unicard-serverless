import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Download, FileText, Image as ImageIcon, Users, Calendar, Building2, FileSpreadsheet } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

interface Student {
  id: string;
  name: string;
  father_name: string;
  mother_name: string | null;
  class: string;
  section: string;
  roll_number: string;
  photo_url: string | null;
}

interface Staff {
  id: string;
  name: string;
  staff_type: string;
  designation: string;
  department: string;
  employee_id: string;
  photo_url: string | null;
}

interface School {
  id: string;
  name: string;
  email: string;
  phone: string;
  logo_url: string | null;
  signature_url: string | null;
}

interface Batch {
  id: string;
  school_id: string;
  status: 'submitted' | 'processing' | 'completed';
  submitted_at: string;
  processed_at: string | null;
  admin_notes: string | null;
  school_name?: string;
  school_email?: string;
  school_phone?: string;
  school_address?: string;
  school_city?: string;
  school_state?: string;
  school_pincode?: string;
  school_principal_name?: string;
  school_logo_url?: string | null;
  school_signature_url?: string | null;
  school_created_at?: string;
}

interface BatchDetails {
  batch: Batch;
  students: Student[];
  staff: Staff[];
  studentCount?: number;
  staffCount?: number;
}

export default function BatchDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [isDownloadingStaffCSV, setIsDownloadingStaffCSV] = useState(false);
  const [isDownloadingPhotos, setIsDownloadingPhotos] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchBatchDetails();
  }, [id]);

  const fetchBatchDetails = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/batches/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch batch details');
      }

      const data = await response.json();
      setBatchDetails(data.data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load batch details');
      navigate('/batches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    setIsDownloadingCSV(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/batches/${id}/csv`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-${id}-students.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('CSV downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download CSV');
    } finally {
      setIsDownloadingCSV(false);
    }
  };

  const handleDownloadExcel = async () => {
    setIsDownloadingExcel(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/batches/${id}/excel`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-${id}-students.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Excel downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download Excel');
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const handleDownloadStaffCSV = async () => {
    setIsDownloadingStaffCSV(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/batches/${id}/staff-csv`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download staff CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-${id}-staff.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Staff CSV downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download staff CSV');
    } finally {
      setIsDownloadingStaffCSV(false);
    }
  };

  const handleDownloadPhotos = async () => {
    setIsDownloadingPhotos(true);
    toast.info('Preparing photos... This may take a moment');
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/batches/${id}/photos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download photos');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-${id}-photos.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Photos downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download photos');
    } finally {
      setIsDownloadingPhotos(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'submitted' | 'processing' | 'completed') => {
    if (!batchDetails) return;
    
    setIsUpdatingStatus(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/batches/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success(`Order status updated to ${newStatus === 'submitted' ? 'New' : newStatus === 'processing' ? 'In Progress' : 'Completed'}`);
      fetchBatchDetails();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!batchDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Batch not found</p>
      </div>
    );
  }

  const { batch, students = [], staff = [] } = batchDetails;
  const totalMembers = students.length + staff.length;
  
  // Extract school info from batch (API returns it embedded)
  const school = {
    id: batch.school_id,
    name: batch.school_name || 'Unknown School',
    email: batch.school_email || '',
    phone: batch.school_phone || '',
    logo_url: batch.school_logo_url || null,
    signature_url: batch.school_signature_url || null,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/batches')}
              className="min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold flex-1 truncate">Order Details</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Order Status</CardTitle>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(batch.status)}`}>
                {batch.status === 'submitted' ? 'New Order' : batch.status === 'processing' ? 'In Progress' : 'Completed'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Order Placed:</span>
              <span className="font-medium">{new Date(batch.submitted_at).toLocaleString()}</span>
            </div>
            {batch.processed_at && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Completed:</span>
                <span className="font-medium">{new Date(batch.processed_at).toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total ID Cards:</span>
              <span className="font-medium">{totalMembers} ({students.length} students, {staff.length} staff)</span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
              <p className="text-blue-700 dark:text-blue-300">
                <span className="font-medium">Order ID:</span> {id}
              </p>
            </div>

            {/* Status Update Buttons */}
            <div className="pt-3 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-3">Update Order Status:</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={batch.status === 'submitted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusUpdate('submitted')}
                  disabled={isUpdatingStatus || batch.status === 'submitted'}
                  className="min-h-[44px]"
                >
                  New
                </Button>
                <Button
                  variant={batch.status === 'processing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusUpdate('processing')}
                  disabled={isUpdatingStatus || batch.status === 'processing'}
                  className="min-h-[44px]"
                >
                  In Progress
                </Button>
                <Button
                  variant={batch.status === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={isUpdatingStatus || batch.status === 'completed'}
                  className="min-h-[44px]"
                >
                  Completed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* School Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              School Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-1">School Name</p>
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">{school.name}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base break-all">{school.email}</p>
              </div>
              {school.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-base">{school.phone}</p>
                </div>
              )}
            </div>

            {(batch.school_city || batch.school_state || batch.school_pincode) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {batch.school_city && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">City</p>
                    <p className="text-base">{batch.school_city}</p>
                  </div>
                )}
                {batch.school_state && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">State</p>
                    <p className="text-base">{batch.school_state}</p>
                  </div>
                )}
                {batch.school_pincode && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pincode</p>
                    <p className="text-base">{batch.school_pincode}</p>
                  </div>
                )}
              </div>
            )}

            {batch.school_address && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Complete Address</p>
                <p className="text-base">{batch.school_address}</p>
              </div>
            )}

            {batch.school_principal_name && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Principal Name</p>
                <p className="text-base">{batch.school_principal_name}</p>
              </div>
            )}

            {batch.school_created_at && (
              <div className="pt-3 border-t">
                <p className="text-sm font-medium text-muted-foreground">School Registered</p>
                <p className="text-base">{new Date(batch.school_created_at).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Download Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Download Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleDownloadCSV}
              disabled={isDownloadingCSV}
              className="w-full min-h-[48px] text-base"
              size="lg"
            >
              {isDownloadingCSV ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Downloading CSV...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Download Student Data (CSV)
                </>
              )}
            </Button>

            <Button
              onClick={handleDownloadStaffCSV}
              disabled={isDownloadingStaffCSV || staff.length === 0}
              className="w-full min-h-[48px] text-base"
              size="lg"
              variant="secondary"
            >
              {isDownloadingStaffCSV ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Downloading Staff CSV...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Download Staff Data (CSV)
                </>
              )}
            </Button>

            <Button
              onClick={handleDownloadExcel}
              disabled={isDownloadingExcel}
              className="w-full min-h-[48px] text-base"
              size="lg"
              variant="outline"
            >
              {isDownloadingExcel ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Downloading Excel...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-5 h-5 mr-2" />
                  Download Student Data (Excel)
                </>
              )}
            </Button>

            <Button
              onClick={handleDownloadPhotos}
              disabled={isDownloadingPhotos}
              variant="outline"
              className="w-full min-h-[48px] text-base"
              size="lg"
            >
              {isDownloadingPhotos ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Preparing ZIP...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Download All Photos (ZIP)
                </>
              )}
            </Button>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">📦 What's included in the ZIP:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>All student and staff photos</li>
                <li>School logo</li>
                <li>Principal signature</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Student List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Students ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.length > 0 ? (
              <div className="space-y-3">
                {students.map((student, index) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {student.photo_url ? (
                        <img
                          src={student.photo_url}
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{student.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        Class {student.class}
                        {student.section && ` - ${student.section}`}
                        {student.roll_number && ` | Roll: ${student.roll_number}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No students in this batch</p>
            )}
          </CardContent>
        </Card>

        {/* Staff List */}
        {staff.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Staff ({staff.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff.map((member, index) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-purple-200 dark:bg-purple-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-6 h-6 text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.designation}
                        {member.department && ` | ${member.department}`}
                        {member.employee_id && ` | ID: ${member.employee_id}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      #{index + 1}
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
