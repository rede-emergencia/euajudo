/**
 * Dashboard API Client
 * Handles communication with the generic dashboard backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

export const dashboardApi = {
  /**
   * Get dashboard configuration for current user
   */
  async getConfig() {
    const response = await fetch(`${API_URL}/api/dashboard/config`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard config');
    }
    
    return response.json();
  },

  /**
   * Get data for a specific widget
   */
  async getWidgetData(widgetId, { limit = 10, offset = 0 } = {}) {
    const params = new URLSearchParams({ limit, offset });
    const response = await fetch(
      `${API_URL}/api/dashboard/widgets/${widgetId}/data?${params}`,
      {
        headers: getAuthHeaders(),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch widget data: ${widgetId}`);
    }
    
    return response.json();
  },

  /**
   * Execute a widget action
   */
  async executeAction(endpoint, method = 'POST', data = null) {
    const options = {
      method,
      headers: getAuthHeaders(),
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || 'Action failed');
    }
    
    return response.json();
  },
};
