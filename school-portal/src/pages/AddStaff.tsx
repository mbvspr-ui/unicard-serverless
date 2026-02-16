import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FormInput } from '../components/ui/form-input';
import { FormSelect } from '../components/ui/form-select';
import { FormTextarea } from '../components/ui/form-textarea';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { PhotoEditor } from '../components/PhotoEditor';
import { staffApi, locationApi } from '../lib/api';
import { StaffInput } from '../types';
import { Briefcase } from 'lucide-react';
import { Header } from '../components/Header';

const STAFF_TYPES = ['Teaching', 'Non-Teaching', 'Administrative', 'Support'];
const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function AddStaff() {
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

  const [formData, setFormData] = useState<StaffInput>({
    name: '',
    father_spouse_name: '',
    date_of_birth: '',
    gender: undefined,
    phone_number: '+91',
    blood_group: '',
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
    field: keyof StaffInput,
    value: string
  ) => {
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
    toast.success('Photo saved!');
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

    if (formData.phone_number && formData.phone_number !== '+91') {
      if (!/^\+91[6-9]\d{9}$/.test(formData.phone_number)) {
        newErrors.phone_number = 'Invalid phone number format';
      }
    }

    if (!photoBlob) {
      newErrors.photo = 'Photo is required';
      toast.error('Please add a photo');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // First, create the staff member without photo
      const staffData: StaffInput = {
        ...formData,
        phone_number: formData.phone_number === '+91' ? undefined : formData.phone_number,
        emergency_contact_number: formData.emergency_contact_number === '+91' ? undefined : formData.emergency_contact_number,
      };

      const response = await staffApi.create(staffData);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create staff member');
      }

      const staffId = response.data.id;

      // Upload photo
      if (photoBlob) {
        const photoFile = new File([photoBlob], 'photo.jpg', { type: 'image/jpeg' });
        const photoResponse = await staffApi.uploadPhoto(staffId, photoFile);

        if (!photoResponse.success) {
          console.error('Photo upload failed:', photoResponse.error);
          toast.warning('Staff member created but photo upload failed');
        }
      }

      toast.success('Staff member added successfully!');
      navigate('/staff');
    } catch (error: any) {
      console.error('Add staff error:', error);
      toast.error(error.message || 'Failed to add staff member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <Header title="Add Staff Member" showBack />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <Card className="p-6">
            {/* Photo Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Photo *</h3>
              <div className="flex flex-col items-center gap-4">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Staff photo"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                    <Briefcase className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <Button
                  type="button"
                  onClick={() => setShowPhotoEditor(true)}
                  variant="outline"
                >
                  {photoPreview ? 'Change Photo' : 'Add Photo'}
                </Button>
                {errors.photo && (
                  <p className="text-sm text-red-600">{errors.photo}</p>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Full Name *"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="Enter full name"
                />
                <FormInput
                  label="Father's/Spouse Name"
                  value={formData.father_spouse_name}
                  onChange={(e) => handleInputChange('father_spouse_name', e.target.value)}
                  placeholder="Enter father's or spouse name"
                />
                <FormInput
                  label="Date of Birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
                <FormSelect
                  label="Gender"
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                  options={GENDERS.map(g => ({ value: g, label: g }))}
                  placeholder="Select gender"
                />
                <FormInput
                  label="Phone Number"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  error={errors.phone_number}
                  placeholder="+919876543210"
                />
                <FormSelect
                  label="Blood Group"
                  value={formData.blood_group}
                  onValueChange={(value) => handleInputChange('blood_group', value)}
                  options={BLOOD_GROUPS.map(bg => ({ value: bg, label: bg }))}
                  placeholder="Select blood group"
                />
              </div>
            </div>

            {/* Employment Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Employment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Employee ID"
                  value={formData.employee_id}
                  onChange={(e) => handleInputChange('employee_id', e.target.value)}
                  placeholder="Enter employee ID"
                />
                <FormSelect
                  label="Staff Type *"
                  value={formData.staff_type}
                  onValueChange={(value) => handleInputChange('staff_type', value as any)}
                  options={STAFF_TYPES.map(t => ({ value: t, label: t }))}
                  error={errors.staff_type}
                />
                <FormInput
                  label="Designation *"
                  value={formData.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  error={errors.designation}
                  placeholder="e.g., Mathematics Teacher"
                />
                <FormInput
                  label="Department/Subject"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="e.g., Mathematics"
                />
                <FormInput
                  label="Date of Joining"
                  type="date"
                  value={formData.date_of_joining}
                  onChange={(e) => handleInputChange('date_of_joining', e.target.value)}
                />
                <FormInput
                  label="Qualification"
                  value={formData.qualification}
                  onChange={(e) => handleInputChange('qualification', e.target.value)}
                  placeholder="e.g., B.Ed, M.Sc"
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Address Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <FormTextarea
                  label="Address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter full address"
                  rows={2}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    label="State *"
                    value={formData.state}
                    onValueChange={handleStateChange}
                    options={states.map(s => ({ value: s, label: s }))}
                    error={errors.state}
                    placeholder="Select state"
                  />
                  <FormSelect
                    label="District *"
                    value={formData.district}
                    onValueChange={(value) => handleInputChange('district', value)}
                    options={districts.map(d => ({ value: d, label: d }))}
                    error={errors.district}
                    placeholder="Select district"
                    disabled={!formData.state || loadingDistricts}
                  />
                  <FormInput
                    label="City *"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    error={errors.city}
                    placeholder="Enter city"
                  />
                  <FormInput
                    label="Pincode *"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    error={errors.pincode}
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Contact Name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  placeholder="Enter contact name"
                />
                <FormInput
                  label="Contact Number"
                  value={formData.emergency_contact_number}
                  onChange={(e) => handleInputChange('emergency_contact_number', e.target.value)}
                  placeholder="+919876543210"
                />
                <FormInput
                  label="Relationship"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                  placeholder="e.g., Spouse, Parent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/staff')}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Staff Member'
                )}
              </Button>
            </div>
          </Card>
        </form>
      </div>

      {/* Photo Editor Dialog */}
      {showPhotoEditor && (
        <PhotoEditor
          onSave={handlePhotoSaved}
          onCancel={() => setShowPhotoEditor(false)}
        />
      )}
    </div>
  );
}
