import { AudioProcessor } from "../utils/audioProcessor";
import { AudioFrame } from "../types";
import { CONFIG } from "../constants/config";

type EventHandler = (data: any) => void;

export class AudioCaptureService {
  private processor: AudioProcessor | null = null;
  private stream: MediaStream | null = null;
  private isRecording: boolean = false;
  private isPaused: boolean = false;
  private listeners: Record<string, EventHandler[]> = {};

  public on(event: string, handler: EventHandler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(h => h(data));
    }
  }

  public async startRecordingWithStream(stream: MediaStream): Promise<void> {
    if (this.isRecording) return;
    
    try {
      this.stream = stream;
      this.processor = new AudioProcessor();
      await this.processor.setupContext(this.stream!, CONFIG.CHUNK_SIZE_MS, (frame: AudioFrame) => {
        if (!this.isPaused) {
          this.emit('audioFrame', frame);
        }
      });

      this.isRecording = true;
      this.isPaused = false;
    } catch (e) {
      console.error("Failed to start recording with stream:", e);
      throw e;
    }
  }

  public async startRecording(): Promise<void> {
    if (this.isRecording) return;
    
    try {
      this.stream = await new Promise((resolve, reject) => {
        chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
          if (chrome.runtime.lastError || !stream) {
            console.error("Tab capture failed, falling back to desktopCapture", chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            resolve(stream);
          }
        });
      });
      
      this.processor = new AudioProcessor();
      await this.processor.setupContext(this.stream!, CONFIG.CHUNK_SIZE_MS, (frame: AudioFrame) => {
        if (!this.isPaused) {
          this.emit('audioFrame', frame);
        }
      });

      this.isRecording = true;
      this.isPaused = false;
    } catch (e) {
      console.error("Failed to start recording:", e);
      throw e;
    }
  }

  public async stopRecording(): Promise<void> {
    if (!this.isRecording) return;
    
    if (this.processor) {
      this.processor.stop();
      this.processor = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    this.isRecording = false;
    this.isPaused = false;
    this.emit('recordingEnded');
  }

  public async pauseRecording(): Promise<void> {
    if (!this.isRecording) return;
    this.isPaused = true;
    this.emit('recordingPaused');
  }

  public async resumeRecording(): Promise<void> {
    if (!this.isRecording) return;
    this.isPaused = false;
  }
}
