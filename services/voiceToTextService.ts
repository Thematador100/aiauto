// Voice-to-Text Service using Web Speech API
// Allows inspectors to dictate notes hands-free

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

class VoiceToTextService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResult: ((result: VoiceRecognitionResult) => void) | null = null;
  private onError: ((error: string) => void) | null = null;

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition() {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    
    // Configure recognition
    this.recognition.continuous = true; // Keep listening
    this.recognition.interimResults = true; // Get partial results
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Handle results
    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      if (this.onResult) {
        this.onResult({ transcript, confidence, isFinal });
      }
    };

    // Handle errors
    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (this.onError) {
        this.onError(event.error);
      }
    };

    // Handle end
    this.recognition.onend = () => {
      if (this.isListening) {
        // Restart if we're supposed to be listening
        this.recognition.start();
      }
    };
  }

  /**
   * Start listening for voice input
   */
  startListening(
    onResult: (result: VoiceRecognitionResult) => void,
    onError?: (error: string) => void
  ): boolean {
    if (!this.recognition) {
      if (onError) onError('Speech recognition not supported');
      return false;
    }

    if (this.isListening) {
      console.warn('Already listening');
      return false;
    }

    this.onResult = onResult;
    this.onError = onError || null;
    this.isListening = true;

    try {
      this.recognition.start();
      console.log('Voice recognition started');
      return true;
    } catch (error) {
      console.error('Failed to start recognition:', error);
      this.isListening = false;
      if (onError) onError('Failed to start recognition');
      return false;
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (!this.recognition || !this.isListening) {
      return;
    }

    this.isListening = false;
    this.recognition.stop();
    console.log('Voice recognition stopped');
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Check if speech recognition is supported
   */
  isSupported(): boolean {
    return this.recognition !== null;
  }

  /**
   * Convert audio file to text using OpenAI Whisper via backend proxy
   */
  async transcribeAudioFile(audioBlob: Blob): Promise<string> {
    try {
      const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud';
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const formData = new FormData();
      // Whisper accepts webm, mp4, mp3, wav, m4a
      const ext = audioBlob.type.includes('webm') ? 'webm' : 'wav';
      formData.append('audio', audioBlob, `recording.${ext}`);

      const response = await fetch(`${BACKEND_URL}/api/tts/transcribe`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Transcription failed');
      }

      const data = await response.json();
      return data.transcript || '';
    } catch (error: any) {
      console.error('Whisper transcription error:', error);
      throw new Error(error.message || 'Failed to transcribe audio');
    }
  }
}

export const voiceToTextService = new VoiceToTextService();
