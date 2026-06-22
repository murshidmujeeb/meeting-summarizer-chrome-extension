export interface TranscriptSegment {
  id: string;
  timestamp: {
    start: number;
    end: number;
  };
  text: string;
  speaker: string;
  confidence: number;
  speakerConfidence: number;
  interim: boolean;
  source: 'webspeech' | 'whisper';
}

export interface AudioFrame {
  data: Float32Array;
  timestamp: number;
}

export interface SummaryResult {
  short: string;
  medium: string;
  detailed: string;
}

export interface SessionData {
  sessionId: string;
  createdAt: number;
  updatedAt: number;
  title: string;
  duration: number;
  transcriptSegments: TranscriptSegment[];
  summary: SummaryResult;
  metadata: {
    speakerCount: number;
    videoSource: string;
    settings: any;
  };
}

export interface DiarizationResult {
  speakerId: string;
  confidence: number;
  reason: string;
}
