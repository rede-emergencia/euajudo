/**
 * Dashboard Hook
 * Custom hook for managing dashboard state and data
 */
import { useState, useEffect } from 'react';
import { dashboardApi } from '../lib/dashboardApi';

export function useDashboard() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getConfig();
      setConfig(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard config:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    config,
    loading,
    error,
    reload: loadConfig,
  };
}

export function useWidget(widgetId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const loadData = async (options = {}) => {
    if (!widgetId) return;
    
    try {
      setLoading(true);
      const result = await dashboardApi.getWidgetData(widgetId, options);
      setData(result.data);
      setHasMore(result.has_more);
      setError(null);
    } catch (err) {
      console.error(`Failed to load widget ${widgetId}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [widgetId]);

  return {
    data,
    loading,
    error,
    hasMore,
    reload: loadData,
  };
}
