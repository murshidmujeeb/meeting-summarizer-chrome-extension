import React from 'react';
import { useStorage } from '../../hooks/useStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, isLoaded } = useStorage();

  if (!isOpen || !isLoaded) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 m-0">Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-xl leading-none">&times;</button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Transcription Engine</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded focus:ring-accent focus:border-accent text-sm"
              value={settings.transcriptionEngine}
              onChange={e => updateSettings({ transcriptionEngine: e.target.value as any })}
            >
              <option value="webspeech">WebSpeech API (Online)</option>
              <option value="whisper">Whisper.cpp (Offline - Coming Soon)</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Theme</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded focus:ring-accent focus:border-accent text-sm"
              value={settings.theme}
              onChange={e => updateSettings({ theme: e.target.value as any })}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.autoSave}
                onChange={e => updateSettings({ autoSave: e.target.checked })}
                className="w-4 h-4 text-accent rounded focus:ring-accent"
              />
              <span className="text-sm font-medium text-gray-700">Auto-save sessions to History</span>
            </label>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover font-medium text-sm transition-colors">Done</button>
        </div>
      </div>
    </div>
  );
}
