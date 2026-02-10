"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Structure of the application settings.
 */
export interface Settings {
  /** Name of the default workspace to create for new users. */
  defaultWorkspace: string;
  /** Whether to automatically open the last used workspace on startup. */
  openLastWorkspace: boolean;
  /** Whether to prompt for confirmation before closing a tab. */
  confirmCloseTab: boolean;
  /** Whether to prompt for confirmation before deleting collections or requests. */
  confirmDelete: boolean;
  /** The default HTTP method for newly created requests. */
  defaultMethod: "GET" | "POST";
  /** ID of the last active workspace, used for session recovery. */
  lastWorkspaceId?: string;
}

/**
 * Accessor and mutator interface for the settings context.
 */
interface SettingsContextType {
  /** The current application settings object. */
  settings: Settings;
  /** Function to update specific settings keys. */
  updateSettings: (updates: Partial<Settings>) => void;
  /** Controls visibility of the settings modal. */
  isSettingsOpen: boolean;
  /** Setter for the settings modal visibility. */
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

/**
 * Provider for managing user preferences and app-wide configuration state.
 * Handles persistence to localStorage.
 */
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Initial load effect. Populates state from localStorage on mount.
   */
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

  /**
   * Persistence effect. Updates localStorage whenever settings change.
   */
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings, isInitialized]);

  /**
   * Updates settings state with a partial update object.
   * Performs shallow comparison to avoid unnecessary re-renders.
   */
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

/**
 * Hook to access and modify application settings.
 * @throws Error if used outside of SettingsProvider.
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
