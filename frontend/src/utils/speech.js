export const speechUtil = {
  speak(text, lang = 'en-US') {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    if (lang === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (lang === 'kn') {
      utterance.lang = 'kn-IN';
    } else {
      utterance.lang = 'en-US';
    }

    window.speechSynthesis.speak(utterance);
  },

  announceVehicle(vehicle, lang = 'en') {
    const reg = vehicle.registration_number;
    const insStatus = vehicle.documents.insurance.status;
    const pucStatus = vehicle.documents.puc.status;
    const rcStatus = vehicle.documents.rc.status;
    const taxStatus = vehicle.documents.road_tax.status;

    let message = "";
    if (lang === 'hi') {
      message = `वाहन ${reg} पाया गया। `;
      if (insStatus === 'expired') message += `बीमा समाप्त है। `;
      if (pucStatus === 'expired') message += `प्रदूषण प्रमाण पत्र समाप्त है। `;
      if (taxStatus === 'pending') message += `सड़क कर लंबित है। `;
      if (insStatus === 'valid' && pucStatus === 'valid' && taxStatus === 'paid') message += `सभी दस्तावेज़ वैध हैं। `;
    } else if (lang === 'kn') {
      message = `ವಾಹನ ${reg} ಪತ್ತೆಯಾಗಿದೆ. `;
      if (insStatus === 'expired') message += `ವಿಮೆ ಅವಧಿ ಮುಗಿದಿದೆ. `;
      if (pucStatus === 'expired') message += `ಮಾಲಿನ್ಯ ಪ್ರಮಾಣಪತ್ರ ಅವಧಿ ಮುಗಿದಿದೆ. `;
      if (taxStatus === 'pending') message += `ರಸ್ತೆ ತೆರಿಗೆ ಬಾಕಿ ಇದೆ. `;
      if (insStatus === 'valid' && pucStatus === 'valid' && taxStatus === 'paid') message += `ಎಲ್ಲಾ ದಾಖಲೆಗಳು ಮಾನ್ಯವಾಗಿವೆ. `;
    } else {
      message = `Vehicle ${reg} verified. `;
      if (insStatus === 'expired') message += `Insurance expired. `;
      if (pucStatus === 'expired') message += `Pollution certificate expired. `;
      if (taxStatus === 'pending') message += `Road tax pending. `;
      if (insStatus === 'valid' && pucStatus === 'valid' && taxStatus === 'paid') message += `All documents valid. `;
    }

    this.speak(message, lang);
  },

  stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
};
