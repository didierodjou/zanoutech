'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SchoolSettings {
  schoolName: string;
  principalName: string | null;
  logo: string | null;
}

interface AppContextType {
  settings: SchoolSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/admin/settings`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erreur chargement paramètres');
      const data = await res.json();
      setSettings({
        schoolName: data.schoolName || 'Mon École',
        principalName: data.principalName || 'Administrateur',
        logo: data.logo || null,
      });
    } catch (err) {
      console.error('Erreur chargement settings', err);
      // Valeurs par défaut
      setSettings({
        schoolName: 'Mon École',
        principalName: 'Administrateur',
        logo: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = async () => {
    setLoading(true);
    await fetchSettings();
  };

  return (
    <AppContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}