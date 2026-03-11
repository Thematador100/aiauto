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
   * Convert audio file to text (using external API)
   */
  async transcribeAudioFile(audioBlob: Blob): Promise<string> {
    // In production, this would use a service like:
    // - Google Speech-to-Text API
    // - AWS Transcribe
    // - Azure Speech Services
    // - OpenAI Whisper API

    // For now, return placeholder
    console.log('Audio file transcription not yet implemented');
    return 'Audio transcription coming soon...';
  }
}

export const voiceToTextService = new VoiceToTextService();
