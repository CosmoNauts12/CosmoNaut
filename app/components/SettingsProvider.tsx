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
  /** User's custom status message. */
  status?: string;
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
  /** Controls visibility of the profile modal. */
  isProfileOpen: boolean;
  /** Setter for the profile modal visibility. */
  setProfileOpen: (open: boolean) => void;
  /** Controls visibility of the billing modal. */
  isBillingOpen: boolean;
  /** Setter for the billing modal visibility. */
  setBillingOpen: (open: boolean) => void;
  /** Controls visibility of the shortcuts modal. */
  isShortcutsOpen: boolean;
  /** Setter for the shortcuts modal visibility. */
  setShortcutsOpen: (open: boolean) => void;
  /** Helper to open settings/modals directly. */
  openSettings: (tab?: string) => void;
}

const DEFAULT_SETTINGS: Settings = {
  defaultWorkspace: "My Workspace",
  openLastWorkspace: true,
  confirmCloseTab: true,
  confirmDelete: true,
  defaultMethod: "GET",
  status: "",
};

import { useAuth } from "./AuthProvider";

const STORAGE_KEY = "cosmonaut_settings_v1";

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Provider for managing user preferences and app-wide configuration state.
 * Handles persistence to localStorage (for guests) and backend filesystem (for users).
 */
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isBillingOpen, setBillingOpen] = useState(false);
  const [isShortcutsOpen, setShortcutsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();

  /**
   * Helper to open settings modal on a specific tab.
   * Kept for backward compatibility but routes to specific modals.
   */
  const openSettings = React.useCallback((tab: string = "general") => {
    // Close all first to ensure clean state
    setSettingsOpen(false);
    setProfileOpen(false);
    setBillingOpen(false);
    setShortcutsOpen(false);

    switch (tab) {
      case "profile":
        setProfileOpen(true);
        break;
      case "billing":
        setBillingOpen(true);
        break;
      case "shortcuts":
        setShortcutsOpen(true);
        break;
      case "general":
      default:
        setSettingsOpen(true);
        break;
    }
  }, []);

  /**
   * Initial load effect. Populates state from backend or localStorage.
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (user && typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
          const { invoke } = await import('@tauri-apps/api/core');
          const saved = await invoke<string>('load_user_preferences', { userId: user.uid });
          if (saved && saved !== "{}") {
             setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
          } else {
             // If no backend settings, try migration from local storage or defaults
             const localSaved = localStorage.getItem(STORAGE_KEY);
             if (localSaved) {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(localSaved) });
             }
          }
        } else {
          // Fallback for guest/web
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
          }
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      } finally {
        setIsInitialized(true);
      }
    };

    loadSettings();
  }, [user]);

  /**
   * Persistence effect. Updates backend/localStorage whenever settings change.
   */
  useEffect(() => {
    if (!isInitialized) return;

    const saveSettings = async () => {
      try {
        if (user && typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('save_user_preferences', { 
            userId: user.uid, 
            preferences: JSON.stringify(settings) 
          });
        }
        // Always save to local storage as backup/guest mode
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (e) {
        console.error("Failed to save settings", e);
      }
    };

    saveSettings();
  }, [settings, isInitialized, user]);

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
        isProfileOpen,
        setProfileOpen,
        isBillingOpen,
        setBillingOpen,
        isShortcutsOpen,
        setShortcutsOpen,
        openSettings,
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
