export class FrequencyAnalyzer {
  private sampleRate: number;

  constructor(sampleRate: number = 44100) {
    this.sampleRate = sampleRate;
  }

  // Calculate fundamental frequency (F0) using autocorrelation
  public getFundamentalFrequency(data: Float32Array): number {
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;

    // Calculate RMS to ensure there's enough signal
    for (let i = 0; i < data.length; i++) {
      rms += data[i] * data[i];
    }
    rms = Math.sqrt(rms / data.length);
    if (rms < 0.01) return 0; // Too quiet for F0 detection

    // Autocorrelation
    // For human voice, F0 is typically between 80Hz and 250Hz.
    // In terms of offset (samples): offset = sampleRate / F0
    const minOffset = Math.floor(this.sampleRate / 300); // ~300Hz
    const maxOffset = Math.floor(this.sampleRate / 80);  // ~80Hz

    const limit = Math.min(data.length - maxOffset, Math.floor(data.length / 2));
    if (limit <= 0) return 0;

    for (let offset = minOffset; offset < maxOffset; offset++) {
      let correlation = 0;

      for (let i = 0; i < limit; i++) {
        correlation += data[i] * data[i + offset];
      }

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    if (bestCorrelation > 0 && bestOffset > 0) {
      return this.sampleRate / bestOffset;
    }
    return 0;
  }

  // Calculate volume in Decibels
  public getVolumeDecibels(data: Float32Array): number {
    let rms = 0;
    for (let i = 0; i < data.length; i++) {
      rms += data[i] * data[i];
    }
    rms = Math.sqrt(rms / data.length);
    if (rms === 0) return -100; // -100dB for silence
    return 20 * Math.log10(rms);
  }
}
