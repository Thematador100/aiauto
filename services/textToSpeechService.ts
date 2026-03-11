// Text-to-Speech Service with natural-sounding AI voices
// Supports OpenAI TTS API and browser-based Web Speech API fallback

export interface TTSOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number; // 0.25 to 4.0
  model?: 'tts-1' | 'tts-1-hd'; // tts-1 is faster, tts-1-hd is higher quality
}

class TextToSpeechService {
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private browserSynthesis: SpeechSynthesis | null = null;

  constructor() {
    this.initializeBrowserTTS();
  }

  private initializeBrowserTTS() {
    if ('speechSynthesis' in window) {
      this.browserSynthesis = window.speechSynthesis;
    }
  }

  /**
   * Speak text using OpenAI TTS API (natural, high-quality voice)
   * Requires OPENAI_API_KEY in backend
   */
  async speakWithAPI(
    text: string,
    options: TTSOptions = {}
  ): Promise<boolean> {
    try {
      const { 
        voice = 'echo', // Natural male voice, clear and engaging
        speed = 1.0,
        model = 'tts-1' // Faster, good quality
      } = options;

      // Call backend API endpoint
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice,
          speed,
          model
        })
      });

      if (!response.ok) {
        throw new Error(`TTS API failed: ${response.statusText}`);
      }

      // Get audio blob from response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play audio
      return await this.playAudio(audioUrl);
    } catch (error) {
      console.error('[TTS] OpenAI TTS failed:', error);
      // Fallback to browser TTS
      return this.speakWithBrowser(text);
    }
  }

  /**
   * Speak text using browser's built-in speech synthesis (fallback)
   * Works offline but less natural sounding
   */
  speakWithBrowser(text: string, rate: number = 1.0): boolean {
    if (!this.browserSynthesis) {
      console.error('[TTS] Browser speech synthesis not supported');
      return false;
    }

    try {
      // Stop any ongoing speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to use a higher quality voice if available
      const voices = this.browserSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Enhanced') || 
        v.name.includes('Premium') ||
        v.name.includes('Google') ||
        v.lang.startsWith('en-')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      this.browserSynthesis.speak(utterance);
      this.isPlaying = true;

      utterance.onend = () => {
        this.isPlaying = false;
      };

      utterance.onerror = (event) => {
        console.error('[TTS] Browser TTS error:', event);
        this.isPlaying = false;
      };

      return true;
    } catch (error) {
      console.error('[TTS] Browser TTS failed:', error);
      return false;
    }
  }

  /**
   * Play audio from URL or blob
   */
  private async playAudio(audioUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Stop any currently playing audio
        this.stop();

        this.currentAudio = new Audio(audioUrl);
        this.isPlaying = true;

        this.currentAudio.onended = () => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl); // Clean up
          resolve(true);
        };

        this.currentAudio.onerror = (error) => {
          console.error('[TTS] Audio playback error:', error);
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          resolve(false);
        };

        this.currentAudio.play();
      } catch (error) {
        console.error('[TTS] Audio play failed:', error);
        this.isPlaying = false;
        resolve(false);
      }
    });
  }

  /**
   * Stop current speech
   */
  stop() {
    // Stop OpenAI TTS audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    // Stop browser TTS
    if (this.browserSynthesis) {
      this.browserSynthesis.cancel();
    }

    this.isPlaying = false;
  }

  /**
   * Check if currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get available browser voices
   */
  getBrowserVoices(): SpeechSynthesisVoice[] {
    if (!this.browserSynthesis) return [];
    return this.browserSynthesis.getVoices();
  }

  /**
   * Check if OpenAI TTS is available (requires API key)
   */
  async isOpenAITTSAvailable(): Promise<boolean> {
    try {
      const response = await fetch('/api/tts/check');
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const textToSpeechService = new TextToSpeechService();
export default textToSpeechService;
