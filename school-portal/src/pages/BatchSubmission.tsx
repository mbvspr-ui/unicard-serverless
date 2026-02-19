import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { BatchSubmissionDialog } from '../components/BatchSubmissionDialog';
import { Header } from '../components/Header';
import { studentApi, staffApi } from '../lib/api';
import { Student, Staff } from '../types';
import { Users, Briefcase, Send } from 'lucide-react';

export default function BatchSubmission() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'staff'>('students');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsResponse, staffResponse] = await Promise.all([
        studentApi.getAll({ limit: 1000 }),
        staffApi.getAll({ limit: 1000 }),
      ]);

      if (studentsResponse.success) {
        const studentsData = Array.isArray(studentsResponse.data) ? studentsResponse.data : [];
        // Filter only students with photos
        setStudents(studentsData.filter(s => s.photo_url));
      }

      if (staffResponse.success) {
        const staffData = Array.isArray(staffResponse.data) ? staffResponse.data : [];
        // Filter only staff with photos
        setStaff(staffData.filter(s => s.photo_url));
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaff(prev => {
      const newSet = new Set(prev);
      if (newSet.has(staffId)) {
        newSet.delete(staffId);
      } else {
        newSet.add(staffId);
      }
      return newSet;
    });
  };

  const toggleSelectAllStudents = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const toggleSelectAllStaff = () => {
    if (selectedStaff.size === staff.length) {
      setSelectedStaff(new Set());
    } else {
      setSelectedStaff(new Set(staff.map(s => s.id)));
    }
  };

  const handleSubmitBatch = () => {
    const totalSelected = selectedStudents.size + selectedStaff.size;
    if (totalSelected === 0) {
      toast.error('Please select at least one student or staff member');
      return;
    }
    setShowBatchDialog(true);
  };

  const handleBatchSubmissionSuccess = () => {
    setSelectedStudents(new Set());
    setSelectedStaff(new Set());
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const totalSelected = selectedStudents.size + selectedStaff.size;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <Header title="Submit for Printing" showHome />
      
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Info Card */}
        <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-900">
            Select students and staff members with photos to submit for ID card printing.
            Only members with uploaded photos can be selected.
          </p>
        </Card>

        {/* Selection Summary */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
            </span>
            <span className="text-sm text-gray-600">
              {selectedStaff.size} staff selected
            </span>
            <span className="text-sm font-semibold text-gray-900">
              Total: {totalSelected}
            </span>
          </div>
          <Button
            onClick={handleSubmitBatch}
            disabled={totalSelected === 0}
            className="h-10"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit for Printing ({totalSelected})
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'students'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'staff'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Briefcase className="w-4 h-4 inline mr-2" />
            Staff ({staff.length})
          </button>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Students with Photos</h3>
              <Button
                onClick={toggleSelectAllStudents}
                variant="outline"
                size="sm"
              >
                {selectedStudents.size === students.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {students.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No students with photos found. Please add photos to students first.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedStudents.has(student.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleStudentSelection(student.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={() => toggleStudentSelection(student.id)}
                      />
                      <img
                        src={student.photo_url!}
                        alt={student.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-600">
                          Class {student.class} {student.section}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Staff with Photos</h3>
              <Button
                onClick={toggleSelectAllStaff}
                variant="outline"
                size="sm"
              >
                {selectedStaff.size === staff.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {staff.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No staff with photos found. Please add photos to staff first.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedStaff.has(member.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleStaffSelection(member.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedStaff.has(member.id)}
                        onCheckedChange={() => toggleStaffSelection(member.id)}
                      />
                      <img
                        src={member.photo_url!}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">
                          {member.designation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Batch Submission Dialog */}
      <BatchSubmissionDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        selectedStudentIds={Array.from(selectedStudents)}
        selectedStaffIds={Array.from(selectedStaff)}
        onSuccess={handleBatchSubmissionSuccess}
      />
    </div>
  );
}
