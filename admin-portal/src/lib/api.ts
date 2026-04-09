const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('admin_token');
};

// Helper function to make authenticated requests
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Login failed');
    }

    return response.json();
  },

  async verifyToken(token: string) {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    return response.json();
  },

  async getDashboardStats() {
    return fetchWithAuth<any>('/api/admin/dashboard');
  },

  async getSchools(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return fetchWithAuth<any>(`/api/admin/schools${query ? `?${query}` : ''}`);
  },

  async getSchoolDetails(schoolId: string) {
    return fetchWithAuth<any>(`/api/admin/schools/${schoolId}`);
  },

  async getSchoolStaff(schoolId: string, params?: { page?: number; limit?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return fetchWithAuth<any>(`/api/admin/schools/${schoolId}/staff${query ? `?${query}` : ''}`);
  },

  async getBatches(params?: { page?: number; limit?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return fetchWithAuth<any>(`/api/admin/batches${query ? `?${query}` : ''}`);
  },

  async getBatchDetails(batchId: string) {
    return fetchWithAuth<any>(`/api/admin/batches/${batchId}`);
  },

  async updateBatchStatus(batchId: string, status: string, notes?: string) {
    return fetchWithAuth<any>(`/api/admin/batches/${batchId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  },

  async getStaffAnalytics() {
    return fetchWithAuth<any>('/api/admin/analytics/staff');
  },

  async exportBatchCSV(batchId: string) {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/admin/batches/${batchId}/csv`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }

    return response.blob();
  },

  async exportBatchExcel(batchId: string) {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/admin/batches/${batchId}/excel`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export Excel');
    }

    return response.blob();
  },

  async exportBatchPhotos(batchId: string) {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/admin/batches/${batchId}/photos`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export photos');
    }

    return response.blob();
  },
};
