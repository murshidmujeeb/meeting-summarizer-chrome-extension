import { TranscriptSegment } from "../types";
import { v4 as uuidv4 } from "uuid";

export class WebSpeechTranscriber {
  private recognition: any;
  private isListening = false;
  private onInterim: (segment: TranscriptSegment) => void;
  private onFinal: (segment: TranscriptSegment) => void;
  private onError: (error: any) => void;

  constructor(
    onInterim: (segment: TranscriptSegment) => void,
    onFinal: (segment: TranscriptSegment) => void,
    onError: (error: any) => void
  ) {
    this.onInterim = onInterim;
    this.onFinal = onFinal;
    this.onError = onError;

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("WebSpeech API is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = this.handleResult.bind(this);
    this.recognition.onerror = this.handleError.bind(this);
    this.recognition.onend = () => {
      if (this.isListening) {
        // Auto-restart if continuous gets cut off
        try {
          this.recognition.start();
        } catch (e) {}
      }
    };
  }

  public start() {
    if (!this.recognition) return;
    this.isListening = true;
    try {
      this.recognition.start();
    } catch (e) {
      // Already started
    }
  }

  public stop() {
    if (!this.recognition) return;
    this.isListening = false;
    this.recognition.stop();
  }

  private async handleResult(event: any) {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    let currentSpeaker = "Speaker 1";
    let currentConfidence = 100;

    try {
      const res = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ action: "getCurrentSpeaker" }, (response) => {
          resolve(response);
        });
      });
      if (res && res.speakerId) {
        currentSpeaker = res.speakerId;
        currentConfidence = res.confidence;
      }
    } catch (e) {
      // Ignore errors if background isn't ready
    }

    const baseSegment: Omit<TranscriptSegment, 'text' | 'interim'> = {
      id: uuidv4(),
      timestamp: {
        start: Date.now(),
        end: Date.now()
      },
      speaker: currentSpeaker,
      confidence: event.results[event.results.length - 1][0].confidence * 100,
      speakerConfidence: currentConfidence,
      source: 'webspeech'
    };

    if (finalTranscript) {
      const finalSegment = { ...baseSegment, text: finalTranscript, interim: false };
      this.onFinal(finalSegment as TranscriptSegment);
    }
    
    if (interimTranscript) {
      const interimSegment = { ...baseSegment, text: interimTranscript, interim: true };
      this.onInterim(interimSegment as TranscriptSegment);
    }
  }

  private handleError(event: any) {
    console.error("Speech recognition error:", event.error);
    this.onError(event.error);
  }
}
