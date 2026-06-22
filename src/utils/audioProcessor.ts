import { AudioFrame } from "../types";

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;

  constructor() {}

  public async setupContext(stream: MediaStream, chunkSizeMs: number, onFrame: (frame: AudioFrame) => void) {
    this.audioContext = new AudioContext({ sampleRate: 44100 });
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);

    // Using 4096 buffer size, which is ~92ms at 44.1kHz. We will accumulate until chunkSizeMs.
    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    let buffer: Float32Array[] = [];
    let bufferLength = 0;
    const targetLength = Math.floor((44100 * chunkSizeMs) / 1000);

    this.scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      buffer.push(new Float32Array(inputData));
      bufferLength += inputData.length;

      if (bufferLength >= targetLength) {
        // Concatenate buffers
        const frameData = new Float32Array(bufferLength);
        let offset = 0;
        for (const b of buffer) {
          frameData.set(b, offset);
          offset += b.length;
        }

        onFrame({
          data: frameData,
          timestamp: Date.now()
        });

        buffer = [];
        bufferLength = 0;
      }
    };

    this.mediaStreamSource.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);
  }

  public stop() {
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
