import { AudioCaptureService } from "../services/audio";
import { SessionManager } from "../services/storage";

const audioCapture = new AudioCaptureService();
// const sessionManager = new SessionManager();

chrome.runtime.onInstalled.addListener(() => {
  console.log("Meeting Summarizer Extension Installed");
});

// Setup basic message passing if the popup needs to communicate with background
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
});
