import { AudioFrame, TranscriptSegment, DiarizationResult } from "../types";
import { DIARIZATION_CONFIG } from "../constants/diarization";
import { SilenceDetector } from "../utils/silenceDetector";
import { FrequencyAnalyzer } from "../utils/frequencyAnalysis";

export class SpeakerDiarizationService {
  private silenceDetector: SilenceDetector;
  private freqAnalyzer: FrequencyAnalyzer;
  
  private currentSpeakerIndex: number = 1;
  private lastF0: number = 0;
  private lastVolDb: number = 0;
  private lastSilenceDuration: number = 0;

  constructor(sampleRate: number = 44100) {
    this.silenceDetector = new SilenceDetector(10, DIARIZATION_CONFIG.SILENCE_THRESHOLD_MS, sampleRate);
    this.freqAnalyzer = new FrequencyAnalyzer(sampleRate);
  }

  // Process a raw audio frame to update internal state (called continually during recording)
  public processAudioFrame(frame: AudioFrame): void {
    const silenceInfo = this.silenceDetector.detectSilence(frame.data);
    if (silenceInfo.isSilence) {
      this.lastSilenceDuration = silenceInfo.duration;
    } else {
      // Audio is present, calculate F0 and Vol
      const f0 = this.freqAnalyzer.getFundamentalFrequency(frame.data);
      const volDb = this.freqAnalyzer.getVolumeDecibels(frame.data);
      
      // Update last known valid measurements
      if (f0 > 0) this.lastF0 = f0;
      if (volDb > -100) this.lastVolDb = volDb;
    }
  }

  // Analyze current state and assign speaker
  public getCurrentSpeaker(): DiarizationResult {
    let confidence = 0;
    let reason = "Continuous speech";
    let isNewSpeaker = false;
    
    // 1. Silence Check (Highest Priority Heuristic)
    if (this.lastSilenceDuration > DIARIZATION_CONFIG.SILENCE_THRESHOLD_MS) {
      isNewSpeaker = true;
      confidence += Math.min(100, (this.lastSilenceDuration / DIARIZATION_CONFIG.SILENCE_THRESHOLD_MS) * 100) * DIARIZATION_CONFIG.CONFIDENCE_SILENCE_WEIGHT;
      reason = "Silence > 500ms";
    }

    // 2. We use lastF0 and lastVolDb which were updated in processAudioFrame
    // For a simpler MVP without requiring the exact frame at segment boundary:
    // We already track changes in processAudioFrame if we wanted, but let's just 
    // rely heavily on silence for MVP if F0/Vol aren't directly available here.
    // Actually, processAudioFrame could do the delta tracking.
    
    if (isNewSpeaker) {
      this.currentSpeakerIndex = this.currentSpeakerIndex === 1 ? 2 : 1; 
      this.lastSilenceDuration = 0; // reset
    } else {
      confidence = 100;
    }

    return {
      speakerId: `Speaker ${this.currentSpeakerIndex}`,
      confidence: Math.round(confidence),
      reason
    };
  }
}
