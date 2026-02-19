import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { batchApi } from '../lib/api';

interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
  roll_number: string;
  photo_url: string | null;
}

interface Staff {
  id: string;
  name: string;
  designation: string;
  staff_type: string;
  department: string | null;
  photo_url: string | null;
}

interface SubmissionDetail {
  id: string;
  school_id: string;
  status: 'submitted' | 'processing' | 'completed';
  submitted_at: string;
  processed_at: string | null;
  admin_notes: string | null;
  students: Student[];
  staff: Staff[];
  studentCount: number;
  staffCount: number;
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

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissionDetail();
  }, [id]);

  const fetchSubmissionDetail = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await batchApi.getById(id);

      if (response.success && response.data) {
        // API returns { batch, students, staff, studentCount, staffCount }
        const { batch, students, staff, studentCount, staffCount } = response.data;
        setSubmission({
          ...batch,
          students: students || [],
          staff: staff || [],
          studentCount: studentCount || 0,
          staffCount: staffCount || 0,
        });
      } else {
        toast.error('Failed to load submission details');
        navigate('/submissions');
      }
    } catch (error) {
      console.error('Fetch submission detail error:', error);
      toast.error('An error occurred while loading submission details');
      navigate('/submissions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Submission not found</p>
      </div>
    );
  }

  const students = submission.students || [];
  const staff = submission.staff || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/submissions')}
              className="h-10 w-10 p-0"
            >
              ←
            </Button>
            <h1 className="text-xl font-semibold">Submission Details</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Submission Info Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">Submission Information</h2>
                <p className="text-sm text-gray-500 font-mono">ID: {submission.id}</p>
              </div>
              <span
                className={`text-sm px-3 py-1 rounded ${
                  STATUS_COLORS[submission.status]
                }`}
              >
                {STATUS_LABELS[submission.status]}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Students</p>
                <p className="text-lg font-semibold">{submission.studentCount || students.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Staff</p>
                <p className="text-lg font-semibold">{submission.staffCount || staff.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Submitted At</p>
                <p className="text-sm">{formatDate(submission.submitted_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Processed At</p>
                <p className="text-sm">
                  {submission.processed_at ? formatDate(submission.processed_at) : 'Not yet'}
                </p>
              </div>
            </div>

            {submission.admin_notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Admin Notes</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {submission.admin_notes}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Students List */}
        {students.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Students in this Submission ({students.length})</h2>
            
            {/* Mobile View */}
            <div className="md:hidden space-y-3">
              {students.map((student) => (
                <div key={student.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    {student.photo_url ? (
                      <img
                        src={student.photo_url}
                        alt={student.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 text-sm">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-600">
                        Class {student.class} {student.section} • Roll {student.roll_number}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Photo
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Class
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Section
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Roll Number
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {student.photo_url ? (
                          <img
                            src={student.photo_url}
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 text-sm">
                              {student.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{student.name}</td>
                      <td className="px-4 py-3 text-sm">{student.class}</td>
                      <td className="px-4 py-3 text-sm">{student.section}</td>
                      <td className="px-4 py-3 text-sm">{student.roll_number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Staff List */}
        {staff.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Staff in this Submission ({staff.length})</h2>
            
            {/* Mobile View */}
            <div className="md:hidden space-y-3">
              {staff.map((member) => (
                <div key={member.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 text-sm">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-600">
                        {member.designation} • {member.staff_type}
                        {member.department && ` • ${member.department}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Photo
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Designation
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Department
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {member.photo_url ? (
                          <img
                            src={member.photo_url}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 text-sm">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{member.name}</td>
                      <td className="px-4 py-3 text-sm">{member.designation}</td>
                      <td className="px-4 py-3 text-sm">{member.staff_type}</td>
                      <td className="px-4 py-3 text-sm">{member.department || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
