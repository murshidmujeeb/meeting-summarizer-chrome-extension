import { useState } from "react";
import "../styles/globals.css";
import "./popup.css";
import { useTranscription } from "../hooks/useTranscription";
import { TranscriptPanel } from "./components/TranscriptPanel";
import { SummaryPanel } from "./components/SummaryPanel";
import { ControlsBar } from "./components/ControlsBar";
import { SettingsModal } from "./components/SettingsModal";

function IndexPopup() {
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('transcript');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { segments, isLive, startTranscription, stopTranscription, error, loadingProgress } = useTranscription();

  return (
    <div className={`meeting-summarizer-panel ${isLive ? 'recording' : ''}`}>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      <div className="panel-header">
        <div className="header-left">
          <h1 className="panel-title">Meeting Assistant</h1>
          {isLive && !loadingProgress && <span className="status-badge recording">Recording</span>}
          {error && <span className="status-badge" style={{color: 'red'}}>Error</span>}
        </div>
        <div className="header-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ControlsBar onSettingsClick={() => setIsSettingsOpen(true)} />
          <button 
            className="header-btn" 
            onClick={isLive ? stopTranscription : startTranscription}
            title={isLive ? "Stop Recording" : "Start Recording"}
          >
            {isLive ? '⏹' : '▶'}
          </button>
        </div>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab ${activeTab === 'transcript' ? 'active' : ''}`} 
          onClick={() => setActiveTab('transcript')}
        >
          Transcript
          <span className="tab-count">{segments.length}</span>
        </button>
        <button 
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`} 
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 text-xs border-b border-red-200 break-words" style={{maxHeight: '100px', overflowY: 'auto'}}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{flex: 1, overflow: 'hidden'}}>
        {loadingProgress ? (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 text-center">
            <div className="mb-4">
              <svg className="animate-spin h-10 w-10 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Downloading AI Model</h3>
            <p className="text-sm text-gray-500 mb-4">First-time setup takes a few minutes depending on your connection (75MB).</p>
            
            {loadingProgress.file && <p className="text-xs text-gray-500 mb-1 truncate w-full px-4 text-left">Downloading: {loadingProgress.file}</p>}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 dark:bg-gray-700 overflow-hidden relative">
              <div className="bg-accent h-2.5 rounded-full transition-all duration-300" style={{ width: `${loadingProgress.progress || (loadingProgress.status === 'done' || loadingProgress.status === 'ready' ? 100 : 0)}%` }}></div>
            </div>
            <div className="flex justify-between w-full px-1">
              <span className="text-xs font-medium text-gray-500 capitalize">{loadingProgress.status || 'initializing'}...</span>
              <span className="text-xs font-bold text-accent">{loadingProgress.status === 'ready' ? '100%' : `${Math.round(loadingProgress.progress || 0)}%`}</span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'transcript' && (
              <TranscriptPanel segments={segments} />
            )}
            
            {activeTab === 'summary' && (
              <SummaryPanel segments={segments} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default IndexPopup;
