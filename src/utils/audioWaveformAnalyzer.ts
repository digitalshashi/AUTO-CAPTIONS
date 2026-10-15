/**
 * High-Density Premiere Pro Audio & Music/Whoosh SFX Waveform Engine
 *
 * Extracts real multi-resolution PCM peak & RMS envelopes from uploaded video/audio files
 * via Web Audio API, and renders sub-pixel high-density Premiere Pro waveforms onto HTML5 Canvas.
 */

export interface WhooshMarker {
  id: string;
  time: number; // Seconds from start of timeline
  duration: number; // Default ~0.45s
  label: string; // e.g. "Whoosh Swish", "Sub Drop", "Riser Hit"
  intensity: number; // 0.6 .. 1.0
}

export interface HighDensityWaveformData {
  peaks: Float32Array; // Normalized 0..1 peak amplitude per bucket (1200+ buckets)
  rms: Float32Array; // Normalized 0..1 RMS energy per bucket
  sampleCount: number;
  duration: number;
}

/**
 * Decodes real PCM audio from an uploaded video/audio File or Blob and computes
 * 1,200 high-density peak + RMS buckets for Premiere Pro waveform rendering.
 */
export async function extractHighDensityWaveformFromFile(
  file: File | Blob,
  bucketCount: number = 1200
): Promise<HighDensityWaveformData | null> {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  let audioCtx: AudioContext | null = null;
  try {
    const arrayBuffer = await file.arrayBuffer();
    audioCtx = new AudioCtx();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const channel0 = audioBuffer.getChannelData(0);
    const channel1 =
      audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : channel0;
    const totalSamples = channel0.length;
    const samplesPerBucket = Math.max(1, Math.floor(totalSamples / bucketCount));

    const peaks = new Float32Array(bucketCount);
    const rms = new Float32Array(bucketCount);
    let globalMax = 0.01;

    for (let b = 0; b < bucketCount; b++) {
      const start = b * samplesPerBucket;
      const end = Math.min(totalSamples, start + samplesPerBucket);
      let maxAbs = 0;
      let sumSq = 0;
      const step = Math.max(1, Math.floor((end - start) / 64));
      let count = 0;

      for (let i = start; i < end; i += step) {
        const sample = (Math.abs(channel0[i]) + Math.abs(channel1[i])) * 0.5;
        if (sample > maxAbs) maxAbs = sample;
        sumSq += sample * sample;
        count++;
      }

      peaks[b] = maxAbs;
      rms[b] = count > 0 ? Math.sqrt(sumSq / count) : 0;
      if (maxAbs > globalMax) globalMax = maxAbs;
    }

    // Normalize so the loudest transient reaches ~0.96 height
    const invMax = 0.96 / globalMax;
    for (let b = 0; b < bucketCount; b++) {
      peaks[b] = Math.min(1, peaks[b] * invMax);
      rms[b] = Math.min(1, rms[b] * invMax * 0.85);
    }

    return {
      peaks,
      rms,
      sampleCount: bucketCount,
      duration: audioBuffer.duration,
    };
  } catch {
    return null;
  } finally {
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }
  }
}

/**
 * Generates a realistic, high-density syllabic dialogue waveform synced to the active caption segments
 * when real PCM decoding is still loading or when previewing sample reels.
 */
export function buildSyllabicDialogueWaveform(
  duration: number,
  segments: { startTime: number; endTime: number }[],
  bucketCount: number = 1200
): HighDensityWaveformData {
  const safeDur = Math.max(1, duration);
  const peaks = new Float32Array(bucketCount);
  const rms = new Float32Array(bucketCount);

  for (let b = 0; b < bucketCount; b++) {
    const t = (b / bucketCount) * safeDur;
    // Check if t falls inside an active spoken caption segment
    const activeSeg = segments.find((s) => t >= s.startTime && t <= s.endTime);

    if (activeSeg) {
      const segProgress =
        (t - activeSeg.startTime) / Math.max(0.15, activeSeg.endTime - activeSeg.startTime);
      // Natural syllable cadence (~4.5 syllables/sec) + micro-transients
      const syllableWave = Math.abs(Math.sin(t * 14.2 + Math.cos(t * 5.7) * 1.4));
      const consonantSpike = Math.abs(Math.sin(b * 1.93 + t * 37.0));
      const breathEnvelope =
        segProgress < 0.06
          ? segProgress / 0.06
          : segProgress > 0.92
          ? (1 - segProgress) / 0.08
          : 1.0;

      const rawPeak =
        (0.28 + syllableWave * 0.46 + Math.pow(consonantSpike, 3) * 0.25) * breathEnvelope;
      peaks[b] = Math.min(0.98, Math.max(0.08, rawPeak));
      rms[b] = peaks[b] * (0.54 + 0.16 * Math.sin(b * 0.31));
    } else {
      // Quiet studio noise floor between sentences
      const floorNoise = 0.025 + Math.abs(Math.sin(b * 0.77)) * 0.03;
      peaks[b] = floorNoise;
      rms[b] = floorNoise * 0.6;
    }
  }

  return {
    peaks,
    rms,
    sampleCount: bucketCount,
    duration: safeDur,
  };
}

/**
 * Generates a high-density Music + Whoosh SFX dual-envelope waveform:
 * - Continuous rhythmic stereo music bed
 * - High-energy transient Whoosh / Riser / Impact SFX spikes at hook transitions
 */
export function buildMusicAndWhooshWaveform(
  duration: number,
  whooshMarkers: WhooshMarker[],
  bucketCount: number = 1200
): HighDensityWaveformData {
  const safeDur = Math.max(1, duration);
  const peaks = new Float32Array(bucketCount);
  const rms = new Float32Array(bucketCount);

  for (let b = 0; b < bucketCount; b++) {
    const t = (b / bucketCount) * safeDur;
    // 124 BPM rhythmic beat pulse + hi-hat transient texture
    const beatPhase = (t * (124 / 60)) % 1;
    const kickTransient = Math.exp(-beatPhase * 6.5) * 0.42;
    const bassBed = 0.24 + Math.abs(Math.sin(t * 6.28 * 2)) * 0.16;
    const hiHat = Math.pow(Math.abs(Math.sin(b * 2.71)), 4) * 0.18;

    let totalPeak = bassBed + kickTransient + hiHat;

    // Superimpose Whoosh / Swish SFX transient envelopes
    for (const w of whooshMarkers) {
      const halfDur = Math.max(0.15, w.duration * 0.5);
      const dist = Math.abs(t - w.time);
      if (dist <= halfDur) {
        // Asymmetric riser-into-whoosh impact envelope
        const norm = 1 - dist / halfDur;
        const whooshEnv = Math.pow(norm, 1.35) * w.intensity;
        const swishTexture = 0.78 + 0.22 * Math.abs(Math.sin(b * 4.1));
        totalPeak = Math.max(totalPeak, Math.min(0.99, whooshEnv * swishTexture));
      }
    }

    peaks[b] = Math.min(0.99, Math.max(0.12, totalPeak));
    rms[b] = peaks[b] * 0.62;
  }

  return {
    peaks,
    rms,
    sampleCount: bucketCount,
    duration: safeDur,
  };
}
