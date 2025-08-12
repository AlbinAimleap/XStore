const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('xstore_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('xstore_token', token);
    } else {
      localStorage.removeItem('xstore_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth methods
  async register(email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async verifyToken(token: string) {
    return this.request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Folder methods
  async getFolders() {
    return this.request('/folders');
  }

  async createFolder(name: string, parentId?: number) {
    return this.request('/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    });
  }

  async updateFolder(id: number, name: string, parentId?: number) {
    return this.request(`/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, parentId }),
    });
  }

  async deleteFolder(id: number) {
    return this.request(`/folders/${id}`, {
      method: 'DELETE',
    });
  }

  // Item methods
  async getItems(params: Record<string, any> = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.set(key, value.toString());
        }
      }
    });
    
    const queryString = searchParams.toString();
    return this.request(`/items${queryString ? `?${queryString}` : ''}`);
  }

  async getFrequentItems() {
    return this.request('/items/frequent');
  }

  async getItem(id: number) {
    return this.request(`/items/${id}`);
  }

  async createItem(data: any) {
    return this.request('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateItem(id: number, data: any) {
    return this.request(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteItem(id: number) {
    return this.request(`/items/${id}`, {
      method: 'DELETE',
    });
  }

  async togglePin(id: number) {
    return this.request(`/items/${id}/pin`, {
      method: 'PUT',
    });
  }

  async getItemVersions(id: number) {
    return this.request(`/items/${id}/versions`);
  }

  // File methods
  async uploadFile(file: File, folderId: number, encrypt: boolean = true) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', folderId.toString());
    formData.append('encrypt', encrypt.toString());

    const url = `${this.baseURL}/files/upload`;
    
    const config: RequestInit = {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error);
    }

    return await response.json();
  }

  async downloadFile(id: number): Promise<Blob> {
    const url = `${this.baseURL}/files/download/${id}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return await response.blob();
  }

  // Backup methods
  async exportData() {
    return this.request('/backup/export');
  }

  async importData(backupData: any, clearExisting: boolean = false) {
    return this.request('/backup/import', {
      method: 'POST',
      body: JSON.stringify({ backupData, clearExisting }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);