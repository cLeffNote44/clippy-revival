/**
 * Voice Service - Speech-to-Text and Text-to-Speech
 * Uses Web Speech API (built into Chromium/Electron)
 */

class VoiceService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.voices = [];

    // Initialize speech recognition
    this.initRecognition();

    // Load voices
    this.loadVoices();

    // Wake word detection settings
    this.wakeWord = 'hey clippy';
    this.wakeWordEnabled = false;
  }

  initRecognition() {
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    console.log('Speech Recognition initialized');
  }

  loadVoices() {
    // Load available voices
    const loadVoicesCallback = () => {
      this.voices = this.synthesis.getVoices();
      console.log(`Loaded ${this.voices.length} voices`);
    };

    // Voices load asynchronously
    this.synthesis.onvoiceschanged = loadVoicesCallback;
    loadVoicesCallback();
  }

  /**
   * Start listening for speech input
   * @param {Object} options - Configuration options
   * @param {Function} options.onResult - Callback for final result
   * @param {Function} options.onInterim - Callback for interim results
   * @param {Function} options.onError - Callback for errors
   * @param {Function} options.onStart - Callback when listening starts
   * @param {Function} options.onEnd - Callback when listening ends
   */
  startListening(options = {}) {
    if (!this.recognition) {
      options.onError?.({ error: 'Speech recognition not supported' });
      return false;
    }

    if (this.isListening) {
      return false;
    }

    const {
      onResult,
      onInterim,
      onError,
      onStart,
      onEnd,
      continuous = false,
      lang = 'en-US'
    } = options;

    this.recognition.continuous = continuous;
    this.recognition.lang = lang;

    // Event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('Speech recognition started');
      onStart?.();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        onInterim?.(interimTranscript.trim());
      }

      if (finalTranscript) {
        const text = finalTranscript.trim();
        console.log('Speech recognized:', text);
        onResult?.(text);

        // Check for wake word
        if (this.wakeWordEnabled && text.toLowerCase().includes(this.wakeWord)) {
          this.onWakeWord?.(text);
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      onError?.(event);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('Speech recognition ended');
      onEnd?.();
    };

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start recognition:', error);
      onError?.({ error: error.message });
      return false;
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      return true;
    }
    return false;
  }

  /**
   * Speak text using Text-to-Speech
   * @param {string} text - Text to speak
   * @param {Object} options - Voice options
   * @returns {Promise} - Resolves when speech is complete
   */
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Apply options
      utterance.voice = this.getVoice(options.voice || 'default');
      utterance.rate = options.rate || 1.0;  // 0.1 to 10
      utterance.pitch = options.pitch || 1.0;  // 0 to 2
      utterance.volume = options.volume || 1.0;  // 0 to 1
      utterance.lang = options.lang || 'en-US';

      // Event handlers
      utterance.onend = () => {
        console.log('Speech finished');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        reject(event);
      };

      // Speak
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
      return true;
    }
    return false;
  }

  /**
   * Get voice by name or criteria
   * @param {string|Object} criteria - Voice name or search criteria
   * @returns {SpeechSynthesisVoice|null}
   */
  getVoice(criteria) {
    if (typeof criteria === 'string') {
      // Search by name
      if (criteria === 'default') {
        return this.voices[0] || null;
      }

      return this.voices.find(voice =>
        voice.name.toLowerCase().includes(criteria.toLowerCase())
      ) || this.voices[0] || null;
    }

    // Search by criteria object
    const { name, lang, gender } = criteria;

    return this.voices.find(voice => {
      if (name && !voice.name.toLowerCase().includes(name.toLowerCase())) {
        return false;
      }
      if (lang && !voice.lang.includes(lang)) {
        return false;
      }
      if (gender && !voice.name.toLowerCase().includes(gender.toLowerCase())) {
        return false;
      }
      return true;
    }) || this.voices[0] || null;
  }

  /**
   * Get list of available voices
   * @returns {Array} - Array of voice objects
   */
  getVoices() {
    return this.voices.map(voice => ({
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService,
      default: voice.default,
      voiceURI: voice.voiceURI
    }));
  }

  /**
   * Enable wake word detection
   * @param {string} wakeWord - Wake word phrase (e.g., "hey clippy")
   * @param {Function} callback - Callback when wake word is detected
   */
  enableWakeWord(wakeWord, callback) {
    this.wakeWord = wakeWord.toLowerCase();
    this.wakeWordEnabled = true;
    this.onWakeWord = callback;

    console.log(`Wake word enabled: "${wakeWord}"`);
  }

  /**
   * Disable wake word detection
   */
  disableWakeWord() {
    this.wakeWordEnabled = false;
    this.onWakeWord = null;
  }

  /**
   * Check if speech recognition is available
   */
  isRecognitionAvailable() {
    return this.recognition !== null;
  }

  /**
   * Check if speech synthesis is available
   */
  isSynthesisAvailable() {
    return this.synthesis !== null;
  }

  /**
   * Get current listening state
   */
  getIsListening() {
    return this.isListening;
  }
}

// Singleton instance
const voiceService = new VoiceService();

export default voiceService;
