import { projectId, publicAnonKey } from './supabase/info';
import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9e61c00c`;

// Initialize Supabase client for auth
const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Get auth token
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Generic API call function
async function apiCall(endpoint: string, options: RequestInit = {}, allowUnauthenticated = false): Promise<any> {
  const token = await getAuthToken();
  
  // If no token and authentication is required, throw specific error
  if (!token && !allowUnauthenticated) {
    throw new Error('Authentication required - please sign in');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authAPI = {
  signUp: async (email: string, password: string, name: string) => {
    return apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  },

  signInWithOAuth: async (provider: 'google' | 'github' | 'facebook') => {
    return supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    });
  },

  signOut: async () => {
    return supabase.auth.signOut();
  },

  getSession: async () => {
    return supabase.auth.getSession();
  }
};

// Capture API
export const captureAPI = {
  processCapture: async (captureData: any) => {
    try {
      return await apiCall('/capture', {
        method: 'POST',
        body: JSON.stringify(captureData),
      });
    } catch (error) {
      // Return success for demo purposes
      return { success: true, message: 'Capture processed (demo mode)' };
    }
  },

  getCaptures: async () => {
    try {
      return await apiCall('/captures');
    } catch (error) {
      // Fall back to demo data
      return await apiCall('/demo/captures', {}, true);
    }
  },
};

// AI Assistant API
export const aiAPI = {
  sendMessage: async (message: string, context?: any) => {
    try {
      return await apiCall('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, context }),
      });
    } catch (error) {
      // Return demo response
      return {
        response: "I'm currently in demo mode. In the full version, I would provide personalized insights based on your data and help you optimize your productivity workflow.",
        suggestions: ["Sign in to access full AI capabilities", "Try the capture feature", "Explore the analytics dashboard"]
      };
    }
  },

  getInsights: async () => {
    try {
      return await apiCall('/ai/insights', {
        method: 'POST',
      });
    } catch (error) {
      // Fall back to demo data
      return await apiCall('/demo/insights', { method: 'POST' }, true);
    }
  },

  search: async (query: string, filters?: any) => {
    try {
      return await apiCall('/search', {
        method: 'POST',
        body: JSON.stringify({ query, filters }),
      });
    } catch (error) {
      // Return demo search results
      return {
        results: [
          { type: 'capture', title: `Demo result for "${query}"`, content: 'This is a demo search result. Sign in to search your actual data.' },
          { type: 'project', title: `Related project for "${query}"`, content: 'Demo project content related to your search.' }
        ]
      };
    }
  },
};

// Analytics API
export const analyticsAPI = {
  getDashboard: async () => {
    try {
      return await apiCall('/analytics/dashboard');
    } catch (error) {
      // Fall back to demo data
      return await apiCall('/demo/dashboard', {}, true);
    }
  },

  getProductivity: async () => {
    try {
      return await apiCall('/analytics/productivity');
    } catch (error) {
      // Return demo productivity data
      return {
        weeklyProductivity: Math.floor(Math.random() * 20) + 80,
        dailyTrends: Array.from({ length: 7 }, (_, i) => ({
          day: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
          score: Math.floor(Math.random() * 30) + 70
        })),
        topTasks: ['UI Development', 'Code Review', 'Planning', 'Documentation']
      };
    }
  },
};

// Projects API
export const projectsAPI = {
  getProjects: async () => {
    try {
      return await apiCall('/projects');
    } catch (error) {
      // Fall back to demo data
      return await apiCall('/demo/projects', {}, true);
    }
  },

  createProject: async (projectData: any) => {
    try {
      return await apiCall('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      });
    } catch (error) {
      // Return demo success
      return { 
        project: { 
          id: Date.now().toString(), 
          ...projectData, 
          progress: 0,
          status: 'active',
          created_at: new Date().toISOString()
        },
        message: 'Project created (demo mode)'
      };
    }
  },

  updateProject: async (projectId: string, updateData: any) => {
    try {
      return await apiCall(`/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    } catch (error) {
      // Return demo success
      return { 
        project: { id: projectId, ...updateData },
        message: 'Project updated (demo mode)'
      };
    }
  },
};

// Integrations API
export const integrationsAPI = {
  getIntegrations: async () => {
    try {
      return await apiCall('/integrations');
    } catch (error) {
      // Return demo integrations
      return {
        integrations: [
          { id: '1', service: 'Google Calendar', status: 'connected', lastSync: new Date().toISOString() },
          { id: '2', service: 'Notion', status: 'connected', lastSync: new Date().toISOString() },
          { id: '3', service: 'Slack', status: 'disconnected', lastSync: null },
          { id: '4', service: 'Trello', status: 'connected', lastSync: new Date().toISOString() }
        ]
      };
    }
  },

  connectService: async (service: string, credentials: any) => {
    try {
      return await apiCall('/integrations/connect', {
        method: 'POST',
        body: JSON.stringify({ service, credentials }),
      });
    } catch (error) {
      // Return demo success
      return { 
        integration: { service, status: 'connected', id: Date.now().toString() },
        message: `${service} connected (demo mode)`
      };
    }
  },

  syncService: async (service: string) => {
    try {
      return await apiCall('/integrations/sync', {
        method: 'POST',
        body: JSON.stringify({ service }),
      });
    } catch (error) {
      // Return demo sync result
      return { 
        success: true, 
        message: `${service} synced (demo mode)`,
        itemsSynced: Math.floor(Math.random() * 50) + 10
      };
    }
  },
};

// Settings API
export const settingsAPI = {
  getSettings: async () => {
    try {
      return await apiCall('/settings');
    } catch (error) {
      // Return demo settings
      return {
        settings: {
          ai_learning: true,
          notifications: true,
          theme: 'light',
          autoCapture: false,
          smartSuggestions: true,
          focusMode: false
        }
      };
    }
  },

  updateSettings: async (settings: any) => {
    try {
      return await apiCall('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch (error) {
      // Return demo success
      return { 
        settings,
        message: 'Settings updated (demo mode)'
      };
    }
  },
};

// Real-time API
export const realtimeAPI = {
  getStatus: async () => {
    try {
      return await apiCall('/realtime/status');
    } catch (error) {
      // Fall back to demo status
      return await apiCall('/demo/status', {}, true);
    }
  },
};

// Batch operations API
export const batchAPI = {
  process: async (operations: any[]) => {
    return apiCall('/batch/process', {
      method: 'POST',
      body: JSON.stringify({ operations }),
    });
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    return apiCall('/health', {}, true); // Allow unauthenticated access
  },
};

// Error handling utility
export function handleAPIError(error: any): string {
  console.error('API Error:', error);
  
  if (error.message) {
    // Check for specific authentication errors
    if (error.message.includes('Authentication required')) {
      return 'Please sign in to access your data';
    }
    if (error.message.includes('Invalid or expired token')) {
      return 'Session expired - please sign in again';
    }
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

// Real-time updates utility
export class RealtimeUpdates {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  subscribe(key: string, callback: () => void, intervalMs: number = 30000) {
    // Clear existing interval
    this.unsubscribe(key);
    
    // Set new interval
    const interval = setInterval(callback, intervalMs);
    this.intervals.set(key, interval);
    
    // Call immediately
    callback();
  }

  unsubscribe(key: string) {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
  }

  unsubscribeAll() {
    for (const [key] of this.intervals) {
      this.unsubscribe(key);
    }
  }
}

export const realtimeUpdates = new RealtimeUpdates();