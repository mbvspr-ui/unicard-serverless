import { Student, StudentInput } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
};

// Batch APIs
export const batchApi = {
  create: async (studentIds: string[]): Promise<ApiResponse<{
    id: string;
    submittedAt: string;
    status: string;
    studentCount: number;
  }>> => {
    return fetchWithAuth('/api/batches', {
      method: 'POST',
      body: JSON.stringify({ studentIds }),
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
    studentCount: number;
  }>> => {
    return fetchWithAuth(`/api/batches/${batchId}`);
  },
};
