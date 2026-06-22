import { AudioCaptureService } from "../services/audio";
import { SessionManager } from "../services/storage";
import { SpeakerDiarizationService } from "../services/diarization";
import { AudioFrame } from "../types";

const audioCapture = new AudioCaptureService();
const diarizationService = new SpeakerDiarizationService();

audioCapture.on('audioFrame', (frame: AudioFrame) => {
  diarizationService.processAudioFrame(frame);
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Meeting Summarizer Extension Installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startRecording") {
    audioCapture.startRecording()
      .then(() => sendResponse({ success: true }))
      .catch(e => sendResponse({ error: e.message }));
    return true; // Keep response channel open for async
  }
  if (request.action === "stopRecording") {
    audioCapture.stopRecording()
      .then(() => sendResponse({ success: true }))
      .catch(e => sendResponse({ error: e.message }));
    return true;
  }
  if (request.action === "getCurrentSpeaker") {
    const speakerInfo = diarizationService.getCurrentSpeaker();
    sendResponse(speakerInfo);
    return false; // Synchronous response
  }
});
