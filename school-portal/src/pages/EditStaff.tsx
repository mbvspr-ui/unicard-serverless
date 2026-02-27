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
import { staffApi, locationApi } from '../lib/api';
import { StaffInput } from '../types';
import { Briefcase, Edit2, Trash2, PlusCircle } from 'lucide-react';
import { Header } from '../components/Header';
import { addCacheBuster, clearPhotoCache } from '../utils/photo';

const STAFF_TYPES = ['Teaching', 'Non-Teaching', 'Administrative', 'Support'];
const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function EditStaff() {
  const navigate = useNavigate();
  const { staffId } = useParams<{ staffId: string }>();
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
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);

  const [formData, setFormData] = useState<StaffInput>({
    name: '',
    father_spouse_name: '',
    date_of_birth: '',
    gender: undefined,
    phone_number: '+91',
    blood_group: undefined,
    employee_id: '',
    staff_type: 'Teaching',
    designation: '',
    department: '',
    date_of_joining: '',
    qualification: '',
    address: '',
    state: '',
    district: '',
    city: '',
    pincode: '',
    emergency_contact_name: '',
    emergency_contact_number: '+91',
    emergency_contact_relationship: '',
  });

  // Load staff data
  useEffect(() => {
    const loadStaff = async () => {
      if (!staffId) {
        toast.error('Staff ID is missing');
        navigate('/staff');
        return;
      }

      try {
        const response = await staffApi.getById(staffId);
        if (response.success && response.data) {
          const staff = response.data;
          
          // Helper function to convert ISO date to yyyy-MM-dd format
          const formatDateForInput = (isoDate: string | null | undefined): string => {
            if (!isoDate) return '';
            try {
              const date = new Date(isoDate);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            } catch {
              return '';
            }
          };
          
          setFormData({
            name: staff.name,
            father_spouse_name: staff.father_spouse_name || '',
            date_of_birth: formatDateForInput(staff.date_of_birth),
            gender: staff.gender,
            phone_number: staff.phone_number || '+91',
            blood_group: staff.blood_group || '',
            employee_id: staff.employee_id || '',
            staff_type: staff.staff_type,
            designation: staff.designation,
            department: staff.department || '',
            date_of_joining: formatDateForInput(staff.date_of_joining),
            qualification: staff.qualification || '',
            address: staff.address || '',
            state: staff.state,
            district: staff.district,
            city: staff.city,
            pincode: staff.pincode,
            emergency_contact_name: staff.emergency_contact_name || '',
            emergency_contact_number: staff.emergency_contact_number || '+91',
            emergency_contact_relationship: staff.emergency_contact_relationship || '',
          });
          
          setOriginalData({
            name: staff.name,
            father_spouse_name: staff.father_spouse_name || '',
            date_of_birth: formatDateForInput(staff.date_of_birth),
            gender: staff.gender,
            phone_number: staff.phone_number || '+91',
            blood_group: staff.blood_group || '',
            employee_id: staff.employee_id || '',
            staff_type: staff.staff_type,
            designation: staff.designation,
            department: staff.department || '',
            date_of_joining: formatDateForInput(staff.date_of_joining),
            qualification: staff.qualification || '',
            address: staff.address || '',
            state: staff.state,
            district: staff.district,
            city: staff.city,
            pincode: staff.pincode,
            emergency_contact_name: staff.emergency_contact_name || '',
            emergency_contact_number: staff.emergency_contact_number || '+91',
            emergency_contact_relationship: staff.emergency_contact_relationship || '',
          });
          
          if (staff.photo_url) {
            setCurrentPhotoUrl(addCacheBuster(staff.photo_url));
          }
        } else {
          toast.error('Failed to load staff data');
          navigate('/staff');
        }
      } catch (error) {
        console.error('Load staff error:', error);
        toast.error('An error occurred while loading staff data');
        navigate('/staff');
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, [staffId, navigate]);

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

  const handleInputChange = (field: keyof StaffInput, value: string) => {
    // Special handling for phone numbers to keep +91 prefix
    if (field === 'phone_number' || field === 'emergency_contact_number') {
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
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    
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
    
    // Validate only selected fields with specific error messages
    const newErrors: Record<string, string> = {};
    const fieldLabels: Record<string, string> = {
      name: 'Full Name',
      father_spouse_name: "Father's/Spouse Name",
      date_of_birth: 'Date of Birth',
      gender: 'Gender',
      phone_number: 'Phone Number',
      blood_group: 'Blood Group',
      employee_id: 'Employee ID',
      staff_type: 'Staff Type',
      designation: 'Designation',
      department: 'Department/Subject',
      date_of_joining: 'Date of Joining',
      qualification: 'Qualification',
      address: 'Address',
      state: 'State',
      district: 'District',
      city: 'City',
      pincode: 'Pincode',
      emergency_contact_name: 'Emergency Contact Name',
      emergency_contact_number: 'Emergency Contact Number',
      emergency_contact_relationship: 'Emergency Contact Relationship',
    };
    
    selectedFields.forEach(field => {
      const value = formData[field as keyof StaffInput];
      const label = fieldLabels[field] || field;
      
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        newErrors[field] = `${label} is required`;
      } else if (field === 'phone_number' && typeof value === 'string') {
        if (value !== '+91' && value.length < 10) {
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
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return;
    }
    
    setShowPreview(true);
  };

  // Confirm and save changes
  const handleConfirmSave = async () => {
    if (!staffId) {
      toast.error('Staff ID is missing');
      return;
    }

    setSaving(true);
    try {
      // Build update object with only selected fields
      const updates: any = {};
      selectedFields.forEach(field => {
        updates[field] = formData[field as keyof StaffInput];
      });
      
      // Clean up phone numbers
      if (updates.phone_number === '+91') {
        updates.phone_number = undefined;
      }
      if (updates.emergency_contact_number === '+91') {
        updates.emergency_contact_number = undefined;
      }

      // Only call update API if there are fields to update
      if (Object.keys(updates).length > 0) {
        const response = await staffApi.update(staffId, updates);

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
            toast.error(response.error?.message || 'Failed to update staff member');
            setSaving(false);
            return;
          } else {
            toast.error(response.error?.message || 'Failed to update staff member');
            setSaving(false);
            return;
          }
        }
      }

      // Upload new photo if changed
      if (photoBlob) {
        try {
          const photoFile = new File([photoBlob], 'staff-photo.jpg', { type: 'image/jpeg' });
          const photoResponse = await staffApi.uploadPhoto(staffId, photoFile);
          if (!photoResponse.success) {
            toast.warning('Staff updated but photo upload failed. You can update it later.');
          } else {
            // Force immediate cache clear for the photo
            await clearPhotoCache(currentPhotoUrl);
          }
        } catch (photoError) {
          console.error('Photo upload error:', photoError);
          toast.warning('Staff updated but photo upload failed. You can update it later.');
        }
      }

      toast.success('Staff member updated successfully!');
      navigate('/staff');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('An error occurred while updating staff member');
    } finally {
      setSaving(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.staff_type) newErrors.staff_type = 'Staff type is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.district) newErrors.district = 'District is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Pincode must be 6 digits';

    // Phone number validation (if provided)
    if (formData.phone_number && formData.phone_number !== '+91') {
      if (!/^\+91[0-9]{10}$/.test(formData.phone_number)) {
        newErrors.phone_number = 'Phone number must be +91 followed by 10 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (!staffId) {
      toast.error('Staff ID is missing');
      return;
    }

    setSaving(true);

    try {
      const updates: StaffInput = {
        ...formData,
        phone_number: formData.phone_number === '+91' ? undefined : formData.phone_number,
        emergency_contact_number: formData.emergency_contact_number === '+91' ? undefined : formData.emergency_contact_number,
      };

      const response = await staffApi.update(staffId, updates);

      if (response.success) {
        // Upload new photo if changed
        if (photoBlob) {
          try {
            const photoFile = new File([photoBlob], 'staff-photo.jpg', { type: 'image/jpeg' });
            const photoResponse = await staffApi.uploadPhoto(staffId, photoFile);
            if (!photoResponse.success) {
              toast.warning('Staff updated but photo upload failed. You can update it later.');
            } else {
              // Force immediate cache clear for the photo
              await clearPhotoCache(currentPhotoUrl);
            }
          } catch (photoError) {
            console.error('Photo upload error:', photoError);
            toast.warning('Staff updated but photo upload failed. You can update it later.');
          }
        }

        toast.success('Staff member updated successfully!');
        navigate('/staff');
      } else {
        if (response.error?.details) {
          const apiErrors: Record<string, string> = {};
          response.error.details.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              apiErrors[err.path[0]] = err.message;
            }
          });
          setErrors(apiErrors);
          // Show the first specific error
          const firstError = Object.values(apiErrors)[0];
          toast.error(firstError || 'Please fix the errors in the form');
        } else {
          toast.error(response.error?.message || 'Failed to update staff member');
        }
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('An error occurred while updating staff member');
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
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <Header title="Edit Staff Member" showBack />

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

          <form onSubmit={(e) => { e.preventDefault(); handleShowPreview(); }}>
            {/* Photo Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Photo</h3>
              <div className="flex flex-col items-center gap-4">
                {photoPreview || currentPhotoUrl ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img
                        src={photoPreview || currentPhotoUrl || ''}
                        alt="Staff photo"
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                      />
                      {photoBlob && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          New
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 justify-center">
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
                    <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200 mb-4">
                      <Briefcase className="w-16 h-16 text-gray-400" />
                    </div>
                    <Button
                      type="button"
                      onClick={() => setShowPhotoEditor(true)}
                      variant="outline"
                      className="min-h-[44px]"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Photo
                    </Button>
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Click to open photo editor
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
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
                      label="Full Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={errors.name}
                      disabled={!selectedFields.has('name')}
                      placeholder="Enter full name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-father-spouse"
                      checked={selectedFields.has('father_spouse_name')}
                      onCheckedChange={(checked) => toggleField('father_spouse_name', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormInput
                        label="Father's/Spouse Name"
                        value={formData.father_spouse_name}
                        onChange={(e) => handleInputChange('father_spouse_name', e.target.value)}
                        disabled={!selectedFields.has('father_spouse_name')}
                        placeholder="Enter father's or spouse name"
                      />
                    </div>
                  </div>

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
                          label="Date of Birth"
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                          disabled={!selectedFields.has('date_of_birth')}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        label="Gender"
                        value={formData.gender}
                        onValueChange={(value) => handleInputChange('gender', value)}
                        options={GENDERS.map(g => ({ value: g, label: g }))}
                        disabled={!selectedFields.has('gender')}
                        placeholder="Select gender"
                      />
                    </div>
                  </div>

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
                        label="Phone Number"
                        value={formData.phone_number}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        error={errors.phone_number}
                        disabled={!selectedFields.has('phone_number')}
                        placeholder="+91XXXXXXXXXX"
                      />
                    </div>
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
                      label="Blood Group"
                      value={formData.blood_group}
                      onValueChange={(value) => handleInputChange('blood_group', value)}
                      options={BLOOD_GROUPS.map(bg => ({ value: bg, label: bg }))}
                      disabled={!selectedFields.has('blood_group')}
                      placeholder="Select blood group"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Employment Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-employee-id"
                      checked={selectedFields.has('employee_id')}
                      onCheckedChange={(checked) => toggleField('employee_id', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormInput
                        label="Employee ID"
                        value={formData.employee_id}
                        onChange={(e) => handleInputChange('employee_id', e.target.value)}
                        disabled={!selectedFields.has('employee_id')}
                        placeholder="Enter employee ID"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-staff-type"
                      checked={selectedFields.has('staff_type')}
                      onCheckedChange={(checked) => toggleField('staff_type', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormSelect
                        label="Staff Type"
                        value={formData.staff_type}
                        onValueChange={(value) => handleInputChange('staff_type', value as any)}
                        options={STAFF_TYPES.map(t => ({ value: t, label: t }))}
                        error={errors.staff_type}
                        disabled={!selectedFields.has('staff_type')}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-designation"
                      checked={selectedFields.has('designation')}
                      onCheckedChange={(checked) => toggleField('designation', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormInput
                        label="Designation"
                        value={formData.designation}
                        onChange={(e) => handleInputChange('designation', e.target.value)}
                        error={errors.designation}
                        disabled={!selectedFields.has('designation')}
                        placeholder="e.g., Mathematics Teacher"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-department"
                      checked={selectedFields.has('department')}
                      onCheckedChange={(checked) => toggleField('department', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormInput
                        label="Department/Subject"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        disabled={!selectedFields.has('department')}
                        placeholder="e.g., Mathematics"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-date-joining"
                      checked={selectedFields.has('date_of_joining')}
                      onCheckedChange={(checked) => toggleField('date_of_joining', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      {!selectedFields.has('date_of_joining') && formData.date_of_joining ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date of Joining
                          </label>
                          <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                            {new Date(formData.date_of_joining).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      ) : (
                        <FormInput
                          label="Date of Joining"
                          type="date"
                          value={formData.date_of_joining}
                          onChange={(e) => handleInputChange('date_of_joining', e.target.value)}
                          disabled={!selectedFields.has('date_of_joining')}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-qualification"
                      checked={selectedFields.has('qualification')}
                      onCheckedChange={(checked) => toggleField('qualification', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormInput
                        label="Qualification"
                        value={formData.qualification}
                        onChange={(e) => handleInputChange('qualification', e.target.value)}
                        disabled={!selectedFields.has('qualification')}
                        placeholder="e.g., B.Ed, M.Sc"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Address Information</h3>
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
                      label="Address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!selectedFields.has('address')}
                      placeholder="Enter full address"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-state"
                      checked={selectedFields.has('state')}
                      onCheckedChange={(checked) => toggleField('state', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormSelect
                        label="State"
                        value={formData.state}
                        onValueChange={handleStateChange}
                        options={states.map(s => ({ value: s, label: s }))}
                        error={errors.state}
                        disabled={!selectedFields.has('state')}
                        placeholder="Select state"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-district"
                      checked={selectedFields.has('district')}
                      onCheckedChange={(checked) => toggleField('district', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormSelect
                        label="District"
                        value={formData.district}
                        onValueChange={(value) => handleInputChange('district', value)}
                        options={districts.map(d => ({ value: d, label: d }))}
                        error={errors.district}
                        disabled={!selectedFields.has('district') || !formData.state || loadingDistricts}
                        placeholder="Select district"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-city"
                      checked={selectedFields.has('city')}
                      onCheckedChange={(checked) => toggleField('city', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormInput
                        label="City"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        error={errors.city}
                        disabled={!selectedFields.has('city')}
                        placeholder="Enter city"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-pincode"
                      checked={selectedFields.has('pincode')}
                      onCheckedChange={(checked) => toggleField('pincode', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormInput
                        label="Pincode"
                        value={formData.pincode}
                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                        error={errors.pincode}
                        disabled={!selectedFields.has('pincode')}
                        placeholder="Enter 6-digit pincode"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-emergency-name"
                      checked={selectedFields.has('emergency_contact_name')}
                      onCheckedChange={(checked) => toggleField('emergency_contact_name', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormInput
                        label="Contact Name"
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                        disabled={!selectedFields.has('emergency_contact_name')}
                        placeholder="Enter contact name"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="edit-emergency-number"
                      checked={selectedFields.has('emergency_contact_number')}
                      onCheckedChange={(checked) => toggleField('emergency_contact_number', checked as boolean)}
                      className="mt-8"
                      title="Check to edit this field"
                    />
                    <div className="flex-1">
                      <FormInput
                        label="Contact Number"
                        value={formData.emergency_contact_number}
                        onChange={(e) => handleInputChange('emergency_contact_number', e.target.value)}
                        disabled={!selectedFields.has('emergency_contact_number')}
                        placeholder="+91XXXXXXXXXX"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="edit-emergency-relationship"
                    checked={selectedFields.has('emergency_contact_relationship')}
                    onCheckedChange={(checked) => toggleField('emergency_contact_relationship', checked as boolean)}
                    className="mt-8"
                    title="Check to edit this field"
                  />
                  <div className="flex-1">
                    <FormInput
                      label="Relationship"
                      value={formData.emergency_contact_relationship}
                      onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                      disabled={!selectedFields.has('emergency_contact_relationship')}
                      placeholder="e.g., Spouse, Parent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/staff')}
                disabled={saving}
                className="flex-1 min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 min-h-[44px]"
              >
                Preview Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Changes</DialogTitle>
            <DialogDescription>
              Review the changes before saving. Click "Confirm & Save" to apply the changes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedFields.size > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Fields to Update:</h4>
                <div className="space-y-2">
                  {Array.from(selectedFields).map(field => {
                    const value = formData[field as keyof StaffInput];
                    const fieldLabels: Record<string, string> = {
                      name: 'Full Name',
                      father_spouse_name: "Father's/Spouse Name",
                      date_of_birth: 'Date of Birth',
                      gender: 'Gender',
                      phone_number: 'Phone Number',
                      blood_group: 'Blood Group',
                      employee_id: 'Employee ID',
                      staff_type: 'Staff Type',
                      designation: 'Designation',
                      department: 'Department/Subject',
                      date_of_joining: 'Date of Joining',
                      qualification: 'Qualification',
                      address: 'Address',
                      state: 'State',
                      district: 'District',
                      city: 'City',
                      pincode: 'Pincode',
                      emergency_contact_name: 'Emergency Contact Name',
                      emergency_contact_number: 'Emergency Contact Number',
                      emergency_contact_relationship: 'Emergency Contact Relationship',
                    };
                    
                    return (
                      <div key={field} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{fieldLabels[field] || field}:</span>
                        <span className="text-gray-700">
                          {field.includes('date') && value
                            ? new Date(value as string).toLocaleDateString()
                            : value || 'N/A'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {photoBlob && (
              <div>
                <h4 className="font-semibold mb-2">Photo Update:</h4>
                <p className="text-sm text-gray-600">A new photo will be uploaded</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Saving...
                </>
              ) : (
                'Confirm & Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Editor Dialog */}
      {showPhotoEditor && (
        <PhotoEditor
          onSave={handlePhotoSaved}
          onClose={() => setShowPhotoEditor(false)}
          initialImage={photoPreview || currentPhotoUrl}
        />
      )}
    </div>
  );
}
