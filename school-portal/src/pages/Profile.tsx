import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { FormInput } from '../components/ui/form-input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { useAuth } from '../hooks/useAuth';
import { schoolApi } from '../lib/api';
import { toast } from 'sonner';
import { Upload, CheckCircle2, Edit2, Save, X, Lock } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { school, logout, refreshSchool } = useAuth();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: school?.name || '',
    phone: school?.phone || '',
    address: school?.address || '',
    city: school?.city || '',
    state: school?.state || '',
    pincode: school?.pincode || '',
    principal_name: school?.principal_name || '',
  });

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditClick = () => {
    setEditData({
      name: school?.name || '',
      phone: school?.phone || '',
      address: school?.address || '',
      city: school?.city || '',
      state: school?.state || '',
      pincode: school?.pincode || '',
      principal_name: school?.principal_name || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      name: school?.name || '',
      phone: school?.phone || '',
      address: school?.address || '',
      city: school?.city || '',
      state: school?.state || '',
      pincode: school?.pincode || '',
      principal_name: school?.principal_name || '',
    });
  };

  const handleSaveProfile = async () => {
    // Validation
    if (!editData.name || !editData.phone || !editData.address || !editData.city || !editData.state || !editData.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await schoolApi.updateProfile(editData);
      if (response.success) {
        toast.success('Profile updated successfully!');
        await refreshSchool();
        setIsEditing(false);
      } else {
        toast.error(response.error?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('An error occurred while updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await schoolApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      if (response.success) {
        toast.success('Password changed successfully!');
        setShowChangePassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(response.error?.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error('An error occurred while changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const response = await schoolApi.uploadLogo(file);
      if (response.success) {
        toast.success('Logo uploaded successfully!');
        await refreshSchool(); // Refresh school data
      } else {
        toast.error(response.error?.message || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('An error occurred while uploading logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingSignature(true);
    try {
      const response = await schoolApi.uploadSignature(file);
      if (response.success) {
        toast.success('Signature uploaded successfully!');
        await refreshSchool(); // Refresh school data
      } else {
        toast.error(response.error?.message || 'Failed to upload signature');
      }
    } catch (error) {
      console.error('Signature upload error:', error);
      toast.error('An error occurred while uploading signature');
    } finally {
      setUploadingSignature(false);
      if (signatureInputRef.current) {
        signatureInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold">Profile</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="p-6">
          {/* School Info Header */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b">
            <div className="flex items-center gap-4">
              {school?.logo_url ? (
                <img
                  src={school.logo_url}
                  alt={school.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-3xl font-bold text-blue-600">
                    {school?.name?.charAt(0) || 'S'}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">{school?.name || 'School Name'}</h2>
                <p className="text-sm text-gray-600">{school?.email}</p>
                <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                  Active Account
                </span>
              </div>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditClick}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          {/* School Details Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">School Information</h3>
              {isEditing && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                <FormInput
                  label="School Name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  required
                />
                <FormInput
                  label="Phone Number"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  required
                />
                <FormInput
                  label="Address"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="City"
                    value={editData.city}
                    onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                    required
                  />
                  <FormInput
                    label="State"
                    value={editData.state}
                    onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                    required
                  />
                </div>
                <FormInput
                  label="Pincode"
                  value={editData.pincode}
                  onChange={(e) => setEditData({ ...editData, pincode: e.target.value })}
                  required
                />
                <FormInput
                  label="Principal Name"
                  value={editData.principal_name}
                  onChange={(e) => setEditData({ ...editData, principal_name: e.target.value })}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4">
                <div>
                  <p className="text-sm text-gray-500">School Name</p>
                  <p className="font-medium">{school?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{school?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{school?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Principal Name</p>
                  <p className="font-medium">{school?.principal_name || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{school?.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">City</p>
                  <p className="font-medium">{school?.city || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">State</p>
                  <p className="font-medium">{school?.state || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pincode</p>
                  <p className="font-medium">{school?.pincode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registered On</p>
                  <p className="font-medium">
                    {school?.created_at ? new Date(school.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Missing Assets Warning */}
          {school?.status === 'approved' && (!school?.logo_url || !school?.signature_url) && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Upload Required Assets</h3>
                  <p className="text-sm text-blue-800">
                    Please upload your school logo and principal signature to submit batches for printing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Logo and Signature Upload Section - Only show if assets are missing */}
          {(!school?.logo_url || !school?.signature_url) && (
          <div className="mb-6 space-y-4">
            <h3 className="font-semibold text-lg">School Assets</h3>
            
            {/* Logo Upload */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">School Logo</h4>
                  {school?.logo_url && (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {school?.logo_url ? 'Change Logo' : 'Upload Logo'}
                    </>
                  )}
                </Button>
              </div>
              {school?.logo_url && (
                <div className="mt-3">
                  <img
                    src={school.logo_url}
                    alt="School Logo"
                    className="w-32 h-32 object-contain border rounded-lg"
                  />
                </div>
              )}
              {!school?.logo_url && (
                <p className="text-sm text-gray-500 mt-2">
                  No logo uploaded yet. Required for batch submission.
                </p>
              )}
            </div>

            {/* Signature Upload */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Principal Signature</h4>
                  {school?.signature_url && (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  className="hidden"
                  disabled={uploadingSignature}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signatureInputRef.current?.click()}
                  disabled={uploadingSignature}
                >
                  {uploadingSignature ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {school?.signature_url ? 'Change Signature' : 'Upload Signature'}
                    </>
                  )}
                </Button>
              </div>
              {school?.signature_url && (
                <div className="mt-3">
                  <img
                    src={school.signature_url}
                    alt="Principal Signature"
                    className="w-48 h-24 object-contain border rounded-lg bg-white"
                  />
                </div>
              )}
              {!school?.signature_url && (
                <p className="text-sm text-gray-500 mt-2">
                  No signature uploaded yet. Required for batch submission.
                </p>
              )}
            </div>
          </div>
          )}

          {/* Security Section */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-4">Security</h3>
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => setShowChangePassword(true)}
            >
              <Lock className="w-5 h-5 mr-3" />
              Change Password
            </Button>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-6 border-t">
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => navigate('/dashboard')}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => navigate('/students')}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Manage Students
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => navigate('/submissions')}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View Submissions
            </Button>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Change Password Modal */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new password.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormInput
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="Enter current password"
            />
            <FormInput
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="Enter new password (min 8 characters)"
            />
            <FormInput
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowChangePassword(false);
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                });
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="flex-1"
            >
              {changingPassword ? <LoadingSpinner className="mr-2" /> : null}
              Change Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
