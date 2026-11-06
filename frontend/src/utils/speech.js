/**
 * Utility for browser-based text-to-speech audio announcements
 * with specialized Indian vehicle registration plate phonetic formatting
 * and native Indian English / regional voice prioritization.
 */

let cachedVoices = [];
const PREFERRED_VOICE_KEY = 'roadguard_preferred_voice';

// Eagerly pre-populate voices when available in browser
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    try {
      const list = window.speechSynthesis.getVoices() || [];
      if (list.length > 0) {
        cachedVoices = list;
      }
    } catch (e) {
      console.warn('Unable to get speech synthesis voices', e);
    }
  };

  updateVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }
}

export const speechUtil = {
  /**
   * Retrieves all available voices from the browser
   */
  getVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return [];
    }
    const list = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices() || [];
    if (list.length > 0) cachedVoices = list;
    return list;
  },

  /**
   * Helper to check if a voice is Indian (English or regional)
   */
  isIndianVoice(voice) {
    if (!voice) return false;
    const lang = (voice.lang || '').toLowerCase().replace('_', '-');
    const name = (voice.name || '').toLowerCase();
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
      localStorage.setItem(PREFERRED_VOICE_KEY, voiceURI);
    } catch {
      // Ignore localStorage write errors
    }
  },

  /**
   * Automatically select the best Indian voice for the target language
   */
  findBestVoice(lang = 'en') {
    const voices = this.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. User explicitly selected voice
    const savedURI = this.getPreferredVoiceURI();
    if (savedURI) {
      const saved = voices.find((v) => v.voiceURI === savedURI || v.name === savedURI);
      if (saved) return saved;
    }

    // 2. Hindi language selected
    if (lang === 'hi') {
      const hiVoice =
        voices.find((v) => (v.name || '').includes('Madhur')) ||
        voices.find((v) => (v.name || '').includes('Swara')) ||
        voices.find((v) => (v.lang || '').toLowerCase().startsWith('hi'));
      if (hiVoice) return hiVoice;
    }

    // 3. Kannada language selected
    if (lang === 'kn') {
      const knVoice =
        voices.find((v) => (v.name || '').includes('Gagan')) ||
        voices.find((v) => (v.name || '').includes('Sapna')) ||
        voices.find((v) => (v.lang || '').toLowerCase().startsWith('kn'));
      if (knVoice) return knVoice;
    }

    // 4. Default: Indian English Voices in priority order
    // Microsoft Neerja (Natural Female Indian)
    // Microsoft Prabhat (Natural Male Indian)
    // Microsoft Heera (Female Indian)
    // Microsoft Ravi (Male Indian)
    // Google English (India) / Apple Veena / Rishi / generic en-IN
    const indianVoice =
      voices.find((v) => (v.name || '').includes('Neerja')) ||
      voices.find((v) => (v.name || '').includes('Prabhat')) ||
      voices.find((v) => (v.name || '').includes('Heera')) ||
      voices.find((v) => (v.name || '').includes('Ravi')) ||
      voices.find((v) => (v.lang || '').toLowerCase().replace('_', '-') === 'en-in') ||
      voices.find((v) => (v.name || '').toLowerCase().includes('india')) ||
      voices.find((v) => this.isIndianVoice(v));

    if (indianVoice) return indianVoice;

    // 5. Fallback to standard English voice
    return (
      voices.find((v) => (v.lang || '').toLowerCase().startsWith('en')) ||
      voices[0] ||
      null
    );
  },

  /**
   * Formats an alphanumeric Indian registration plate into a clear phonetic
   * representation so that Web Speech API pronounces every letter and digit distinctly
   * (e.g. "K. A., 0 1, A. B., 1 2 3 4" instead of "ka zero one...")
   */
  formatPlateForSpeech(plate, lang = 'en') {
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
  speak(text, lang = 'en') {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly measured rate for maximum clarity
    utterance.pitch = 1.0;

    // Set voice language tag
    if (lang === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (lang === 'kn') {
      utterance.lang = 'kn-IN';
    } else {
      utterance.lang = 'en-IN'; // Indian English voice preferred
    }

    // Explicitly attach best matching Indian voice
    try {
      const chosenVoice = this.findBestVoice(lang);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }
    } catch (e) {
      console.warn('Could not assign speech voice', e);
    }

    window.speechSynthesis.speak(utterance);
  },

  /**
   * Generates a clear, audible compliance report for field officers
   */
  announceVehicle(vehicle, lang = 'en') {
    if (!vehicle || !vehicle.registration_number) return;

    const rawPlate = vehicle.registration_number;
    const spokenPlate = this.formatPlateForSpeech(rawPlate, lang);

    const insStatus = vehicle.documents?.insurance?.status;
    const pucStatus = vehicle.documents?.puc?.status;
    const rcStatus = vehicle.documents?.rc?.status;
    const taxStatus = vehicle.documents?.road_tax?.status;

    let message = '';
    if (lang === 'hi') {
      message = `वाहन ${spokenPlate} पाया गया। `;
      if (rcStatus === 'expired') message += `आर. सी. पंजीकरण समाप्त है। `;
      if (insStatus === 'expired') message += `बीमा समाप्त है। `;
      if (pucStatus === 'expired') message += `प्रदूषण प्रमाण पत्र समाप्त है। `;
      if (taxStatus === 'pending') message += `सड़क कर लंबित है। `;
      if (
        insStatus === 'valid' &&
        pucStatus === 'valid' &&
        taxStatus === 'paid' &&
        rcStatus === 'valid'
      ) {
        message += `सभी दस्तावेज़ पूरी तरह वैध हैं। `;
      }
    } else if (lang === 'kn') {
      message = `ವಾಹನ ${spokenPlate} ಪರಿಶೀಲಿಸಲಾಗಿದೆ. `;
      if (rcStatus === 'expired') message += `ನೋಂದಣಿ ಪ್ರಮಾಣಪತ್ರ ಅವಧಿ ಮುಗಿದಿದೆ. `;
      if (insStatus === 'expired') message += `ವಿಮೆ ಅವಧಿ ಮುಗಿದಿದೆ. `;
      if (pucStatus === 'expired') message += `ಮಾಲಿನ್ಯ ಪ್ರಮಾಣಪತ್ರ ಅವಧಿ ಮುಗಿದಿದೆ. `;
      if (taxStatus === 'pending') message += `ರಸ್ತೆ ತೆರಿಗೆ ಬಾಕಿ ಇದೆ. `;
      if (
        insStatus === 'valid' &&
        pucStatus === 'valid' &&
        taxStatus === 'paid' &&
        rcStatus === 'valid'
      ) {
        message += `ಎಲ್ಲಾ ದಾಖಲೆಗಳು ಮಾನ್ಯವಾಗಿವೆ. `;
      }
    } else {
      message = `Vehicle ${spokenPlate} verified. `;
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
    }

    this.speak(message, lang);
  },

  stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
};
