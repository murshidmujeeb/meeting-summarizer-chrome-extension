import React, { useState } from "react";
import { TranscriptSegment } from "../../types";
import { useSummary } from "../../hooks/useSummary";
import { SummaryLevel } from "../../services/summarization";

interface SummaryPanelProps {
  segments: TranscriptSegment[];
}

export function SummaryPanel({ segments }: SummaryPanelProps) {
  const [level, setLevel] = useState<SummaryLevel>('short');
  const { summary, isGenerating, loadingProgress, error, generateSummary } = useSummary();

  const handleGenerate = () => {
    generateSummary(segments, level);
  };

  const copySummary = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
    }
  };

  return (
    <div className="summary-content flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="summary-controls p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <fieldset className="summary-level-group border-none m-0 p-0 flex flex-col gap-2 mb-3">
          <legend className="summary-legend text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">Summary Level</legend>
          
          <label className="radio-button flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors">
            <input type="radio" name="summary-level" value="short" checked={level === 'short'} onChange={() => setLevel('short')} className="w-4 h-4 accent-accent" />
            <span className="radio-label flex flex-col flex-1">
              <span className="radio-title text-sm font-medium text-gray-900">Short</span>
              <span className="radio-desc text-xs text-gray-600">5 key bullets</span>
            </span>
          </label>

          <label className="radio-button flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors">
            <input type="radio" name="summary-level" value="medium" checked={level === 'medium'} onChange={() => setLevel('medium')} className="w-4 h-4 accent-accent" />
            <span className="radio-label flex flex-col flex-1">
              <span className="radio-title text-sm font-medium text-gray-900">Medium</span>
              <span className="radio-desc text-xs text-gray-600">Detailed summary</span>
            </span>
          </label>

          <label className="radio-button flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors">
            <input type="radio" name="summary-level" value="detailed" checked={level === 'detailed'} onChange={() => setLevel('detailed')} className="w-4 h-4 accent-accent" />
            <span className="radio-label flex flex-col flex-1">
              <span className="radio-title text-sm font-medium text-gray-900">Detailed</span>
              <span className="radio-desc text-xs text-gray-600">Full meeting minutes</span>
            </span>
          </label>
        </fieldset>

        <button 
          className={`btn-generate-summary w-full p-3 bg-accent hover:bg-accent-hover text-white rounded-md font-medium flex items-center justify-center gap-2 transition-colors ${isGenerating ? 'opacity-80 cursor-not-allowed' : ''}`}
          onClick={handleGenerate}
          disabled={isGenerating || segments.length === 0}
        >
          {isGenerating ? (
            loadingProgress ? `Loading Model: ${Math.round(loadingProgress.progress * 100)}%` : "Generating..."
          ) : "Generate Summary"}
        </button>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      <div className="summary-display flex-1 overflow-y-auto p-4 relative" id="summary-display">
        {!summary && !isGenerating && (
          <div className="summary-empty-state flex flex-col items-center justify-center h-full text-center text-gray-500 gap-3">
            <p className="text-sm font-medium m-0">No summary yet</p>
            <small className="text-xs">Generate a summary to see it here</small>
          </div>
        )}
        
        {summary && (
          <div className="summary-text whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {summary}
          </div>
        )}
      </div>

      {summary && (
        <div className="summary-actions flex gap-2 p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button className="btn-secondary flex-1 py-2 px-3 bg-white border border-gray-300 rounded-md text-gray-900 text-sm font-medium hover:bg-gray-100 transition-colors" onClick={copySummary}>Copy</button>
          <button className="btn-secondary flex-1 py-2 px-3 bg-white border border-gray-300 rounded-md text-gray-900 text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50" disabled={true} title="PDF Export coming in Milestone 6">Export as PDF</button>
        </div>
      )}
    </div>
  );
}
