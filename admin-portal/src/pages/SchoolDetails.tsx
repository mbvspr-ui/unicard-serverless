import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Check, X, Mail, Phone, MapPin, Calendar, Image as ImageIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
}

export default function SchoolDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchSchoolDetails();
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

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/schools/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve school');
      }

      toast.success('School approved successfully');
      setShowApproveDialog(false);
      fetchSchoolDetails();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve school');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/schools/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected', reason: rejectionReason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject school');
      }

      toast.success('School rejected');
      setShowRejectDialog(false);
      setRejectionReason('');
      fetchSchoolDetails();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject school');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
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
        {/* Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Status</CardTitle>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(school.status)}`}>
                {school.status}
              </span>
            </div>
          </CardHeader>
          {school.status === 'rejected' && school.rejection_reason && (
            <CardContent>
              <p className="text-sm text-red-600 dark:text-red-400">
                <span className="font-medium">Rejection Reason:</span> {school.rejection_reason}
              </p>
            </CardContent>
          )}
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">School Name</p>
              <p className="text-base">{school.name}</p>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base break-all">{school.email}</p>
              </div>
            </div>
            {school.phone && (
              <div className="flex items-start gap-2">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-base">{school.phone}</p>
                </div>
              </div>
            )}
            {school.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-base">{school.address}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Registered</p>
                <p className="text-base">{new Date(school.created_at).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Action Buttons */}
        {school.status === 'pending' && (
          <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4">
            <Button
              variant="default"
              size="lg"
              onClick={() => setShowApproveDialog(true)}
              className="flex-1 min-h-[48px] bg-green-600 hover:bg-green-700"
            >
              <Check className="w-5 h-5 mr-2" />
              Approve School
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onClick={() => setShowRejectDialog(true)}
              className="flex-1 min-h-[48px]"
            >
              <X className="w-5 h-5 mr-2" />
              Reject School
            </Button>
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve School</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {school.name}? They will be able to access the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px] bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject School</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {school.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {isSubmitting ? 'Rejecting...' : 'Reject'}
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
