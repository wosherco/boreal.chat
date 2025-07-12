import { browser } from "$app/environment";

export type RecordingState =
  | "idle"
  | "requesting-permission"
  | "recording"
  | "paused"
  | "processing"
  | "error";

export interface VolumeData {
  volume: number;
  timestamp: number;
}

export interface RecordingResult {
  audioBlob: Blob;
  duration: number;
  volumeData: VolumeData[];
  sampleRate: number;
  channels: number;
  bitDepth: "16" | "32f";
}

/**
 * A comprehensive voice message recording service with reactive state management.
 *
 * Features:
 * - Microphone permission management
 * - High-quality audio recording in WAV format
 * - Pause and resume recording functionality
 * - Real-time volume monitoring for visualization
 * - Svelte 5 runes for reactive state updates
 * - Comprehensive error handling
 *
 * @example
 * ```typescript
 * const voiceService = new VoiceMessageService();
 *
 * // Start recording
 * await voiceService.startRecording();
 *
 * // Pause recording
 * voiceService.pauseRecording();
 *
 * // Resume recording
 * voiceService.resumeRecording();
 *
 * // Access reactive state for UI updates
 * console.log('Recording:', voiceService.isRecording);
 * console.log('Paused:', voiceService.isPaused);
 * console.log('Volume levels:', voiceService.volumeLevels);
 *
 * // Stop and get result
 * const result = await voiceService.stopRecording();
 * ```
 */
export class VoiceMessageService {
  // Reactive state using Svelte 5 runes
  public state = $state<RecordingState>("idle");
  public isRecording = $state(false);
  public isPaused = $state(false);
  public currentVolume = $state(0);
  public volumeLevels = $state<number[]>([]);
  public duration = $state(0);
  public errorMessage = $state<string | null>(null);
  public hasPermission = $state(false);

  // Private properties
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private recordedChunks: Blob[] = [];
  private volumeData: VolumeData[] = [];
  private volumeInterval: number | null = null;
  private durationInterval: number | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private pauseStartTime: number = 0;

  /**
   * Creates a new VoiceMessageService instance.
   * Automatically checks for existing microphone permissions.
   */
  constructor() {
    // Check if we already have permission
    this.checkExistingPermission();
  }

  /**
   * Checks if microphone permission has already been granted.
   * @private
   */
  private async checkExistingPermission() {
    if (!browser) return;

    try {
      const permissions = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      this.hasPermission = permissions.state === "granted";
    } catch (error) {
      console.warn("Could not check microphone permission:", error);
    }
  }

  /**
   * Request microphone permission and prepare for recording.
   * @returns {Promise<boolean>} True if permission was granted, false otherwise
   * @example
   * ```typescript
   * const hasPermission = await voiceService.requestPermission();
   * if (hasPermission) {
   *   console.log('Ready to record!');
   * }
   * ```
   */
  public async requestPermission(): Promise<boolean> {
    if (this.state === "requesting-permission" || !browser) return false;

    this.state = "requesting-permission";
    this.errorMessage = null;

    try {
      // Request microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.hasPermission = true;
      this.state = "idle";
      return true;
    } catch (error) {
      this.hasPermission = false;
      this.state = "error";
      this.errorMessage = error instanceof Error ? error.message : "Failed to access microphone";
      return false;
    }
  }

  /**
   * Start recording audio. Automatically requests permission if not already granted.
   * @returns {Promise<boolean>} True if recording started successfully, false otherwise
   * @example
   * ```typescript
   * const started = await voiceService.startRecording();
   * if (started) {
   *   console.log('Recording started!');
   * }
   * ```
   */
  public async startRecording(): Promise<boolean> {
    if (this.isRecording || this.state === "recording" || !browser) return false;

    try {
      // Ensure we have permission and stream
      if (!this.audioStream) {
        const hasPermission = await this.requestPermission();
        if (!hasPermission) return false;
      }

      this.state = "recording";
      this.isRecording = true;
      this.recordedChunks = [];
      this.volumeData = [];
      this.volumeLevels.length = 0; // Clear the reactive array
      this.duration = 0;
      this.pausedTime = 0;
      this.pauseStartTime = 0;
      this.startTime = Date.now();
      this.errorMessage = null;

      // Setup audio context for volume analysis
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.source = this.audioContext.createMediaStreamSource(this.audioStream!);
      this.source.connect(this.analyser);

      // Setup MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.audioStream!, {
        mimeType: this.getSupportedMimeType(),
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms

      // Start volume monitoring
      this.startVolumeMonitoring();

      // Start duration tracking
      this.startDurationTracking();

      return true;
    } catch (error) {
      this.state = "error";
      this.isRecording = false;
      this.errorMessage = error instanceof Error ? error.message : "Failed to start recording";
      return false;
    }
  }

