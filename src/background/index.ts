let offscreenCreating: Promise<void> | null = null;

async function setupOffscreenDocument(path: string) {
  if (await chrome.offscreen.hasDocument()) return;
  if (offscreenCreating) {
    await offscreenCreating;
    return;
  }
  offscreenCreating = chrome.offscreen.createDocument({
    url: path,
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification: "Recording tab audio for transcription"
  });
  await offscreenCreating;
  offscreenCreating = null;
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Meeting Summarizer Extension Installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startRecording") {
    (async () => {
      try {
        await setupOffscreenDocument("tabs/offscreen.html");
        
        // Init Whisper first
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ action: "initWhisper" }, (res) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else if (res?.error) reject(new Error(res.error));
            else resolve(res);
          });
        });

        // Get Stream ID from active tab
        const tab = await new Promise<chrome.tabs.Tab>((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs[0]));
        });

        const streamId = await new Promise<string>((resolve, reject) => {
          chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id }, (streamId) => {
             if (streamId) resolve(streamId);
             else reject(new Error("Failed to get stream id: " + chrome.runtime.lastError?.message));
          });
        });

        // Start recording in offscreen doc
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ action: "startOffscreenRecording", streamId }, (res) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else if (res?.error) reject(new Error(res.error));
            else resolve(res);
          });
        });

        sendResponse({ success: true });
      } catch (e: any) {
        sendResponse({ error: e.message });
      }
    })();
    
    return true; 
  }

  if (request.action === "stopRecording") {
    chrome.runtime.sendMessage({ action: "stopOffscreenRecording" }, (res) => {
      sendResponse(res || { success: true });
    });
    return true;
  }

  if (request.action === "getCurrentSpeaker") {
    chrome.runtime.sendMessage({ action: "getCurrentSpeakerOffscreen" }, (res) => {
      sendResponse(res);
    });
    return true;
  }
});
