// MySQL API Client - replaces Supabase client
const API_BASE_URL = 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Get token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Always get fresh token from localStorage
    const currentToken = localStorage.getItem('auth_token');
    if (currentToken) {
      this.token = currentToken;
      headers.Authorization = `Bearer ${currentToken}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'An error occurred' };
      }

      return { data };
    } catch (error) {
      console.error('API request error:', error);
      return { error: 'Network error occurred' };
    }
  }

  // Authentication methods
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('auth_token', this.token);
    }

    return response;
  }

  async register(email: string, password: string, firstName: string, lastName: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });

    if (response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('auth_token', this.token);
    }

    return response;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Profile methods
  async getProfile() {
    return this.request('/profile');
  }

  // Batches methods
  async getBatches() {
    return this.request('/batches');
  }

  async createBatch(name: string) {
    return this.request('/batches', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async updateBatch(id: string, name: string) {
    return this.request(`/batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  }

  async deleteBatch(id: string) {
    return this.request(`/batches/${id}`, {
      method: 'DELETE',
    });
  }

  // Subjects methods
  async getSubjects() {
    return this.request('/subjects');
  }

  async createSubject(data: any) {
    return this.request('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubject(id: string, data: any) {
    return this.request(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSubject(id: string) {
    return this.request(`/subjects/${id}`, {
      method: 'DELETE',
    });
  }

  // Timetable methods
  async getTimetables() {
    return this.request('/timetables');
  }

  async createTimetable(data: any) {
    return this.request('/timetables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTimetable(id: string, data: any) {
    return this.request(`/timetables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTimetable(id: string) {
    return this.request(`/timetables/${id}`, {
      method: 'DELETE',
    });
  }

  // Feedback methods
  async getFeedback() {
    return this.request('/feedback');
  }

  async createFeedback(data: any) {
    return this.request('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFeedback(id: string, data: any) {
    return this.request(`/feedback/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Dashboard stats
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Recent feedback
  async getRecentFeedback() {
    return this.request('/feedback/recent');
  }

  // Subject stats
  async getSubjectStats() {
    return this.request('/subjects/stats');
  }

  // Students methods
  async getStudents() {
    return this.request('/students');
  }

  async createStudent(data: any) {
    return this.request('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStudent(id: string, data: any) {
    return this.request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStudent(id: string) {
    return this.request(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // Feedback Analytics methods
  async getFeedbackTrends(timeframeDays: number = 30, batchId?: string, semesterNumber?: number) {
    const params = new URLSearchParams({ timeframe_days: timeframeDays.toString() });
    if (batchId) params.append('batch_id', batchId);
    if (semesterNumber) params.append('semester_number', semesterNumber.toString());
    
    return this.request(`/feedback/trends?${params.toString()}`);
  }

  async getFeedbackAnalytics(batchId?: string, semesterNumber?: number) {
    const params = new URLSearchParams();
    if (batchId) params.append('batch_id', batchId);
    if (semesterNumber) params.append('semester_number', semesterNumber.toString());
    
    return this.request(`/feedback/analytics?${params.toString()}`);
  }

  // Generic method for future endpoints
  async get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any) {
    return this.request<T>(endpoint, {
      method: 'PUT', 
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string) {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// For compatibility with existing code, create supabase-like interface
export const mysql = {
  auth: {
    signIn: (credentials: { email: string; password: string }) => 
      apiClient.login(credentials.email, credentials.password),
    
    signUp: (credentials: { email: string; password: string }) => 
      apiClient.register(credentials.email, credentials.password, '', ''),
    
    signOut: () => {
      apiClient.logout();
      return Promise.resolve({ error: null });
    },

    getSession: () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Mock session object
        return Promise.resolve({
          data: { 
            session: { 
              access_token: token,
              user: { id: 'user-id', email: 'user@example.com' }
            } 
          },
          error: null
        });
      }
      return Promise.resolve({ data: { session: null }, error: null });
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Simple implementation - in a real app you'd want more sophisticated state management
      const checkAuth = () => {
        const token = localStorage.getItem('auth_token');
        callback(token ? 'SIGNED_IN' : 'SIGNED_OUT', token ? { access_token: token } : null);
      };

      // Check immediately
      checkAuth();

      // Return unsubscribe function
      return {
        data: { subscription: { unsubscribe: () => {} } }
      };
    }
  },

  from: (table: string) => ({
    select: (columns = '*') => ({
      eq: (column: string, value: any) => ({
        single: () => {
          if (table === 'profiles') {
            return apiClient.getProfile();
          }
          return Promise.resolve({ data: null, error: 'Not implemented' });
        }
      }),
      order: (column: string, options?: any) => {
        if (table === 'batches') {
          return apiClient.getBatches().then(result => ({ 
            data: result.data, 
            error: result.error ? { message: result.error } : null 
          }));
        }
        return Promise.resolve({ data: [], error: null });
      }
    }),
    
    insert: (data: any) => ({
      select: () => ({
        single: async () => {
          if (table === 'batches') {
            try {
              const result = await apiClient.createBatch(data.name);
              if (result.error) {
                return {
                  data: null,
                  error: { message: result.error }
                };
              }
              return {
                data: result.data,
                error: null
              };
            } catch (error) {
              console.error('Error in mysql compatibility layer:', error);
              return {
                data: null,
                error: { message: 'Network error occurred' }
              };
            }
          }
          return Promise.resolve({ data: null, error: { message: 'Not implemented' } });
        }
      })
    }),

    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: () => {
            if (table === 'batches') {
              return apiClient.updateBatch(value, data.name).then(result => ({
                data: result.data,
                error: result.error ? { message: result.error } : null
              }));
            }
            return Promise.resolve({ data: null, error: { message: 'Not implemented' } });
          }
        })
      })
    }),

    delete: () => ({
      eq: (column: string, value: any) => {
        if (table === 'batches') {
          return apiClient.deleteBatch(value).then(result => ({
            error: result.error ? { message: result.error } : null
          }));
        }
        return Promise.resolve({ error: { message: 'Not implemented' } });
      }
    })
  })
};
