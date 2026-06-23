import React, { createContext, useContext, useState, useEffect } from 'react';

interface UISettings {
  globalDensity: number;      // 0.8 to 1.2
  sidebarScale: number;      // 0.8 to 1.2
  dashboardCardScale: number; // 0.8 to 1.2
  textScale: number;          // 0.8 to 1.2
}

interface UIContextType {
  settings: UISettings;
  updateSetting: (key: keyof UISettings, value: number) => void;
  resetSettings: () => void;
}

const defaultSettings: UISettings = {
  globalDensity: 1.0,
  sidebarScale: 1.0,
  dashboardCardScale: 1.0,
  textScale: 1.0,
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UISettings>(() => {
    const saved = localStorage.getItem('ui_settings_v2');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('ui_settings_v2', JSON.stringify(settings));

    // Inject CSS variables for dynamic scaling
    const root = document.documentElement;
    root.style.setProperty('--global-scale', settings.globalDensity.toString());
    root.style.setProperty('--sidebar-scale', settings.sidebarScale.toString());
    root.style.setProperty('--card-scale', settings.dashboardCardScale.toString());
    root.style.setProperty('--text-scale', settings.textScale.toString());

    if (settings.globalDensity < 1.0) {
        root.classList.add('is-compact-mode');
    } else {
        root.classList.remove('is-compact-mode');
    }
  }, [settings]);

  const updateSetting = (key: keyof UISettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <UIContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
