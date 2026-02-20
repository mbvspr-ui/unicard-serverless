import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FormInput } from '../components/ui/form-input';
import { FormSelect } from '../components/ui/form-select';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Checkbox } from '../components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet';
import { BatchSubmissionDialog } from '../components/BatchSubmissionDialog';
import { Header } from '../components/Header';
import { studentApi } from '../lib/api';
import { Student } from '../types';
import { addCacheBuster } from '../utils/photo';
import { Eye, RefreshCw } from 'lucide-react';

const CLASSES = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
];

const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function StudentList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const limit = 50;

  // Fetch students
  const fetchStudents = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const response = await studentApi.getAll({
        page: currentPage,
        limit,
        search: searchQuery || undefined,
        class: classFilter || undefined,
        section: sectionFilter || undefined,
        refresh: forceRefresh,
      });

      if (response.success) {
        // API response structure: { success, data: Student[], pagination: {...} }
        const studentsData = Array.isArray(response.data) ? response.data : [];
        // Add cache buster to all photo URLs
        const studentsWithFreshPhotos = studentsData.map(student => ({
          ...student,
          photo_url: student.photo_url ? addCacheBuster(student.photo_url) : null
        }));
        setStudents(studentsWithFreshPhotos);
        
        // Pagination is at root level of response
        const paginationData = (response as any).pagination;
        if (paginationData) {
          setTotalPages(paginationData.pages || 1);
          setTotalStudents(paginationData.total || 0);
        } else {
          setTotalPages(1);
          setTotalStudents(studentsData.length);
        }
      } else {
        setStudents([]);
        toast.error('Failed to load students');
      }
    } catch (error) {
      console.error('Fetch students error:', error);
      setStudents([]);
      toast.error('An error occurred while loading students');
    } finally {
      setLoading(false);
    }
  };

  // Fetch students on mount and when filters change
  useEffect(() => {
    fetchStudents();
  }, [currentPage, searchQuery, classFilter, sectionFilter, refreshKey]);

  // Refresh data when navigating back to this page
  useEffect(() => {
    // Force refresh when coming back from edit page
    setRefreshKey(prev => prev + 1);
  }, [location.key]);

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle filter changes
  const handleClassFilter = (value: string) => {
    setClassFilter(value);
    setCurrentPage(1);
  };

  const handleSectionFilter = (value: string) => {
    setSectionFilter(value);
    setCurrentPage(1);
  };

  // Handle student selection
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

  const toggleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  // Handle show details
  const handleShowDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsDrawer(true);
  };

  // Handle delete
  const handleDelete = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const response = await studentApi.delete(studentId);
      if (response.success) {
        toast.success('Student deleted successfully');
        fetchStudents();
      } else {
        toast.error(response.error?.message || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An error occurred while deleting the student');
    }
  };

  // Handle batch submission success
  const handleBatchSubmissionSuccess = () => {
    setSelectedStudents(new Set());
    fetchStudents();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <Header title="Students" showHome />
      
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchStudents(true)}
              variant="outline"
              className="h-10"
              disabled={loading}
              title="Refresh student count"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <span className="text-sm text-gray-600">
              {totalStudents} student{totalStudents !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/submissions')}
              variant="outline"
              className="h-10"
            >
              View Submissions
            </Button>
            <Button
              onClick={() => navigate('/students/add')}
              className="h-10"
            >
              + Add Student
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <FormInput
            placeholder="Search by name, father name, or roll number..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filter Toggle Button (Mobile) */}
        <div className="md:hidden">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        {/* Filters */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block mt-4 md:mt-0`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormSelect
              placeholder="All Classes"
              value={classFilter || undefined}
              onValueChange={handleClassFilter}
              options={CLASSES.map(c => ({ value: c, label: c }))}
            />
            <FormSelect
              placeholder="All Sections"
              value={sectionFilter || undefined}
              onValueChange={handleSectionFilter}
              options={SECTIONS.map(s => ({ value: s, label: s }))}
            />
            {(classFilter || sectionFilter) && (
              <Button
                variant="outline"
                onClick={() => {
                  setClassFilter('');
                  setSectionFilter('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Selection Info */}
        {selectedStudents.size > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-blue-50 p-3 rounded-lg">
            <span className="text-sm font-medium">
              {selectedStudents.size} student(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStudents(new Set())}
                className="flex-1 sm:flex-none"
              >
                Clear Selection
              </Button>
              <Button
                size="sm"
                onClick={() => setShowBatchDialog(true)}
                className="flex-1 sm:flex-none"
              >
                Submit for Printing
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : students.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-4">No students found</p>
            <Button onClick={() => navigate('/students/add')}>
              Add Your First Student
            </Button>
          </Card>
        ) : (
          <>
            {/* Results Info */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {students.length} of {totalStudents} students
              </p>
              {students.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {selectedStudents.size === students.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-4">
              {students.map((student) => (
                <Card key={student.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={() => toggleStudentSelection(student.id)}
                      className="mt-1"
                    />

                    {/* Photo */}
                    <div 
                      className="flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/students/edit/${student.id}`)}
                    >
                      {student.photo_url ? (
                        <img
                          src={addCacheBuster(student.photo_url)}
                          alt={student.name}
                          className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover border-2 border-gray-200 hover:border-blue-400 transition-colors"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-gray-200 hover:border-blue-400 transition-colors">
                          <span className="text-xl md:text-2xl font-semibold text-blue-600">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">
                        {student.name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        Father: {student.father_name || 'N/A'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {student.class}
                        </span>
                        {student.section && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Sec {student.section}
                          </span>
                        )}
                        {student.roll_number && (
                          <span className="text-xs text-gray-600">
                            Roll: {student.roll_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleShowDetails(student)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/students/edit/${student.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(student.id)}
                    >
                      Delete
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
                        <th className="px-4 py-3 text-left">
                          <Checkbox
                            checked={selectedStudents.size === students.length}
                            onCheckedChange={toggleSelectAll}
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Photo
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Father Name
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Class
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Section
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Roll No
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={selectedStudents.has(student.id)}
                              onCheckedChange={() => toggleStudentSelection(student.id)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div 
                              className="cursor-pointer"
                              onClick={() => navigate(`/students/edit/${student.id}`)}
                            >
                              {student.photo_url ? (
                                <img
                                  src={addCacheBuster(student.photo_url)}
                                  alt={student.name}
                                  className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover border-2 border-gray-200 hover:border-blue-400 transition-colors"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-gray-200 hover:border-blue-400 transition-colors">
                                  <span className="text-2xl font-semibold text-blue-600">
                                    {student.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {student.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.father_name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {student.class}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {student.section || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {student.roll_number || '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShowDetails(student)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/students/edit/${student.id}`)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDelete(student.id)}
                              >
                                Delete
                              </Button>
                            </div>
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

      {/* Floating Action Button (Mobile) */}
      <div className="md:hidden fixed bottom-20 right-4 z-20">
        <Button
          onClick={() => navigate('/students/add')}
          className="h-14 w-14 rounded-full shadow-lg"
        >
          +
        </Button>
      </div>

      {/* Batch Submission Dialog */}
      <BatchSubmissionDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        selectedStudentIds={Array.from(selectedStudents)}
        onSuccess={handleBatchSubmissionSuccess}
      />

      {/* Student Details Drawer */}
      <Sheet open={showDetailsDrawer} onOpenChange={setShowDetailsDrawer}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Student Details</SheetTitle>
            <SheetDescription>
              Complete information about the student
            </SheetDescription>
          </SheetHeader>

          {selectedStudent && (
            <div className="mt-6 space-y-6">
              {/* Photo */}
              {selectedStudent.photo_url && (
                <div className="flex justify-center">
                  <img
                    src={addCacheBuster(selectedStudent.photo_url)}
                    alt={selectedStudent.name}
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}

              {/* Personal Information */}
              <div>
                <h3 className="font-semibold text-base border-b pb-2 mb-3">Personal Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium">{selectedStudent.name}</p>
                  </div>
                  {selectedStudent.father_name && (
                    <div>
                      <p className="text-gray-500">Father's Name</p>
                      <p className="font-medium">{selectedStudent.father_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Mother's Name</p>
                    <p className="font-medium">{selectedStudent.mother_name}</p>
                  </div>
                  {selectedStudent.date_of_birth && (
                    <div>
                      <p className="text-gray-500">Date of Birth</p>
                      <p className="font-medium">{selectedStudent.date_of_birth}</p>
                    </div>
                  )}
                  {selectedStudent.gender && (
                    <div>
                      <p className="text-gray-500">Gender</p>
                      <p className="font-medium">{selectedStudent.gender}</p>
                    </div>
                  )}
                  {selectedStudent.blood_group && (
                    <div>
                      <p className="text-gray-500">Blood Group</p>
                      <p className="font-medium">{selectedStudent.blood_group}</p>
                    </div>
                  )}
                  {selectedStudent.phone_number && (
                    <div>
                      <p className="text-gray-500">Phone Number</p>
                      <p className="font-medium">{selectedStudent.phone_number}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h3 className="font-semibold text-base border-b pb-2 mb-3">Academic Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Class</p>
                    <p className="font-medium">{selectedStudent.class}</p>
                  </div>
                  {selectedStudent.section && (
                    <div>
                      <p className="text-gray-500">Section</p>
                      <p className="font-medium">{selectedStudent.section}</p>
                    </div>
                  )}
                  {selectedStudent.roll_number && (
                    <div>
                      <p className="text-gray-500">Roll Number</p>
                      <p className="font-medium">{selectedStudent.roll_number}</p>
                    </div>
                  )}
                  {selectedStudent.student_id && (
                    <div>
                      <p className="text-gray-500">Student ID</p>
                      <p className="font-medium">{selectedStudent.student_id}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="font-semibold text-base border-b pb-2 mb-3">Address Information</h3>
                <div className="space-y-3 text-sm">
                  {selectedStudent.address && (
                    <div>
                      <p className="text-gray-500">Address</p>
                      <p className="font-medium">{selectedStudent.address}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">City</p>
                    <p className="font-medium">{selectedStudent.city}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">District</p>
                    <p className="font-medium">{selectedStudent.district}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">State</p>
                    <p className="font-medium">{selectedStudent.state}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Pincode</p>
                    <p className="font-medium">{selectedStudent.pincode}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDetailsDrawer(false);
                    navigate(`/students/edit/${selectedStudent.id}`);
                  }}
                >
                  Edit Student
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDetailsDrawer(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
