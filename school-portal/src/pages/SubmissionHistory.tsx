import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { batchApi } from '../lib/api';

interface BatchSubmission {
  id: string;
  school_id: string;
  status: 'submitted' | 'processing' | 'completed';
  submitted_at: string;
  processed_at: string | null;
  admin_notes: string | null;
  student_count: number;
}

const STATUS_COLORS = {
  submitted: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
};

const STATUS_LABELS = {
  submitted: 'Submitted',
  processing: 'Processing',
  completed: 'Completed',
};

export default function SubmissionHistory() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<BatchSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  const limit = 20;

  // Fetch submissions
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await batchApi.getAll({
        page: currentPage,
        limit,
      });

      if (response.success && response.data) {
        // Handle different response structures
        const responseData: any = response.data;
        const submissions = Array.isArray(responseData) 
          ? responseData 
          : (responseData.data || []);
        const pagination = responseData.pagination || response.pagination;
        
        setSubmissions(submissions);
        setTotalPages(pagination?.pages || 1);
        setTotalSubmissions(pagination?.total || submissions.length);
      } else {
        setSubmissions([]);
        setTotalPages(1);
        setTotalSubmissions(0);
        toast.error('Failed to load submissions');
      }
    } catch (error) {
      console.error('Fetch submissions error:', error);
      setSubmissions([]);
      setTotalPages(1);
      setTotalSubmissions(0);
      toast.error('An error occurred while loading submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="h-10 w-10 p-0"
            >
              ←
            </Button>
            <h1 className="text-xl font-semibold">Submission History</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : !submissions || submissions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-4">No submissions yet</p>
            <Button onClick={() => navigate('/students')}>
              Go to Students
            </Button>
          </Card>
        ) : (
          <>
            {/* Results Info */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Total Submissions: {totalSubmissions}
              </p>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-4">
              {submissions.map((submission) => (
                <Card key={submission.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Submission ID</p>
                        <p className="text-sm font-mono font-medium">
                          {submission.id.substring(0, 8)}...
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          STATUS_COLORS[submission.status]
                        }`}
                      >
                        {STATUS_LABELS[submission.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Students</p>
                        <p className="text-sm font-medium">{submission.student_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Submitted</p>
                        <p className="text-sm">{formatDate(submission.submitted_at)}</p>
                      </div>
                    </div>

                    {submission.processed_at && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Processed</p>
                        <p className="text-sm">{formatDate(submission.processed_at)}</p>
                      </div>
                    )}

                    {submission.admin_notes && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Admin Notes</p>
                        <p className="text-sm text-gray-700">{submission.admin_notes}</p>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/submissions/${submission.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Submission ID
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Students
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Submitted At
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Processed At
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {submissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono">
                            {submission.id.substring(0, 12)}...
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                STATUS_COLORS[submission.status]
                              }`}
                            >
                              {STATUS_LABELS[submission.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {submission.student_count}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {formatDate(submission.submitted_at)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {submission.processed_at
                              ? formatDate(submission.processed_at)
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/submissions/${submission.id}`)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
