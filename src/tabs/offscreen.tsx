import { useEffect } from "react";
import { AudioCaptureService } from "../services/audio";
import { SpeakerDiarizationService } from "../services/diarization";
import { WhisperAdapter } from "../services/whisperAdapter";
import { whisperService } from "../services/whisperService";
import { AudioFrame } from "../types";

const audioCapture = new AudioCaptureService();
const diarizationService = new SpeakerDiarizationService();
const whisperAdapter = new WhisperAdapter();

audioCapture.on('audioFrame', (frame: AudioFrame) => {
  diarizationService.processAudioFrame(frame);
  const speakerInfo = diarizationService.getCurrentSpeaker();

  whisperAdapter.addFrame(frame.data, speakerInfo.speakerId, speakerInfo.confidence, (segment) => {
    try {
      chrome.runtime.sendMessage({ action: "whisperTranscriptSegment", segment });
    } catch (e) {}
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startOffscreenRecording") {
    const streamId = request.streamId;
    
    // Fire and forget initialization so we don't block the background service worker
    (async () => {
      try {
        await whisperService.initialize((progress) => {
          try {
            chrome.runtime.sendMessage({ action: "whisperProgress", progress });
          } catch (e) {}
        });

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: "tab",
              chromeMediaSourceId: streamId
            }
          } as any
        });

        await audioCapture.startRecordingWithStream(stream);
        
        try {
          chrome.runtime.sendMessage({ action: "recordingStarted" });
        } catch (e) {}
      } catch (err: any) {
        try {
          chrome.runtime.sendMessage({ action: "recordingError", error: err.message });
        } catch (e) {}
      }
    })();
    return false; // No direct async response needed
  }
  
  if (request.action === "stopOffscreenRecording") {
    audioCapture.stopRecording().then(() => sendResponse({ success: true }));
    return true;
  }

  if (request.action === "getCurrentSpeakerOffscreen") {
    const speakerInfo = diarizationService.getCurrentSpeaker();
    sendResponse(speakerInfo);
    return false;
  }
});

function OffscreenDocument() {
  return null;
}

export default OffscreenDocument;
