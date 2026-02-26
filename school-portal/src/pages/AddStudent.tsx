import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FormInput } from '../components/ui/form-input';
import { FormSelect } from '../components/ui/form-select';
import { FormTextarea } from '../components/ui/form-textarea';
import { LoadingSpinner } from '../components/ui/loading-spinner';
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
import { PlusCircle, CheckCircle2 } from 'lucide-react';

const CLASSES = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
];

const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

const GENDERS = ['Male', 'Female', 'Other'];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function AddStudent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Photo state
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);

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

  const handleInputChange = (
    field: keyof StudentInput,
    value: string
  ) => {
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
    // Clear error for this field
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
      district: '', // Reset district when state changes
      city: '', // Reset city when state changes
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
    toast.success('Photo saved!');
  };

  const handleRemovePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoBlob(null);
    setPhotoPreview(null);
    toast.success('Photo removed');
  };

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Student name is required';
    }
    if (!formData.class) {
      newErrors.class = 'Class is required';
    }
    if (!formData.state) {
      newErrors.state = 'State is required';
    }
    if (!formData.district) {
      newErrors.district = 'District is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be exactly 6 digits';
    }

    // Phone number validation (if provided)
    if (formData.phone_number && formData.phone_number !== '+91') {
      if (!/^\+91[0-9]{10}$/.test(formData.phone_number)) {
        newErrors.phone_number = 'Phone number must be +91 followed by 10 digits';
      }
    }

    // Photo is optional - can be added later via edit
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShowPreview = () => {
    if (!validateForm()) {
      // Show the first specific error message
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast.error(firstError);
      } else {
        toast.error('Please fill in all required fields');
      }
      return;
    }
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Clean up phone number if it's just +91
      const dataToSubmit = {
        ...formData,
        phone_number: formData.phone_number === '+91' ? undefined : formData.phone_number,
      };

      // Create student first
      const response = await studentApi.create(dataToSubmit);

      if (response.success && response.data) {
        const studentId = response.data.id;

        // Upload photo (mandatory)
        if (photoBlob) {
          try {
            // Convert Blob to File
            const photoFile = new File([photoBlob], 'student-photo.jpg', { type: 'image/jpeg' });
            const photoResponse = await studentApi.uploadPhoto(studentId, photoFile);
            if (!photoResponse.success) {
              toast.warning('Student added but photo upload failed. You can upload it later.');
            }
          } catch (photoError) {
            console.error('Photo upload error:', photoError);
            toast.warning('Student added but photo upload failed. You can upload it later.');
          }
        }

        toast.success('Student added successfully!');
        setShowPreview(false);
        navigate('/students');
      } else {
        // Handle API errors
        if (response.error?.details) {
          const apiErrors: Record<string, string> = {};
          response.error.details.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              apiErrors[err.path[0]] = err.message;
            }
          });
          setErrors(apiErrors);
          setShowPreview(false);
          // Show the first specific error
          const firstError = Object.values(apiErrors)[0];
          toast.error(firstError || 'Please fix the errors in the form');
        } else {
          toast.error(response.error?.message || 'Failed to add student');
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An error occurred while adding the student');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-xl font-semibold">Add Student</h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="p-4 md:p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleShowPreview(); }} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
              <div className="space-y-4">
                <FormInput
                  id="name"
                  label="Student Name"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="Enter student's full name"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    id="father_name"
                    label="Father's Name"
                    value={formData.father_name || ''}
                    onChange={(e) => handleInputChange('father_name', e.target.value)}
                    placeholder="Enter father's name"
                  />

                  <FormInput
                    id="mother_name"
                    label="Mother's Name"
                    value={formData.mother_name}
                    onChange={(e) => handleInputChange('mother_name', e.target.value)}
                    error={errors.mother_name}
                    placeholder="Enter mother's name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    id="date_of_birth"
                    label="Date of Birth"
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  />

                  <FormSelect
                    id="gender"
                    label="Gender"
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange('gender', value)}
                    placeholder="Select gender"
                    options={GENDERS.map(g => ({ value: g, label: g }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    id="phone_number"
                    label="Phone Number"
                    type="tel"
                    value={formData.phone_number || ''}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    error={errors.phone_number}
                    placeholder="+91XXXXXXXXXX"
                    inputMode="numeric"
                  />

                  <FormSelect
                    id="blood_group"
                    label="Blood Group"
                    value={formData.blood_group}
                    onValueChange={(value) => handleInputChange('blood_group', value)}
                    placeholder="Select blood group"
                    options={BLOOD_GROUPS.map(bg => ({ value: bg, label: bg }))}
                  />
                </div>

                {/* Photo Upload - MANDATORY */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Student Photo <span className="text-red-500">*</span>
                  </label>
                  {photoPreview ? (
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        <img
                          src={photoPreview}
                          alt="Student preview"
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => setShowPhotoEditor(true)}
                          variant="outline"
                          size="sm"
                        >
                          Edit Photo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Button
                        type="button"
                        onClick={() => setShowPhotoEditor(true)}
                        variant="outline"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Photo
                      </Button>
                      {errors.photo && (
                        <p className="text-sm text-red-500 mt-2">{errors.photo}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        Required. Click to open photo editor with camera, upload, and background removal.
                      </p>
                      <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Note: Background removal may take up to 60 seconds on first use
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
                  <FormSelect
                    id="class"
                    label="Class"
                    required
                    value={formData.class}
                    onValueChange={(value) => handleInputChange('class', value)}
                    error={errors.class}
                    placeholder="Select class"
                    options={CLASSES.map(c => ({ value: c, label: c }))}
                  />

                  <FormSelect
                    id="section"
                    label="Section"
                    value={formData.section}
                    onValueChange={(value) => handleInputChange('section', value)}
                    placeholder="Select section"
                    options={SECTIONS.map(s => ({ value: s, label: s }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    id="roll_number"
                    label="Roll Number"
                    value={formData.roll_number || ''}
                    onChange={(e) => handleInputChange('roll_number', e.target.value)}
                    placeholder="Enter roll number"
                  />

                  <FormInput
                    id="student_id"
                    label="Student ID"
                    value={formData.student_id || ''}
                    onChange={(e) => handleInputChange('student_id', e.target.value)}
                    placeholder="Enter student ID"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Address Information</h2>
              <div className="space-y-4">
                <FormTextarea
                  id="address"
                  label="Address"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter complete address"
                  rows={3}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    id="state"
                    label="State"
                    required
                    value={formData.state}
                    onValueChange={handleStateChange}
                    error={errors.state}
                    placeholder="Select state"
                    options={states.map(s => ({ value: s, label: s }))}
                  />

                  <FormSelect
                    id="district"
                    label="District"
                    required
                    value={formData.district}
                    onValueChange={(value) => handleInputChange('district', value)}
                    error={errors.district}
                    disabled={!formData.state || loadingDistricts}
                    placeholder={loadingDistricts ? 'Loading...' : 'Select district'}
                    options={districts.map(d => ({ value: d, label: d }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    id="city"
                    label="City"
                    required
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    error={errors.city}
                    placeholder="Enter city"
                  />

                  <FormInput
                    id="pincode"
                    label="Pincode"
                    required
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    error={errors.pincode}
                    placeholder="Enter 6-digit pincode"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button - Above bottom nav on mobile */}
            <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t shadow-lg z-40 md:relative md:bottom-0 md:border-0 md:p-0 md:shadow-none">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner />
                    Saving...
                  </span>
                ) : (
                  'Preview & Save'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Photo Editor Modal */}
      {showPhotoEditor && (
        <PhotoEditor
          onClose={() => setShowPhotoEditor(false)}
          onSave={handlePhotoSaved}
          initialImage={photoPreview}
        />
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Student Details</DialogTitle>
            <DialogDescription>
              Review all information before saving
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Photo Preview - Large */}
            {photoPreview && (
              <div className="flex justify-center">
                <img
                  src={photoPreview}
                  alt="Student"
                  className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                />
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium">{formData.name}</p>
                </div>
                {formData.father_name && (
                  <div>
                    <p className="text-gray-500">Father's Name</p>
                    <p className="font-medium">{formData.father_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Mother's Name</p>
                  <p className="font-medium">{formData.mother_name}</p>
                </div>
                {formData.date_of_birth && (
                  <div>
                    <p className="text-gray-500">Date of Birth</p>
                    <p className="font-medium">{formatDate(formData.date_of_birth)}</p>
                  </div>
                )}
                {formData.gender && (
                  <div>
                    <p className="text-gray-500">Gender</p>
                    <p className="font-medium">{formData.gender}</p>
                  </div>
                )}
                {formData.blood_group && (
                  <div>
                    <p className="text-gray-500">Blood Group</p>
                    <p className="font-medium">{formData.blood_group}</p>
                  </div>
                )}
                {formData.phone_number && formData.phone_number !== '+91' && (
                  <div>
                    <p className="text-gray-500">Phone Number</p>
                    <p className="font-medium">{formData.phone_number}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base border-b pb-2">Academic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Class</p>
                  <p className="font-medium">{formData.class}</p>
                </div>
                {formData.section && (
                  <div>
                    <p className="text-gray-500">Section</p>
                    <p className="font-medium">{formData.section}</p>
                  </div>
                )}
                {formData.roll_number && (
                  <div>
                    <p className="text-gray-500">Roll Number</p>
                    <p className="font-medium">{formData.roll_number}</p>
                  </div>
                )}
                {formData.student_id && (
                  <div>
                    <p className="text-gray-500">Student ID</p>
                    <p className="font-medium">{formData.student_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base border-b pb-2">Address Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {formData.address && (
                  <div className="sm:col-span-2">
                    <p className="text-gray-500">Address</p>
                    <p className="font-medium">{formData.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">City</p>
                  <p className="font-medium">{formData.city}</p>
                </div>
                <div>
                  <p className="text-gray-500">District</p>
                  <p className="font-medium">{formData.district}</p>
                </div>
                <div>
                  <p className="text-gray-500">State</p>
                  <p className="font-medium">{formData.state}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pincode</p>
                  <p className="font-medium">{formData.pincode}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Edit
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  Saving Student...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Save
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
