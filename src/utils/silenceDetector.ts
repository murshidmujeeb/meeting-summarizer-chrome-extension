export class SilenceDetector {
  private threshold: number;
  private minSilenceMs: number;
  private silenceStart: number | null = null;
  private sampleRate: number;

  constructor(thresholdPercent: number = 10, minSilenceMs: number = 500, sampleRate: number = 44100) {
    this.threshold = thresholdPercent / 100; // e.g., 0.1 for 10%
    this.minSilenceMs = minSilenceMs;
    this.sampleRate = sampleRate;
  }

  public detectSilence(data: Float32Array): { isSilence: boolean; duration: number } {
    let rms = 0;
    for (let i = 0; i < data.length; i++) {
      rms += data[i] * data[i];
    }
    rms = Math.sqrt(rms / data.length);

    // Simple fixed absolute threshold for now (could be adaptive)
    const isQuiet = rms < 0.01; 
    
    if (isQuiet) {
      if (this.silenceStart === null) {
        this.silenceStart = Date.now();
      }
      const duration = Date.now() - this.silenceStart;
      return { isSilence: duration >= this.minSilenceMs, duration };
    } else {
      const duration = this.silenceStart !== null ? Date.now() - this.silenceStart : 0;
      this.silenceStart = null;
      return { isSilence: false, duration };
    }
  }
}
