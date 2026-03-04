import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FormInput } from '../components/ui/form-input';
import { FormSelect } from '../components/ui/form-select';
import { FormTextarea } from '../components/ui/form-textarea';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Checkbox } from '../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { PhotoEditor } from '../components/PhotoEditor';
import { studentApi, locationApi } from '../lib/api';
import { StudentInput } from '../types';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { addCacheBuster, clearPhotoCache } from '../utils/photo';

const CLASSES = [
  'Nursery', 'KG', 'KG1', 'KG2', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
];

const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];
const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function EditStudent() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Field selection for editing
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [originalData, setOriginalData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Photo state
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<StudentInput>({
    name: '',
    father_name: '',
    mother_name: '',
    class: '',
    section: '',
    roll_number: '',
    student_id: '',
    date_of_birth: '',
    gender: '',
    phone_number: '+91',
    blood_group: '',
    address: '',
    state: '',
    district: '',
    city: '',
    pincode: '',
  });

  // Load student data
  useEffect(() => {
    const loadStudent = async () => {
      if (!studentId) {
        toast.error('Student ID is missing');
        navigate('/students');
        return;
      }

      try {
        const response = await studentApi.getById(studentId);
        if (response.success && response.data) {
          const student = response.data;
          
          // Helper function to convert ISO date to DD/MM/YYYY format
          const formatDateForInput = (isoDate: string | null | undefined): string => {
            if (!isoDate) return '';
            try {
              const date = new Date(isoDate);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            } catch {
              return '';
            }
          };
          
          const studentData = {
            name: student.name,
            father_name: student.father_name || '',
            mother_name: student.mother_name,
            class: student.class,
            section: student.section || '',
            roll_number: student.roll_number || '',
            student_id: student.student_id || '',
            date_of_birth: formatDateForInput(student.date_of_birth),
            gender: student.gender || '',
            phone_number: student.phone_number || '+91',
            blood_group: student.blood_group || '',
            address: student.address || '',
            state: student.state,
            district: student.district,
            city: student.city,
            pincode: student.pincode,
          };
          setFormData(studentData);
          setOriginalData(studentData); // Save original for comparison
          
          // Load current photo with cache-busting
          if (student.photo_url) {
            setCurrentPhotoUrl(addCacheBuster(student.photo_url));
          }
        } else {
          toast.error('Failed to load student data');
          navigate('/students');
        }
      } catch (error) {
        console.error('Load student error:', error);
        toast.error('An error occurred while loading student data');
        navigate('/students');
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [studentId, navigate]);

  // Load states on mount
  useEffect(() => {
    const loadStates = async () => {
      try {
        const statesList = await locationApi.getStates();
        setStates(statesList);
      } catch (error) {
        console.error('Failed to load states:', error);
      }
    };
    loadStates();
  }, []);

  // Load districts when state changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (!formData.state) {
        setDistricts([]);
        return;
      }

      setLoadingDistricts(true);
      try {
        const districtsList = await locationApi.getDistricts(formData.state);
        setDistricts(districtsList);
      } catch (error) {
        console.error('Failed to load districts:', error);
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };
    loadDistricts();
  }, [formData.state]);

  const handleInputChange = (field: keyof StudentInput, value: string) => {
    // Special handling for phone number to keep +91 prefix
    if (field === 'phone_number') {
      // Always ensure +91 prefix
      if (!value.startsWith('+91')) {
        value = '+91';
      }
      // Limit to +91 + 10 digits
      if (value.length > 13) {
        value = value.substring(0, 13);
      }
      // Only allow digits after +91
      const prefix = '+91';
      const digits = value.substring(3).replace(/\D/g, '');
      value = prefix + digits;
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleStateChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      state: value,
      district: '',
      city: '',
    }));
    if (errors.state) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.state;
        return newErrors;
      });
    }
  };

  const handlePhotoSaved = (blob: Blob) => {
    // Clean up old preview URL
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    
    // Create new preview URL
    const previewUrl = URL.createObjectURL(blob);
    setPhotoBlob(blob);
    setPhotoPreview(previewUrl);
    setShowPhotoEditor(false);
    toast.success('Photo updated!');
  };

  const handleRemovePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoBlob(null);
    setPhotoPreview(null);
    setCurrentPhotoUrl(null);
    toast.success('Photo removed');
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  // Toggle field selection for editing
  const toggleField = (field: string, checked: boolean) => {
    setSelectedFields(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(field);
      } else {
        newSet.delete(field);
      }
      return newSet;
    });
  };

  // Show preview dialog
  const handleShowPreview = () => {
    if (selectedFields.size === 0 && !photoBlob) {
      toast.error('Please select at least one field to edit or update the photo');
      return;
    }
    
    // Validate only selected fields with specific error messages (excluding photo)
    const newErrors: Record<string, string> = {};
    const fieldLabels: Record<string, string> = {
      name: 'Student Name',
      father_name: 'Father Name',
      mother_name: 'Mother Name',
      class: 'Class',
      section: 'Section',
      roll_number: 'Roll Number',
      student_id: 'Student ID',
      date_of_birth: 'Date of Birth',
      gender: 'Gender',
      phone_number: 'Phone Number',
      blood_group: 'Blood Group',
      address: 'Address',
      state: 'State',
      district: 'District',
      city: 'City',
      pincode: 'Pincode',
    };
    
    selectedFields.forEach(field => {
      // Skip photo field validation
      if (field === 'photo') return;
      
      const value = formData[field as keyof StudentInput];
      const label = fieldLabels[field] || field;
      
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        newErrors[field] = `${label} is required`;
      } else if (field === 'phone_number' && typeof value === 'string') {
        if (value.length < 10) {
          newErrors[field] = 'Phone number must be at least 10 digits';
        }
      } else if (field === 'pincode' && typeof value === 'string') {
        if (value.length !== 6) {
          newErrors[field] = 'Pincode must be exactly 6 digits';
        }
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Show the first error message
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return;
    }
    
    setShowPreview(true);
  };

  // Convert DD/MM/YYYY to ISO format (YYYY-MM-DD)
  const convertDateToISO = (dateStr: string): string | undefined => {
    if (!dateStr || dateStr.trim() === '') return undefined;
    
    // Check if already in ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Parse DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      
      // Validate date
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return `${year}-${month}-${day}`;
      }
    }
    
    return undefined;
  };

  // Confirm and save changes
  const handleConfirmSave = async () => {
    if (!studentId) {
      toast.error('Student ID is missing');
      return;
    }

    setSaving(true);
    try {
      // Build update object with only selected fields (excluding photo)
      const updates: any = {};
      selectedFields.forEach(field => {
        if (field !== 'photo') {
          let value = formData[field as keyof StudentInput];
          
          // Convert date if it's date_of_birth field
          if (field === 'date_of_birth' && typeof value === 'string') {
            value = convertDateToISO(value) as any;
          }
          
          updates[field] = value;
        }
      });
      
      // Clean up phone number
      if (updates.phone_number === '+91') {
        updates.phone_number = undefined;
      }

      // Only call update API if there are fields to update
      if (Object.keys(updates).length > 0) {
        const response = await studentApi.update(studentId, updates);

        if (!response.success) {
          if (response.error?.details) {
            const apiErrors: Record<string, string> = {};
            response.error.details.forEach((err: any) => {
              if (err.path && err.path.length > 0) {
                apiErrors[err.path[0]] = err.message;
              }
            });
            setErrors(apiErrors);
            setShowPreview(false);
            toast.error(response.error?.message || 'Failed to update student');
            setSaving(false);
            return;
          } else {
            toast.error(response.error?.message || 'Failed to update student');
            setSaving(false);
            return;
          }
        }
      }

      // Upload new photo if changed
      if (photoBlob) {
        try {
          const photoFile = new File([photoBlob], 'student-photo.jpg', { type: 'image/jpeg' });
          const photoResponse = await studentApi.uploadPhoto(studentId, photoFile);
          if (!photoResponse.success) {
            toast.warning('Student updated but photo upload failed. You can update it later.');
          } else {
            // Force immediate cache clear for the photo
            await clearPhotoCache(currentPhotoUrl);
          }
        } catch (photoError) {
          console.error('Photo upload error:', photoError);
          toast.warning('Student updated but photo upload failed. You can update it later.');
        }
      }

      toast.success('Student updated successfully!');
      // Navigate immediately - the list will show updated photo with cache buster
      navigate('/students');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('An error occurred while updating the student');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="h-10 w-10 p-0"
          >
            ←
          </Button>
          <h1 className="text-xl font-semibold">Edit Student</h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="p-4 md:p-6">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>How to edit:</strong> Check the box next to each field you want to update, 
              make your changes, then click "Preview Changes" to review before saving.
            </p>
            {selectedFields.size > 0 && (
              <p className="text-sm text-blue-600 mt-2">
                ✓ {selectedFields.size} field{selectedFields.size > 1 ? 's' : ''} selected for editing
              </p>
            )}
          </div>

          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="edit-name"
                    checked={selectedFields.has('name')}
                    onCheckedChange={(checked) => toggleField('name', checked as boolean)}
                    className="mt-8"
                    title="Check to edit this field"
                  />
                  <div className="flex-1">
                    <FormInput
                      id="name"
                      label="Student Name"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={errors.name}
                      disabled={!selectedFields.has('name')}
                      placeholder="Enter student's full name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-father-name"
                      checked={selectedFields.has('father_name')}
                      onCheckedChange={(checked) => toggleField('father_name', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormInput
                        id="father_name"
                        label="Father's Name"
                        value={formData.father_name || ''}
                        onChange={(e) => handleInputChange('father_name', e.target.value)}
                        disabled={!selectedFields.has('father_name')}
                        placeholder="Enter father's name"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-mother-name"
                      checked={selectedFields.has('mother_name')}
                      onCheckedChange={(checked) => toggleField('mother_name', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormInput
                        id="mother_name"
                        label="Mother's Name"
                        value={formData.mother_name}
                        onChange={(e) => handleInputChange('mother_name', e.target.value)}
                        error={errors.mother_name}
                        disabled={!selectedFields.has('mother_name')}
                        placeholder="Enter mother's name"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-dob"
                      checked={selectedFields.has('date_of_birth')}
                      onCheckedChange={(checked) => toggleField('date_of_birth', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      {!selectedFields.has('date_of_birth') && formData.date_of_birth ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date of Birth
                          </label>
                          <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                            {new Date(formData.date_of_birth).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      ) : (
                        <FormInput
                          id="date_of_birth"
                          label="Date of Birth (DD/MM/YYYY)"
                          type="text"
                          value={formData.date_of_birth || ''}
                          onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                          disabled={!selectedFields.has('date_of_birth')}
                          placeholder="DD/MM/YYYY"
                          maxLength={10}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-gender"
                      checked={selectedFields.has('gender')}
                      onCheckedChange={(checked) => toggleField('gender', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormSelect
                        id="gender"
                        label="Gender"
                        value={formData.gender || undefined}
                        onValueChange={(value) => handleInputChange('gender', value)}
                        disabled={!selectedFields.has('gender')}
                        placeholder="Select gender"
                        options={GENDERS.map(g => ({ value: g, label: g }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-phone"
                      checked={selectedFields.has('phone_number')}
                      onCheckedChange={(checked) => toggleField('phone_number', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormInput
                        id="phone_number"
                        label="Phone Number"
                        type="tel"
                        value={formData.phone_number || ''}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        error={errors.phone_number}
                        disabled={!selectedFields.has('phone_number')}
                        placeholder="+91XXXXXXXXXX"
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-blood-group"
                      checked={selectedFields.has('blood_group')}
                      onCheckedChange={(checked) => toggleField('blood_group', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormSelect
                        id="blood_group"
                        label="Blood Group"
                        value={formData.blood_group || undefined}
                        onValueChange={(value) => handleInputChange('blood_group', value)}
                        disabled={!selectedFields.has('blood_group')}
                        placeholder="Select blood group"
                        options={BLOOD_GROUPS.map(bg => ({ value: bg, label: bg }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium mb-2">
                    Student Photo {photoBlob && <span className="text-green-600">(New photo selected)</span>}
                  </label>
                  {photoPreview || currentPhotoUrl ? (
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        <img
                          src={photoPreview || currentPhotoUrl || ''}
                          alt="Student preview"
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        {photoBlob && (
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            New
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => setShowPhotoEditor(true)}
                          variant="outline"
                          size="sm"
                          className="min-h-[44px]"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Change Photo
                        </Button>
                        {photoBlob && (
                          <Button
                            type="button"
                            onClick={() => {
                              if (photoPreview) {
                                URL.revokeObjectURL(photoPreview);
                              }
                              setPhotoBlob(null);
                              setPhotoPreview(null);
                            }}
                            variant="outline"
                            size="sm"
                            className="min-h-[44px] text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Cancel New Photo
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Button
                        type="button"
                        onClick={() => setShowPhotoEditor(true)}
                        variant="outline"
                        className="min-h-[44px]"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Photo
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        Click to open photo editor with camera, upload, and crop tools.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Academic Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-class"
                      checked={selectedFields.has('class')}
                      onCheckedChange={(checked) => toggleField('class', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormSelect
                        id="class"
                        label="Class"
                        required
                        value={formData.class || undefined}
                        onValueChange={(value) => handleInputChange('class', value)}
                        error={errors.class}
                        disabled={!selectedFields.has('class')}
                        placeholder="Select class"
                        options={CLASSES.map(c => ({ value: c, label: c }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-section"
                      checked={selectedFields.has('section')}
                      onCheckedChange={(checked) => toggleField('section', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormSelect
                        id="section"
                        label="Section"
                        value={formData.section || undefined}
                        onValueChange={(value) => handleInputChange('section', value)}
                        disabled={!selectedFields.has('section')}
                        placeholder="Select section"
                        options={SECTIONS.map(s => ({ value: s, label: s }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-roll"
                      checked={selectedFields.has('roll_number')}
                      onCheckedChange={(checked) => toggleField('roll_number', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormInput
                        id="roll_number"
                        label="Roll Number"
                        value={formData.roll_number || ''}
                        onChange={(e) => handleInputChange('roll_number', e.target.value)}
                        disabled={!selectedFields.has('roll_number')}
                        placeholder="Enter roll number"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-student-id"
                      checked={selectedFields.has('student_id')}
                      onCheckedChange={(checked) => toggleField('student_id', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormInput
                        id="student_id"
                        label="Student ID"
                        value={formData.student_id || ''}
                        onChange={(e) => handleInputChange('student_id', e.target.value)}
                        disabled={!selectedFields.has('student_id')}
                        placeholder="Enter student ID"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Address Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="edit-address"
                    checked={selectedFields.has('address')}
                    onCheckedChange={(checked) => toggleField('address', checked as boolean)}
                    className="mt-8"
                    title="Check to edit this field"
                  />
                  <div className="flex-1">
                    <FormTextarea
                      id="address"
                      label="Full Address"
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!selectedFields.has('address')}
                      placeholder="Enter complete address including city, state, and pincode"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button - Above bottom nav on mobile */}
            <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t shadow-lg z-40 md:relative md:bottom-0 md:border-0 md:p-0 md:shadow-none">
              <Button
                type="button"
                onClick={handleShowPreview}
                disabled={saving || (selectedFields.size === 0 && !photoBlob)}
                className="w-full h-12 text-base font-medium"
              >
                {selectedFields.size === 0 && !photoBlob
                  ? 'Select fields to edit'
                  : `Preview Changes (${selectedFields.size} field${selectedFields.size > 1 ? 's' : ''}${photoBlob ? ' + photo' : ''})`
                }
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Photo Editor Modal */}
      {showPhotoEditor && (
        <PhotoEditor
          onClose={() => setShowPhotoEditor(false)}
          onSave={handlePhotoSaved}
          initialImage={photoPreview || currentPhotoUrl}
        />
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Changes</DialogTitle>
            <DialogDescription>
              Review the changes before saving. {selectedFields.size} field(s) will be updated{photoBlob ? ' and photo will be uploaded' : ''}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {Array.from(selectedFields).map(field => {
              const fieldLabels: Record<string, string> = {
                name: 'Student Name',
                father_name: "Father's Name",
                mother_name: "Mother's Name",
                class: 'Class',
                section: 'Section',
                roll_number: 'Roll Number',
                student_id: 'Student ID',
                date_of_birth: 'Date of Birth',
                gender: 'Gender',
                phone_number: 'Phone Number',
                blood_group: 'Blood Group',
                address: 'Address',
                state: 'State',
                district: 'District',
                city: 'City',
                pincode: 'Pincode',
              };

              const hasChanged = originalData && originalData[field] !== formData[field as keyof StudentInput];

              return (
                <div key={field} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="text-sm font-medium text-gray-700">{fieldLabels[field]}</p>
                  {hasChanged ? (
                    <div className="text-sm mt-1">
                      <span className="text-gray-400 line-through">{originalData[field] || '(empty)'}</span>
                      <span className="mx-2">→</span>
                      <span className="text-green-600 font-medium">{formData[field as keyof StudentInput]}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">{formData[field as keyof StudentInput]}</p>
                  )}
                </div>
              );
            })}

            {photoBlob && (
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="text-sm font-medium text-gray-700">Photo</p>
                <p className="text-sm text-green-600 mt-1">New photo will be uploaded</p>
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="New photo"
                    className="w-32 h-32 object-cover rounded-lg border mt-2"
                  />
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              Edit
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  Saving...
                </span>
              ) : (
                'Confirm & Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
