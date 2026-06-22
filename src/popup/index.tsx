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
  const { segments, isLive, startTranscription, stopTranscription, error } = useTranscription();

  return (
    <div className={`meeting-summarizer-panel ${isLive ? 'recording' : ''}`}>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      <div className="panel-header">
        <div className="header-left">
          <h1 className="panel-title">Meeting Assistant</h1>
          {isLive && <span className="status-badge recording">Recording</span>}
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

      <div style={{flex: 1, overflow: 'hidden'}}>
        {activeTab === 'transcript' && (
          <TranscriptPanel segments={segments} />
        )}
        
        {activeTab === 'summary' && (
          <SummaryPanel segments={segments} />
        )}
      </div>
    </div>
  );
}

export default IndexPopup;
