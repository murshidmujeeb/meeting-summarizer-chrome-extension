import { useState, useEffect } from 'react';

export interface UserSettings {
  transcriptionEngine: 'webspeech' | 'whisper';
  summaryLevel: 'short' | 'medium' | 'detailed';
  autoSave: boolean;
  language: string;
  theme: 'light' | 'dark';
  fontSize: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  transcriptionEngine: 'webspeech',
  summaryLevel: 'short',
  autoSave: true,
  language: 'en-US',
  theme: 'light',
  fontSize: 14
};

export function useStorage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['meeting-summarizer-settings'], (result) => {
      if (result['meeting-summarizer-settings']) {
        setSettings({ ...DEFAULT_SETTINGS, ...result['meeting-summarizer-settings'] });
      }
      setIsLoaded(true);
    });
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    chrome.storage.local.set({ 'meeting-summarizer-settings': updated });
    
    // Apply theme changes if needed
    if (newSettings.theme) {
      if (newSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return { settings, updateSettings, isLoaded };
}
