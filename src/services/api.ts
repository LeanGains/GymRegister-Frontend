import axios from 'axios';
import { Asset, AnalysisResult } from '../store/assetStore';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8004',
  timeout: 30000, // 30 seconds for AI analysis
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed
api.interceptors.request.use(
  (config) => {
        // Add API key from environment variable
        const apiKey = process.env.REACT_APP_API_KEY;
        if (apiKey) {
            config.headers['X-API-KEY'] = apiKey;
        }

        // Add auth token if available (for user-specific operations)
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
        } else if (error.response?.status === 403) {
            // Handle forbidden (invalid API key)
            console.error('Invalid API key or insufficient permissions');
            // You might want to show a user-friendly error here
    }
    return Promise.reject(error);
  }
);

// Alternative: Function to set API key dynamically
export const setApiKey = (apiKey: string) => {
    // Store in memory for this session
    api.defaults.headers.common['X-API-KEY'] = apiKey;

    // Optionally store in localStorage (be careful with security)
    // localStorage.setItem('api_key', apiKey);
};

// Alternative: Function to get API key from different sources
const getApiKey = (): string | null => {
    // Priority order: environment variable, localStorage, sessionStorage
    return (
        process.env.REACT_APP_API_KEY ||
        localStorage.getItem('api_key') ||
        sessionStorage.getItem('api_key') ||
        null
    );
};

// Updated request interceptor with dynamic API key retrieval
api.interceptors.request.use(
    (config) => {
        // Get API key dynamically
        const apiKey = getApiKey();
        if (apiKey) {
            config.headers['X-API-KEY'] = apiKey;
        } else {
            console.warn('No API key found. Requests may fail.');
        }

        // Add auth token if available (for user-specific operations)
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export interface CreateAssetRequest {
  asset_tag: string;
  item_type: string;
  description: string;
  location: string;
  weight?: string;
  condition: string;
  notes?: string;
}

export interface UpdateAssetRequest {
  location?: string;
  status?: string;
  condition?: string;
  notes?: string;
}

export interface AnalyzeImageRequest {
  image: string; // base64 encoded image
}

// Asset API endpoints
export const assetApi = {
  // Get all assets
  getAssets: async (): Promise<Asset[]> => {
    const response = await api.get('/api/assets');
    return response.data;
  },

  // Get asset by tag
  getAssetByTag: async (tag: string): Promise<Asset | null> => {
    try {
      const response = await api.get(`/api/assets/${encodeURIComponent(tag)}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Create new asset
  createAsset: async (asset: CreateAssetRequest): Promise<Asset> => {
    const response = await api.post('/api/assets', asset);
    return response.data;
  },

  // Update asset
  updateAsset: async (tag: string, updates: UpdateAssetRequest): Promise<Asset> => {
    const response = await api.put(`/api/assets/${encodeURIComponent(tag)}`, updates);
    return response.data;
  },

  // Delete asset
  deleteAsset: async (tag: string): Promise<void> => {
    await api.delete(`/api/assets/${encodeURIComponent(tag)}`);
  },

  // Search assets
  searchAssets: async (query: string): Promise<Asset[]> => {
    const response = await api.get('/api/assets/search', {
      params: { q: query }
    });
    return response.data;
  },

  // Get assets by type
  getAssetsByType: async (type: string): Promise<Asset[]> => {
    const response = await api.get('/api/assets', {
      params: { type }
    });
    return response.data;
  },

  // Get assets by status
  getAssetsByStatus: async (status: string): Promise<Asset[]> => {
    const response = await api.get('/api/assets', {
      params: { status }
    });
    return response.data;
  },
};

// AI Analysis API endpoints
export const analysisApi = {
  // Analyze image for equipment detection
    analyzeImage: async (imageData: string, assetTag?: string): Promise<any> => {
        // Convert base64 to File object
        const byteCharacters = atob(imageData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new File([byteArray], 'captured-image.jpg', { type: 'image/jpeg' });

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        if (assetTag) {
            formData.append('asset_tag', assetTag);
        }

        const response = await api.post('/api/analyze', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
    });
    return response.data;
  },

  // Get analysis job status and results
  getAnalysisResult: async (jobId: string): Promise<any> => {
    const response = await api.get(`/api/analyze/${jobId}`);
    return response.data;
  },

  // Get analysis history
  getAnalysisHistory: async (): Promise<any[]> => {
    const response = await api.get('/api/analysis/history');
    return response.data;
  },
};

// Reports API endpoints
export const reportsApi = {
  // Get asset statistics
  getStatistics: async () => {
    const response = await api.get('/api/reports/statistics');
    return response.data;
  },

  // Get audit logs
  getAuditLogs: async (limit?: number) => {
    const response = await api.get('/api/reports/audit-logs', {
      params: { limit }
    });
    return response.data;
  },

  // Export assets to CSV
  exportAssets: async (): Promise<Blob> => {
    const response = await api.get('/api/reports/export', {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get missing assets report
  getMissingAssets: async () => {
    const response = await api.get('/api/reports/missing');
    return response.data;
  },

  // Get assets needing repair
  getAssetsNeedingRepair: async () => {
    const response = await api.get('/api/reports/repair-needed');
    return response.data;
  },
};

// Utility functions
export const imageUtils = {
  // Convert file to base64
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  },

  // Compress image before sending
  compressImage: (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  },
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    await api.get('/api/health');
    return true;
  } catch {
    return false;
  }
};

// API Key management utilities
export const apiKeyUtils = {
    // Set API key for the session
    setApiKey: (apiKey: string) => {
        api.defaults.headers.common['X-API-KEY'] = apiKey;
    },

    // Remove API key
    removeApiKey: () => {
        delete api.defaults.headers.common['X-API-KEY'];
    },

    // Check if API key is set
    hasApiKey: (): boolean => {
        return !!getApiKey();
    },

    // Store API key securely (use with caution)
    storeApiKey: (apiKey: string, persistent: boolean = false) => {
        if (persistent) {
            localStorage.setItem('api_key', apiKey);
        } else {
            sessionStorage.setItem('api_key', apiKey);
        }
        api.defaults.headers.common['X-API-KEY'] = apiKey;
    },

    // Clear stored API key
    clearStoredApiKey: () => {
        localStorage.removeItem('api_key');
        sessionStorage.removeItem('api_key');
        delete api.defaults.headers.common['X-API-KEY'];
    },
};

export default api;