  /**
   * Stop recording and return the audio data including the audio blob and volume data.
   * @returns {Promise<RecordingResult | null>} Recording result with audio blob, duration, and volume data, or null if not recording
   * @example
   * ```typescript
   * const result = await voiceService.stopRecording();
   * if (result) {
   *   console.log('Duration:', result.duration);
   *   // Send result.audioBlob to speech-to-text service
   * }
   * ```
   */
  public async stopRecording(): Promise<RecordingResult | null> {
    if (!this.isRecording || !this.mediaRecorder || !browser) return null;

    this.state = "processing";
    this.isRecording = false;

    // Stop intervals
    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = async () => {
        try {
          // Create audio blob with the original format
          const audioBlob = new Blob(this.recordedChunks, {
            type: this.getSupportedMimeType(),
          });

          const result: RecordingResult = {
            audioBlob,
            duration: this.duration,
            volumeData: [...this.volumeData],
            sampleRate: this.audioStream!.getAudioTracks()[0].getSettings().sampleRate ?? 44100,
            channels: this.audioStream!.getAudioTracks()[0].getSettings().channelCount ?? 1,
            bitDepth: "16",
          };

          this.cleanup();

          resolve(result);
        } catch (error) {
          this.state = "error";
          this.errorMessage =
            error instanceof Error ? error.message : "Failed to process recording";
          this.cleanup();
          resolve(null);
        }
      };

      this.mediaRecorder!.stop();
    });
  }

  /**
   * Pause the current recording. Can be resumed later with resumeRecording().
   * @returns {boolean} True if recording was paused successfully, false if not recording
   * @example
   * ```typescript
   * if (voiceService.isRecording && !voiceService.isPaused) {
   *   voiceService.pauseRecording();
   * }
   * ```
   */
  public pauseRecording(): boolean {
    if (!this.isRecording || this.isPaused || !this.mediaRecorder || !browser) return false;

    try {
      this.mediaRecorder.pause();
      this.state = "paused";
      this.isPaused = true;
      this.pauseStartTime = Date.now();

      // Stop volume monitoring during pause
      if (this.volumeInterval) {
        clearInterval(this.volumeInterval);
        this.volumeInterval = null;
      }

      // Stop duration tracking during pause
      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = null;
      }

      this.currentVolume = 0;
      return true;
    } catch (error) {
      this.state = "error";
      this.errorMessage = error instanceof Error ? error.message : "Failed to pause recording";
      return false;
    }
  }

  /**
   * Resume a paused recording.
   * @returns {boolean} True if recording was resumed successfully, false if not paused
   * @example
   * ```typescript
   * if (voiceService.isPaused) {
   *   voiceService.resumeRecording();
   * }
   * ```
   */
  public resumeRecording(): boolean {
    if (!this.isRecording || !this.isPaused || !this.mediaRecorder || !browser) return false;

    try {
      this.mediaRecorder.resume();
      this.state = "recording";
      this.isPaused = false;

      // Add the paused time to total paused time
      this.pausedTime += Date.now() - this.pauseStartTime;
      this.pauseStartTime = 0;

      // Restart volume monitoring
      this.startVolumeMonitoring();

      // Restart duration tracking
      this.startDurationTracking();

      return true;
    } catch (error) {
      this.state = "error";
      this.errorMessage = error instanceof Error ? error.message : "Failed to resume recording";
      return false;
    }
  }

  /**
   * Cancel the current recording without saving any data.
   * Resets all state and cleans up resources.
   * @example
   * ```typescript
   * voiceService.cancelRecording();
   * ```
   */
  public cancelRecording(): void {
    if (!this.isRecording || !browser) return;

    this.isRecording = false;
    this.isPaused = false;
    this.state = "idle";
    this.currentVolume = 0;
    this.volumeLevels.length = 0;
    this.duration = 0;
    this.pausedTime = 0;
    this.pauseStartTime = 0;

    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    this.cleanup();
  }

  /**
   * Clean up all resources and stop any active recording.
   * Should be called when the service is no longer needed.
   * @example
   * ```typescript
   * // In component cleanup
   * voiceService.dispose();
   * ```
   */
  public dispose(): void {
    this.cancelRecording();
    this.hasPermission = false;
  }

  /**
   * Reset the service to its initial state.
   * Cancels any active recording and clears all data.
   * @example
   * ```typescript
   * voiceService.reset();
   * ```
   */
  public reset(): void {
    this.cancelRecording();
    this.state = "idle";
    this.isRecording = false;
    this.isPaused = false;
    this.currentVolume = 0;
    this.volumeLevels.length = 0;
    this.duration = 0;
    this.pausedTime = 0;
    this.pauseStartTime = 0;
    this.errorMessage = null;
  }

  /**
   * Starts monitoring volume levels and updates reactive state.
   * @private
   */
  private startVolumeMonitoring(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    this.volumeInterval = window.setInterval(() => {
      if (!this.analyser || !this.isRecording || this.isPaused) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Calculate RMS volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      const volume = Math.min(1, rms / 128); // Normalize to 0-1

      this.currentVolume = volume;
      this.volumeLevels.push(volume); // Add to reactive array for visualization

      // Calculate timestamp excluding paused time
      const currentTime = Date.now();
      const effectiveTimestamp = currentTime - this.startTime - this.pausedTime;

      this.volumeData.push({
        volume,
        timestamp: effectiveTimestamp,
      });
    }, 500); // Update every 500ms as requested
  }

  /**
   * Starts tracking the recording duration and updates reactive state.
   * @private
   */
  private startDurationTracking(): void {
    this.durationInterval = window.setInterval(() => {
      if (!this.isRecording || this.isPaused) return;
      // Calculate duration excluding paused time
      const currentPausedTime = this.isPaused
        ? this.pausedTime + (Date.now() - this.pauseStartTime)
        : this.pausedTime;
      this.duration = Date.now() - this.startTime - currentPausedTime;
    }, 100); // Update every 100ms for smooth duration display
  }

  /**
   * Determines the best supported MIME type for recording.
   * @private
   * @returns {string} The best supported MIME type for MediaRecorder
   */
  private getSupportedMimeType(): string {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return ""; // Fallback to default
  }

  /**
   * Cleans up audio resources and disconnects audio nodes.
   * @private
   */
  private cleanup(): void {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Stop audio stream tracks to remove browser recording indicator
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }

    this.analyser = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }
}
