import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { assetUrl, request } from '../services/api';

const SettingsContext = createContext();

function normalizeImageUrl(url) {
  return assetUrl(url);
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request('/api/settings');
      setSettings({
        ...data,
        platformName: data.platformName || 'SAMPAY',
        logoImg: normalizeImageUrl(data.logoImg)
      });
      setError(null);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
