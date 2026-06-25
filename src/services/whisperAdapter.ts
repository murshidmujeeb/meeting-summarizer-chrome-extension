import { whisperService } from "./whisperService";
import { TranscriptSegment } from "../types";
import { v4 as uuidv4 } from "uuid";

export class WhisperAdapter {
  private buffer: Float32Array[] = [];
  private accumulatedLength = 0;
  // We want to process 5-second chunks for Whisper
  private readonly TARGET_SECONDS = 5; 
  private readonly INPUT_SAMPLE_RATE = 44100;
  private readonly WHISPER_SAMPLE_RATE = 16000;
  
  private targetInputLength = this.TARGET_SECONDS * this.INPUT_SAMPLE_RATE;

  public addFrame(frameData: Float32Array, speakerId: string, confidence: number, onSegment: (segment: TranscriptSegment) => void) {
    this.buffer.push(frameData);
    this.accumulatedLength += frameData.length;

    if (this.accumulatedLength >= this.targetInputLength) {
      // Time to process a chunk
      const fullBuffer = new Float32Array(this.accumulatedLength);
      let offset = 0;
      for (const b of this.buffer) {
        fullBuffer.set(b, offset);
        offset += b.length;
      }

      this.buffer = [];
      this.accumulatedLength = 0;

      // Resample to 16kHz
      const resampled = this.resample(fullBuffer, this.INPUT_SAMPLE_RATE, this.WHISPER_SAMPLE_RATE);

      // We do NOT await here so we don't block the audio stream processing
      this.processChunk(resampled, speakerId, confidence, onSegment);
    }
  }

  private async processChunk(audioData: Float32Array, speakerId: string, confidence: number, onSegment: (segment: TranscriptSegment) => void) {
    if (!whisperService.isInitialized()) return;

    try {
      const text = await whisperService.transcribeChunk(audioData);
      const cleanText = text.trim();
      
      if (cleanText && cleanText.length > 2) {
        const segment: TranscriptSegment = {
          id: uuidv4(),
          speaker: speakerId,
          text: cleanText,
          timestamp: {
            start: Date.now() - (this.TARGET_SECONDS * 1000),
            end: Date.now()
          },
          confidence: 100, // Whisper doesn't easily expose word-level confidence in pipeline
          speakerConfidence: confidence,
          source: 'whisper'
        };
        onSegment(segment);
      }
    } catch (e) {
      console.error("WhisperAdapter error:", e);
    }
  }

  private resample(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
    const ratio = fromRate / toRate;
    const newLength = Math.round(buffer.length / ratio);
    const resampled = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const index1 = Math.floor(srcIndex);
      const index2 = Math.min(index1 + 1, buffer.length - 1);
      const fraction = srcIndex - index1;
      resampled[i] = buffer[index1] * (1 - fraction) + buffer[index2] * fraction;
    }
    return resampled;
  }
}
