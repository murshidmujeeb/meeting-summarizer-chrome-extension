import { useEffect } from "react";
import { AudioCaptureService } from "../services/audio";
import { SpeakerDiarizationService } from "../services/diarization";
import { WhisperAdapter } from "../services/whisperAdapter";
import { whisperService } from "../services/whisperService";
import { AudioFrame } from "../types";

const audioCapture = new AudioCaptureService();
const diarizationService = new SpeakerDiarizationService();
const whisperAdapter = new WhisperAdapter();

let isInitialized = false;

function OffscreenDocument() {
  useEffect(() => {
    if (isInitialized) return;
    isInitialized = true;

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
        
        // Use getUserMedia with the streamId to get the tab capture
        navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: "tab",
              chromeMediaSourceId: streamId
            }
          } as any
        }).then((stream) => {
          // Pass the stream directly to AudioCaptureService
          return audioCapture.startRecordingWithStream(stream);
        }).then(() => {
          sendResponse({ success: true });
        }).catch((e) => {
          sendResponse({ error: e.message });
        });
        return true;
      }
      
      if (request.action === "stopOffscreenRecording") {
        audioCapture.stopRecording().then(() => sendResponse({ success: true }));
        return true;
      }

      if (request.action === "initWhisper") {
        whisperService.initialize((progress) => {
          try {
            chrome.runtime.sendMessage({ action: "whisperProgress", progress });
          } catch (e) {}
        }).then(() => {
          sendResponse({ success: true });
        }).catch(e => {
          sendResponse({ error: e.message });
        });
        return true;
      }

      if (request.action === "getCurrentSpeakerOffscreen") {
        const speakerInfo = diarizationService.getCurrentSpeaker();
        sendResponse(speakerInfo);
        return false;
      }
    });

  }, []);

  return null;
}

export default OffscreenDocument;
