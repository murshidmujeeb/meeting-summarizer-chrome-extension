import { pipeline, env } from "@huggingface/transformers";

// Critical: Set proxy for CORS inside extension
env.allowLocalModels = false;
env.allowRemoteModels = true;

export class WhisperService {
  private transcriber: any = null;
  private isReady = false;

  async initialize(onProgress?: (progress: any) => void): Promise<void> {
    if (this.isReady) return;
    console.log("Initializing Whisper model...");
    
    this.transcriber = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-tiny.en",
      {
        quantized: true, 
        local_files_only: false,
        progress_callback: onProgress
      }
    );

    this.isReady = true;
    console.log("Whisper model ready");
  }

  async transcribeChunk(audioBuffer: Float32Array): Promise<string> {
    if (!this.isReady || !this.transcriber) {
      throw new Error("Whisper not initialized");
    }

    // Convert Float32Array to format Whisper expects
    const audio = {
      array: audioBuffer,
      sampling_rate: 16000,
    };

    try {
      const result = await this.transcriber(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        language: "english",
      });

      return result.text || "";
    } catch (error) {
      console.error("Transcription error:", error);
      return "";
    }
  }

  isInitialized(): boolean {
    return this.isReady;
  }
}

export const whisperService = new WhisperService();
