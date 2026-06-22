import React, { useEffect, useRef } from "react";
import { TranscriptSegment } from "../../types";

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
}

export function TranscriptPanel({ segments }: TranscriptPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [segments]);

  const formatTimestamp = (timestamp: number) => {
    const d = new Date(timestamp);
    return `[${d.toTimeString().split(' ')[0]}]`;
  };

  return (
    <div className="transcript-content flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="transcript-container flex-1 overflow-y-auto p-4 space-y-4" id="transcript-scroll" ref={containerRef}>
        {segments.length === 0 && (
          <div className="text-gray-500 text-center mt-10">No transcription data yet. Start recording!</div>
        )}
        {segments.map((segment) => (
          <div key={segment.id} className={`transcript-segment p-3 rounded-lg border ${segment.interim ? 'border-dashed border-gray-300 opacity-70' : 'border-solid border-gray-200 bg-gray-50 shadow-sm'}`}>
            <div className="flex items-center space-x-2 mb-1">
              <span className="segment-speaker font-semibold text-accent">{segment.speaker}</span>
              <span className="segment-timestamp text-xs text-gray-500">{formatTimestamp(segment.timestamp.start)}</span>
            </div>
            <p className="segment-text text-gray-800 leading-relaxed">{segment.text}</p>
          </div>
        ))}
      </div>

      <div className="transcript-footer p-3 border-t border-gray-200 flex space-x-2 bg-gray-50">
        <input type="text" className="search-input flex-1 px-3 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Find in transcript..." />
        <button className="btn-copy-transcript px-4 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors shadow-sm font-medium" title="Copy entire transcript" onClick={() => {
          const text = segments.map(s => `${s.speaker}: ${s.text}`).join("\n");
          navigator.clipboard.writeText(text);
        }}>
          Copy
        </button>
      </div>
    </div>
  );
}
