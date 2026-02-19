import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Image as ImageIcon, Users, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

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
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  studentCount?: number;
  staffCount?: number;
  batchCount?: number;
}

interface OrderHistory {
  id: string;
  status: string;
  submitted_at: string;
  student_count: number;
}

interface Student {
  id: string;
  name: string;
  father_name: string;
  mother_name: string;
  class: string;
  section: string;
  roll_number: string;
  photo_url: string | null;
  created_at: string;
}

interface Staff {
  id: string;
  name: string;
  staff_type: string;
  designation: string;
  department: string;
  employee_id: string;
  photo_url: string | null;
  created_at: string;
}

export default function SchoolDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [showStaff, setShowStaff] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSchoolDetails();
    fetchOrderHistory();
    fetchStudents();
    fetchStaff();
  }, [id]);

  const fetchSchoolDetails = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/schools/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch school details');
      }

      const data = await response.json();
      setSchool(data.data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load school details');
      navigate('/schools');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderHistory = async () => {
    setIsLoadingOrders(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/batches?schoolId=${id}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order history');
      }

      const data = await response.json();
      setOrderHistory(data.data || []);
    } catch (error: any) {
      console.error('Failed to load order history:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/schools/${id}/students?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data.data || []);
    } catch (error: any) {
      console.error('Failed to load students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const fetchStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/schools/${id}/staff?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }

      const data = await response.json();
      setStaff(data.data || []);
    } catch (error: any) {
      console.error('Failed to load staff:', error);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleDeleteSchool = async () => {
    if (!school) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/schools/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete school');
      }

      toast.success('School and all associated data deleted successfully');
      navigate('/schools');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete school');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!school) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/schools')}
              className="min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold flex-1 truncate">School Details</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Statistics */}
        {(
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{school.studentCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Registered students</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600">{school.staffCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Staff members</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{school.batchCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">ID card orders</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">School Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-1">School Name</p>
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">{school.name}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                  <p className="text-base break-all">{school.email}</p>
                </div>
              </div>
              
              {school.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                    <p className="text-base">{school.phone}</p>
                  </div>
                </div>
              )}
            </div>
            
            {school.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Complete Address</p>
                  <p className="text-base">{school.address}</p>
                </div>
              </div>
            )}
            
            <div className="pt-3 border-t">
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                  <p className="text-base">{new Date(school.created_at).toLocaleString()}</p>
                </div>
              </div>
              {school.updated_at && school.updated_at !== school.created_at && (
                <div className="flex items-start gap-2 mt-2">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-base">{new Date(school.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order History */}
        {orderHistory.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Orders</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/batches?schoolId=${id}`)}
                  className="min-h-[44px]"
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {orderHistory.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => navigate(`/batches/${order.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}...</p>
                        <p className="text-xs text-muted-foreground">
                          {order.student_count} students • {new Date(order.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                          order.status === 'submitted'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : order.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}
                      >
                        {order.status === 'submitted' ? 'New' : order.status === 'processing' ? 'In Progress' : 'Completed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Students */}
        {students.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Students ({students.length})
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStudents(!showStudents)}
                  className="min-h-[44px]"
                >
                  {showStudents ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {showStudents && (
              <CardContent>
                {isLoadingStudents ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {students.map((student) => (
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
                          <p className="font-medium truncate text-sm">{student.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Class {student.class}
                            {student.section && `-${student.section}`}
                            {student.roll_number && ` | Roll: ${student.roll_number}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )}

        {/* Staff */}
        {staff.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Staff ({staff.length})
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStaff(!showStaff)}
                  className="min-h-[44px]"
                >
                  {showStaff ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {showStaff && (
              <CardContent>
                {isLoadingStaff ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {staff.map((member) => (
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
                          <p className="font-medium truncate text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.designation}
                            {member.department && ` | ${member.department}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )}

        {/* Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">School Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">School Logo</p>
              {school.logo_url ? (
                <div
                  className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setSelectedImage(school.logo_url)}
                >
                  <img
                    src={school.logo_url}
                    alt="School Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">No logo uploaded</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Principal Signature</p>
              {school.signature_url ? (
                <div
                  className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setSelectedImage(school.signature_url)}
                >
                  <img
                    src={school.signature_url}
                    alt="Principal Signature"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">No signature uploaded</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-lg text-red-600 dark:text-red-400">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Deleting this school will permanently remove all associated data including students, staff, and batch submissions. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full min-h-[48px]"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete School
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete School</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{school?.name}"? This will permanently remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{school?.studentCount || 0} students</li>
                <li>{school?.staffCount || 0} staff members</li>
                <li>{school?.batchCount || 0} batch submissions</li>
                <li>All associated photos and documents</li>
              </ul>
              <p className="mt-3 font-semibold text-red-600 dark:text-red-400">
                This action cannot be undone!
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSchool}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Zoom Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[70vh] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
