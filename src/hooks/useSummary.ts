import { useState, useCallback, useRef } from 'react';
import { SummarizationService, SummaryLevel } from '../services/summarization';
import { TranscriptSegment } from '../types';
import { InitProgressReport } from '@mlc-ai/web-llm';

export function useSummary() {
  const [summary, setSummary] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<InitProgressReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const serviceRef = useRef<SummarizationService | null>(null);

  const generateSummary = useCallback(async (segments: TranscriptSegment[], level: SummaryLevel) => {
    if (segments.length === 0) {
      setError("No transcript data to summarize.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSummary('');

    try {
      if (!serviceRef.current) {
        serviceRef.current = new SummarizationService();
      }

      await serviceRef.current.initModel((progress) => {
        setLoadingProgress(progress);
      });

      setLoadingProgress(null); // Model loaded

      await serviceRef.current.generateSummary(segments, level, (partialText) => {
        setSummary(partialText);
      });

    } catch (err: any) {
      setError(err.message || "Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { summary, isGenerating, loadingProgress, error, generateSummary };
}
