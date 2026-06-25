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
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const startTranscription = useCallback(async () => {
    try {
      setError(null);
      setLoadingProgress({ status: 'init', name: 'Initializing Whisper...' });
      
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "startRecording" }, (res) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (res?.error) {
            reject(new Error(res.error));
          } else {
            resolve(res);
          }
        });
      });
      
      setIsLive(true);
      setLoadingProgress(null);
    } catch (err: any) {
      console.error("Failed to start background capture", err);
      setError(err.toString());
      setLoadingProgress(null);
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
