export const DIARIZATION_CONFIG = {
  SILENCE_THRESHOLD_MS: 500, // >500ms silence = potential new speaker
  FREQUENCY_CHANGE_HZ: 100, // >100Hz change = likely new speaker
  VOLUME_CHANGE_DB: 6, // >6dB change = possible new speaker
  CONFIDENCE_SILENCE_WEIGHT: 0.5,
  CONFIDENCE_FREQ_WEIGHT: 0.3,
  CONFIDENCE_VOL_WEIGHT: 0.2
};
