import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { LoadingSpinner } from './ui/loading-spinner';
import { batchApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle } from 'lucide-react';

interface BatchSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudentIds: string[];
  onSuccess: () => void;
}

export function BatchSubmissionDialog({
  open,
  onOpenChange,
  selectedStudentIds,
  onSuccess,
}: BatchSubmissionDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const { school } = useAuth();
  const navigate = useNavigate();

  // Check if school has uploaded logo and signature
  const hasRequiredAssets = school?.logo_url && school?.signature_url;

  const handleSubmit = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('No students selected');
      return;
    }

    // Check for required assets before submission
    if (!hasRequiredAssets) {
      toast.error('Please upload school logo and principal signature before submitting batches');
      onOpenChange(false);
      navigate('/profile');
      return;
    }

    setSubmitting(true);

    try {
      const response = await batchApi.create(selectedStudentIds);

      if (response.success && response.data) {
        toast.success(
          `Batch submitted successfully! Submission ID: ${response.data.id.substring(0, 8)}...`
        );
        onOpenChange(false);
        onSuccess();
        // Navigate to submission history after successful submission
        setTimeout(() => navigate('/submissions'), 500);
      } else {
        if (response.error?.code === 'STUDENTS_ALREADY_SUBMITTED') {
          toast.error('Some students are already in a pending submission. View Submission History to see existing submissions.', {
            duration: 5000,
            action: {
              label: 'View History',
              onClick: () => navigate('/submissions'),
            },
          });
          onOpenChange(false);
        } else if (response.error?.code === 'MISSING_SCHOOL_ASSETS') {
          toast.error(response.error.message);
          onOpenChange(false);
          navigate('/profile');
        } else {
          toast.error(response.error?.message || 'Failed to submit batch');
        }
      }
    } catch (error) {
      console.error('Batch submission error:', error);
      toast.error('An error occurred while submitting the batch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit for Printing</DialogTitle>
          <DialogDescription>
            Are you sure you want to submit these students for ID card printing?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {!hasRequiredAssets && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-900 font-medium">Missing Required Assets</p>
                <p className="text-xs text-red-700 mt-1">
                  You need to upload your school logo and principal signature before submitting batches.
                  Click Submit to go to your profile page.
                </p>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-900 font-medium">
              Selected Students: {selectedStudentIds.length}
            </p>
            <p className="text-xs text-blue-700 mt-2">
              Once submitted, these students will be queued for ID card printing.
              You can track the status in the{' '}
              <button
                onClick={() => {
                  onOpenChange(false);
                  navigate('/submissions');
                }}
                className="underline font-medium hover:text-blue-900"
              >
                Submission History
              </button>{' '}
              page.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner />
                Submitting...
              </span>
            ) : hasRequiredAssets ? (
              'Submit Batch'
            ) : (
              'Go to Profile'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
