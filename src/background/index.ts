import { AudioCaptureService } from "../services/audio";
import { SessionManager } from "../services/storage";
import { SpeakerDiarizationService } from "../services/diarization";
import { whisperService } from "../services/whisperService";
import { WhisperAdapter } from "../services/whisperAdapter";
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

chrome.runtime.onInstalled.addListener(() => {
  console.log("Meeting Summarizer Extension Installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startRecording") {
    whisperService.initialize((progress) => {
      try {
        chrome.runtime.sendMessage({ action: "whisperProgress", progress });
      } catch (e) {}
    })
    .then(() => audioCapture.startRecording())
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
