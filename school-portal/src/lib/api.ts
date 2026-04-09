import { Student, StudentInput, Staff, StaffInput } from '../types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  pagination?: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to make authenticated requests
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  return data;
}

// Location APIs
export const locationApi = {
  getStates: async (): Promise<string[]> => {
    const response = await fetch(`${API_URL}/api/locations/states`);
    const data = await response.json();
    return data.success ? data.data : [];
  },

  getDistricts: async (state: string): Promise<string[]> => {
    const response = await fetch(`${API_URL}/api/locations/districts/${encodeURIComponent(state)}`);
    const data = await response.json();
    return data.success ? data.data : [];
  },
};

// Student APIs
export const studentApi = {
  create: async (studentData: StudentInput): Promise<ApiResponse<Student>> => {
    return fetchWithAuth<Student>('/api/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    class?: string;
    section?: string;
    refresh?: boolean;
  }): Promise<ApiResponse<{ data: Student[]; pagination: any }>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.class) queryParams.append('class', params.class);
    if (params?.section) queryParams.append('section', params.section);
    if (params?.refresh) queryParams.append('refresh', 'true');

    const query = queryParams.toString();
    return fetchWithAuth<{ data: Student[]; pagination: any }>(
      `/api/students${query ? `?${query}` : ''}`
    );
  },

  getById: async (studentId: string): Promise<ApiResponse<Student>> => {
    return fetchWithAuth<Student>(`/api/students/${studentId}`);
  },

  update: async (
    studentId: string,
    studentData: Partial<StudentInput>
  ): Promise<ApiResponse<Student>> => {
    return fetchWithAuth<Student>(`/api/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  },

  delete: async (studentId: string): Promise<ApiResponse<void>> => {
    return fetchWithAuth<void>(`/api/students/${studentId}`, {
      method: 'DELETE',
    });
  },

  uploadPhoto: async (studentId: string, photoFile: File): Promise<ApiResponse<{ photoUrl: string }>> => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('photo', photoFile);

    const response = await fetch(`${API_URL}/api/students/${studentId}/photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return response.json();
  },
};

// Staff APIs
export const staffApi = {
  create: async (staffData: StaffInput): Promise<ApiResponse<Staff>> => {
    return fetchWithAuth<Staff>('/api/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    staff_type?: string;
    department?: string;
    refresh?: boolean;
  }): Promise<ApiResponse<{ data: Staff[]; pagination: any }>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.staff_type) queryParams.append('staff_type', params.staff_type);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.refresh) queryParams.append('refresh', 'true');

    const query = queryParams.toString();
    return fetchWithAuth<{ data: Staff[]; pagination: any }>(
      `/api/staff${query ? `?${query}` : ''}`
    );
  },

  getById: async (staffId: string): Promise<ApiResponse<Staff>> => {
    return fetchWithAuth<Staff>(`/api/staff/${staffId}`);
  },

  update: async (
    staffId: string,
    staffData: Partial<StaffInput>
  ): Promise<ApiResponse<Staff>> => {
    return fetchWithAuth<Staff>(`/api/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    });
  },

  delete: async (staffId: string): Promise<ApiResponse<void>> => {
    return fetchWithAuth<void>(`/api/staff/${staffId}`, {
      method: 'DELETE',
    });
  },

  uploadPhoto: async (staffId: string, photoFile: File): Promise<ApiResponse<{ photoUrl: string }>> => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('photo', photoFile);

    const response = await fetch(`${API_URL}/api/staff/${staffId}/photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return response.json();
  },
};

// School APIs
export const schoolApi = {
  uploadLogo: async (logoFile: File): Promise<ApiResponse<{ logo_url: string }>> => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('logo', logoFile);

    const response = await fetch(`${API_URL}/api/upload/logo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return response.json();
  },

  uploadSignature: async (signatureFile: File): Promise<ApiResponse<{ signature_url: string }>> => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('signature', signatureFile);

    const response = await fetch(`${API_URL}/api/upload/signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return response.json();
  },

  getProfile: async (): Promise<ApiResponse<any>> => {
    return fetchWithAuth('/api/schools/profile');
  },

  updateProfile: async (profileData: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    principal_name?: string;
  }): Promise<ApiResponse<any>> => {
    return fetchWithAuth('/api/schools/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<any>> => {
    return fetchWithAuth('/api/schools/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  },

  forgotPassword: async (email: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_URL}/api/schools/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },
};

// Batch APIs
export const batchApi = {
  create: async (params: {
    studentIds?: string[];
    staffIds?: string[];
  }): Promise<ApiResponse<{
    id: string;
    submittedAt: string;
    status: string;
    studentCount: number;
    staffCount: number;
    totalCount: number;
  }>> => {
    return fetchWithAuth('/api/batches', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<{ data: any[]; pagination: any }>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return fetchWithAuth(`/api/batches${query ? `?${query}` : ''}`);
  },

  getById: async (batchId: string): Promise<ApiResponse<{
    batch: any;
    students: any[];
    staff: any[];
    studentCount: number;
    staffCount: number;
  }>> => {
    return fetchWithAuth(`/api/batches/${batchId}`);
  },

  exportExcel: async (batchId: string): Promise<Blob> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/batches/${batchId}/excel`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export Excel');
    }

    return response.blob();
  },

  exportCSV: async (batchId: string): Promise<Blob> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/batches/${batchId}/csv`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }

    return response.blob();
  },

  exportPhotos: async (batchId: string): Promise<Blob> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/batches/${batchId}/photos`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export photos');
    }

    return response.blob();
  },

  exportStaffCSV: async (batchId: string): Promise<Blob> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/batches/${batchId}/staff-csv`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export staff CSV');
    }

    return response.blob();
  },
};
