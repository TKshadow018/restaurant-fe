/**
 * Voice notification utilities using Web Speech API (SpeechSynthesis)
 */

export class VoiceNotificationService {
  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.isEnabled = true;
    this.voice = null;
    this.rate = 0.9;
    this.pitch = 1.0;
    this.volume = 0.8;
    
    // Initialize voices with a delay to ensure they're loaded
    setTimeout(() => {
      this.initVoices();
    }, 100);
  }

  /**
   * Initialize and select the best voice
   */
  initVoices() {
    console.log('[VoiceService] Initializing voices...');
    
    const setVoice = () => {
      const voices = this.speechSynthesis.getVoices();
      console.log('[VoiceService] Available voices:', voices.length);
      
      if (voices.length === 0) {
        console.warn('[VoiceService] No voices available yet, retrying...');
        setTimeout(() => this.initVoices(), 500);
        return;
      }

      // Log all available voices for debugging
      voices.forEach((voice, index) => {
        console.log(`[VoiceService] Voice ${index}: ${voice.name} (${voice.lang})`);
      });
      
      // Simple voice selection - just pick first English voice (original working version)
      const englishVoice = voices.find(voice => 
        voice.lang.startsWith('en') && (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('samantha'))
      ) || voices.find(voice => 
        voice.lang.startsWith('en')
      ) || voices.find(voice =>
        voice.default
      ) || voices[0];
      
      if (englishVoice) {
        this.voice = englishVoice;
        console.log('[VoiceService] Selected voice:', englishVoice.name, englishVoice.lang);
      } else {
        console.error('[VoiceService] No suitable voice found');
      }
    };

    // Try to get voices immediately
    if (this.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      // Wait for voices to load
      this.speechSynthesis.addEventListener('voiceschanged', setVoice, { once: true });
      
      // Fallback: try again after a delay
      setTimeout(() => {
        if (!this.voice) {
          console.log('[VoiceService] Retrying voice initialization...');
          setVoice();
        }
      }, 1000);
    }
  }

  /**
   * Speak text with customizable options
   */
  speak(text, options = {}) {
    console.log('[VoiceService] Attempting to speak:', text);
    
    if (!this.isEnabled) {
      console.log('[VoiceService] Voice notifications disabled');
      return Promise.resolve();
    }
    
    if (!this.speechSynthesis) {
      console.error('[VoiceService] SpeechSynthesis not supported');
      return Promise.reject('SpeechSynthesis not supported');
    }

    return new Promise((resolve, reject) => {
      try {
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply settings
        if (this.voice) {
          utterance.voice = this.voice;
        }
        utterance.rate = options.rate || this.rate;
        utterance.pitch = options.pitch || this.pitch;
        utterance.volume = options.volume || this.volume;

        console.log('[VoiceService] Speech settings:', {
          voice: utterance.voice?.name,
          rate: utterance.rate,
          pitch: utterance.pitch,
          volume: utterance.volume
        });

        // Event handlers
        utterance.onstart = () => {
          console.log('[VoiceService] Speech started');
        };
        
        utterance.onend = () => {
          console.log('[VoiceService] Speech completed');
          resolve();
        };
        
        utterance.onerror = (error) => {
          console.error('[VoiceService] Speech error:', error);
          reject(error);
        };

        // Speak the text
        this.speechSynthesis.speak(utterance);
        
        // Fallback resolve after 10 seconds (in case onend doesn't fire)
        setTimeout(() => {
          resolve();
        }, 10000);
        
      } catch (error) {
        console.error('[VoiceService] Error in speak method:', error);
        reject(error);
      }
    });
  }

  /**
   * Create voice announcement for new order
   */
  async announceNewOrder(orderData, language = 'english') {
    console.log('[VoiceService] Creating order announcement...');
    
    const isSwedish = language === 'swedish';
    
    // Extract order details
    const customerName = orderData.userName || orderData.userEmail?.split('@')[0] || 'Customer';
    const totalAmount = orderData.finalTotal || 0;

    // Construct the announcement - simple: just customer name and amount
    let announcement;
    if (isSwedish) {
      announcement = `Ny beställning från ${customerName} för ${totalAmount} kronor.`;
    } else {
      announcement = `New order from ${customerName} for ${totalAmount} kronor.`;
    }

    console.log('[VoiceService] Announcement text:', announcement);
    
    try {
      await this.speak(announcement, { 
        rate: 0.8, // Slower for clarity
        pitch: 1.0,
        volume: 0.9 
      });
      console.log('[VoiceService] Order announcement completed');
    } catch (error) {
      console.error('[VoiceService] Order announcement failed:', error);
      throw error;
    }
  }

  /**
   * Quick test announcement
   */
  async testAnnouncement() {
    const testText = "This is a test notification. Voice notifications are working correctly.";
    console.log('[VoiceService] Testing voice with:', testText);
    
    try {
      await this.speak(testText);
      console.log('[VoiceService] Test announcement completed successfully');
      return true;
    } catch (error) {
      console.error('[VoiceService] Test announcement failed:', error);
      return false;
    }
  }

  /**
   * Quick order summary announcement
   */
  announceOrderSummary(orderData, language = 'english') {
    const isSwedish = language === 'swedish';
    const customerName = orderData.userName || 'Customer';
    const totalAmount = orderData.finalTotal || 0;
    
    const announcement = isSwedish 
      ? `Ny beställning från ${customerName}, ${totalAmount} kronor.`
      : `New order from ${customerName}, ${totalAmount} kronor.`;
    
    return this.speak(announcement, { rate: 1.0 });
  }

  /**
   * Enable/disable voice notifications
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.speechSynthesis.cancel();
    }
  }

  /**
   * Check if voice notifications are supported
   */
  isSupported() {
    return 'speechSynthesis' in window;
  }

  /**
   * Stop current speech
   */
  stop() {
    this.speechSynthesis.cancel();
  }

  /**
   * Set voice settings
   */
  setSettings(settings) {
    if (settings.rate !== undefined) this.rate = settings.rate;
    if (settings.pitch !== undefined) this.pitch = settings.pitch;
    if (settings.volume !== undefined) this.volume = settings.volume;
  }

  /**
   * Get available voices
   */
  getAvailableVoices() {
    return this.speechSynthesis.getVoices();
  }

  /**
   * Set specific voice by name
   */
  setVoice(voiceName) {
    const voices = this.speechSynthesis.getVoices();
    const selectedVoice = voices.find(voice => voice.name === voiceName);
    if (selectedVoice) {
      this.voice = selectedVoice;
    }
  }
}

// Export singleton instance
export const voiceNotificationService = new VoiceNotificationService();

// Export default
export default voiceNotificationService;
