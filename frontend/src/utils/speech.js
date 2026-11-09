/**
 * Utility for browser-based text-to-speech audio announcements
 * with specialized Indian vehicle registration plate phonetic formatting
 * and native Indian English / regional voice prioritization.
 */

let cachedVoices = [];
let voicesInitialized = false;
const PREFERRED_VOICE_KEY = 'roadguard_preferred_voice';

// Cached voices loaded lazily upon request without top-level execution
export const speechUtil = {
  /**
   * Retrieves all available voices from the browser safely
   */
  getVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return [];
    }
    try {
      if (cachedVoices.length > 0) return cachedVoices;
      const list = window.speechSynthesis.getVoices();
      if (Array.isArray(list) && list.length > 0) {
        cachedVoices = list;
      }
      return cachedVoices;
    } catch {
      return [];
    }
  },

  /**
   * Helper to check if a voice is Indian (English or regional)
   */
  isIndianVoice(voice) {
    if (!voice || typeof voice !== 'object') return false;
    const lang = String(voice.lang || '').toLowerCase().replace('_', '-');
    const name = String(voice.name || '').toLowerCase();
    return (
      lang === 'en-in' ||
      lang.startsWith('hi') ||
      lang.startsWith('kn') ||
      lang.startsWith('ta') ||
      lang.startsWith('te') ||
      lang.startsWith('mr') ||
      name.includes('india') ||
      name.includes('neerja') ||
      name.includes('prabhat') ||
      name.includes('heera') ||
      name.includes('ravi') ||
      name.includes('madhur') ||
      name.includes('swara') ||
      name.includes('gagan') ||
      name.includes('sapna') ||
      name.includes('veena') ||
      name.includes('rishi') ||
      name.includes('lekha')
    );
  },

  /**
   * Get user's preferred voice URI from localStorage
   */
  getPreferredVoiceURI() {
    try {
      if (typeof window === 'undefined') return '';
      return localStorage.getItem(PREFERRED_VOICE_KEY) || '';
    } catch {
      return '';
    }
  },

  /**
   * Save user's preferred voice URI
   */
  setPreferredVoice(voiceURI) {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(PREFERRED_VOICE_KEY, voiceURI);
    } catch {
      // Ignore localStorage write errors
    }
  },

  /**
   * Automatically select the best Indian English voice
   */
  findBestVoice() {
    try {
      const voices = this.getVoices();
      if (!Array.isArray(voices) || voices.length === 0) return null;

      const validVoices = voices.filter((v) => v && typeof v === 'object');
      if (validVoices.length === 0) return null;

      // 1. User explicitly selected voice
      const savedURI = this.getPreferredVoiceURI();
      if (savedURI) {
        const saved = validVoices.find(
          (v) => (v.voiceURI && v.voiceURI === savedURI) || (v.name && v.name === savedURI)
        );
        if (saved) return saved;
      }

      // 2. Default: Indian English Voices in priority order
      // Microsoft Neerja (Natural Female Indian)
      // Microsoft Prabhat (Natural Male Indian)
      // Microsoft Heera (Female Indian)
      // Microsoft Ravi (Male Indian)
      // Google English (India) / Apple Veena / Rishi / generic en-IN
      const indianVoice =
        validVoices.find((v) => String(v.name || '').includes('Neerja')) ||
        validVoices.find((v) => String(v.name || '').includes('Prabhat')) ||
        validVoices.find((v) => String(v.name || '').includes('Heera')) ||
        validVoices.find((v) => String(v.name || '').includes('Ravi')) ||
        validVoices.find((v) => String(v.lang || '').toLowerCase().replace('_', '-') === 'en-in') ||
        validVoices.find((v) => String(v.name || '').toLowerCase().includes('india')) ||
        validVoices.find((v) => this.isIndianVoice(v));

      if (indianVoice) return indianVoice;

      // 3. Fallback to standard English voice
      return (
        validVoices.find((v) => String(v.lang || '').toLowerCase().startsWith('en')) ||
        validVoices[0] ||
        null
      );
    } catch (e) {
      console.warn('findBestVoice error:', e);
      return null;
    }
  },

  /**
   * Formats an alphanumeric Indian registration plate into a clear phonetic
   * representation so that Web Speech API pronounces every letter and digit distinctly
   * (e.g. "K. A., 0 1, A. B., 1 2 3 4" instead of "ka zero one...")
   */
  formatPlateForSpeech(plate) {
    if (!plate) return '';
    const clean = String(plate).toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Standard Indian plate: 2 letters (state), 1-2 digits (RTO), optional 1-3 letters (series), 1-4 digits
    // e.g. KA01AB1234, HR71H0003, DL04CC9999, KA53Z9000
    const stdMatch = clean.match(/^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{1,4})$/);
    if (stdMatch) {
      const state = stdMatch[1].split('').map((c) => `${c}.`).join(' ');
      const rto = stdMatch[2].split('').join(' ');
      const series = stdMatch[3] ? stdMatch[3].split('').map((c) => `${c}.`).join(' ') : '';
      const num = stdMatch[4].split('').join(' ');
      return [state, rto, series, num].filter(Boolean).join(', ');
    }

    // Bharat (BH) series: 2 digits (year), BH, 4 digits, 1-2 letters
    // e.g. 22BH9988AA
    const bhMatch = clean.match(/^(\d{2})(BH)(\d{4})([A-Z]{1,2})$/);
    if (bhMatch) {
      const yr = bhMatch[1].split('').join(' ');
      const bh = 'B. H.';
      const num = bhMatch[3].split('').join(' ');
      const series = bhMatch[4].split('').map((c) => `${c}.`).join(' ');
      return [yr, bh, num, series].join(', ');
    }

    // Generic fallback: format all letters with period and space digits
    return clean
      .split('')
      .map((c) => (/[A-Z]/.test(c) ? `${c}.` : c))
      .join(' ');
  },

  /**
   * Speak a text string using the browser's native SpeechSynthesis API
   */
  speak(text) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    try {
      // Cancel any previous speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly measured rate for maximum clarity
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN'; // Indian English voice preferred

      // Explicitly attach best matching Indian voice
      const chosenVoice = this.findBestVoice();
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  },

  /**
   * Generates a clear, audible compliance report for field officers
   */
  announceVehicle(vehicle) {
    if (!vehicle || !vehicle.registration_number) return;

    const rawPlate = vehicle.registration_number;
    const spokenPlate = this.formatPlateForSpeech(rawPlate);

    const insStatus = vehicle.documents?.insurance?.status;
    const pucStatus = vehicle.documents?.puc?.status;
    const rcStatus = vehicle.documents?.rc?.status;
    const taxStatus = vehicle.documents?.road_tax?.status;

    let message = `Vehicle ${spokenPlate} verified. `;
    if (rcStatus === 'expired') message += `Registration certificate expired. `;
    if (insStatus === 'expired') message += `Insurance expired. `;
    if (pucStatus === 'expired') message += `Pollution certificate expired. `;
    if (taxStatus === 'pending') message += `Road tax pending. `;
    if (
      insStatus === 'valid' &&
      pucStatus === 'valid' &&
      taxStatus === 'paid' &&
      rcStatus === 'valid'
    ) {
      message += `All documents are valid. `;
    }

    this.speak(message);
  },

  stop() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // Safe ignore
      }
    }
  }
};
