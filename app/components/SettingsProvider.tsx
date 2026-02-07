"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface Settings {
  defaultWorkspace: string;
  openLastWorkspace: boolean;
  confirmCloseTab: boolean;
  confirmDelete: boolean;
  defaultMethod: "GET" | "POST";
  lastWorkspaceId?: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

const DEFAULT_SETTINGS: Settings = {
  defaultWorkspace: "My Workspace",
  openLastWorkspace: true,
  confirmCloseTab: true,
  confirmDelete: true,
  defaultMethod: "GET",
};

const STORAGE_KEY = "cosmonaut_settings_v1";

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings, isInitialized]);

  const updateSettings = React.useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => {
      const hasChanged = Object.entries(updates).some(([key, value]) => prev[key as keyof Settings] !== value);
      if (!hasChanged) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        isSettingsOpen,
        setSettingsOpen,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
