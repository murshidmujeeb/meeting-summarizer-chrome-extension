import { useState, useEffect, useCallback } from 'react';
import { TranscriptSegment } from '../types';

export function useTranscription() {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<any>(null);

  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.action === "whisperProgress") {
        setLoadingProgress(message.progress);
      } else if (message.action === "whisperTranscriptSegment") {
        setSegments(prev => {
          const newSegments = [...prev];
          newSegments.push(message.segment);
          return newSegments;
        });
      } else if (message.action === "recordingStarted") {
        setLoadingProgress(null);
        setIsLive(true);
      } else if (message.action === "recordingError") {
        setError(message.error);
        setLoadingProgress(null);
        setIsLive(false);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const startTranscription = useCallback(async () => {
    try {
      // Set initial loading state so UI shows the downloading screen
      setLoadingProgress({ status: 'init', progress: 0 });
      setIsLive(true);
      setError(null);

      // Fire and forget start command. It will return instantly.
      // We rely on "recordingStarted" and "recordingError" events below.
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "startRecording" }, (res) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else if (res?.error) reject(new Error(res.error));
          else resolve(res);
        });
      });

    } catch (err: any) {
      console.error("Failed to start background capture", err);
      setError(err.toString());
      setLoadingProgress(null);
      setIsLive(false);
    }
  }, []);

  const stopTranscription = useCallback(async () => {
    setIsLive(false);
    try {
      chrome.runtime.sendMessage({ action: "stopRecording" });
    } catch(e) {}
  }, []);

  return { segments, isLive, error, loadingProgress, startTranscription, stopTranscription };
}
