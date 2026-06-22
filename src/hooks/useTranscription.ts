import { useState, useEffect, useCallback } from 'react';
import { TranscriptSegment } from '../types';
import { WebSpeechTranscriber } from '../services/transcription';

export function useTranscription() {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriber, setTranscriber] = useState<WebSpeechTranscriber | null>(null);

  useEffect(() => {
    const t = new WebSpeechTranscriber(
      (interimSegment) => {
        setSegments(prev => {
          const newSegments = [...prev];
          const lastIndex = newSegments.findIndex(s => s.interim);
          if (lastIndex >= 0) {
            newSegments[lastIndex] = interimSegment;
          } else {
            newSegments.push(interimSegment);
          }
          return newSegments;
        });
      },
      (finalSegment) => {
        setSegments(prev => {
          const newSegments = prev.filter(s => !s.interim);
          newSegments.push(finalSegment);
          return newSegments;
        });
      },
      (err) => {
        setError(err.toString());
      }
    );
    setTranscriber(t);

    return () => {
      t.stop();
    };
  }, []);

  const startTranscription = useCallback(async () => {
    if (transcriber) {
      try {
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
      } catch (err) {
        console.error("Failed to start background capture", err);
      }
      
      transcriber.start();
      setIsLive(true);
      setError(null);
    }
  }, [transcriber]);

  const stopTranscription = useCallback(async () => {
    if (transcriber) {
      transcriber.stop();
      setIsLive(false);

      try {
        chrome.runtime.sendMessage({ action: "stopRecording" });
      } catch(e) {}
    }
  }, [transcriber]);

  return { segments, isLive, error, startTranscription, stopTranscription };
}
