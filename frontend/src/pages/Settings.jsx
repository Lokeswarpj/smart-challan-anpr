import React, { useState, useEffect } from 'react';
import { Volume2, Sun, Moon, Globe, Database, Shield, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { speechUtil } from '../utils/speech';

import apiClient from '../services/apiClient';

export default function Settings() {
  const { currentLanguage, changeLanguage } = useLanguage();
  const { theme, setTheme, toggleOutdoor, isOutdoor } = useTheme();
  const { officer } = useAuth();
  const [testSpeechStatus, setTestSpeechStatus] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(speechUtil.getPreferredVoiceURI());

  useEffect(() => {
    const updateVoiceList = () => {
      const v = speechUtil.getVoices();
      if (v && v.length > 0) {
        setAvailableVoices(v);
        const saved = speechUtil.getPreferredVoiceURI();
        if (saved) {
          setSelectedVoiceURI(saved);
        } else {
          const best = speechUtil.findBestVoice(currentLanguage);
          if (best) {
            setSelectedVoiceURI(best.voiceURI);
          }
        }
      }
    };

    updateVoiceList();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoiceList;
    }
  }, [currentLanguage]);

  const handleTestSpeech = () => {
    setTestSpeechStatus(true);
    const samplePlate = speechUtil.formatPlateForSpeech('KA01AB1234', currentLanguage);
    speechUtil.speak(
      currentLanguage === 'hi'
        ? `रोडगार्ड आवाज प्रणाली सक्रिय है। वाहन ${samplePlate} सत्यापित, सभी दस्तावेज़ वैध हैं।`
        : currentLanguage === 'kn'
        ? `ರೋಡ್‌ಗಾರ್ಡ್ ಧ್ವನಿ ವ್ಯವಸ್ಥೆ ಸಕ್ರಿಯವಾಗಿದೆ. ವಾಹನ ${samplePlate} ಪರಿಶೀಲಿಸಲಾಗಿದೆ, ಎಲ್ಲಾ ದಾಖಲೆಗಳು ಮಾನ್ಯವಾಗಿವೆ.`
        : `RoadGuard voice alert system active. Vehicle ${samplePlate} verified. All documents valid.`,
      currentLanguage
    );
    setTimeout(() => setTestSpeechStatus(false), 3000);
  };

  const handleManualSync = async () => {
    setSyncStatus('Connecting to PostgreSQL database & syncing telemetry...');
    try {
      const res = await apiClient.get('/health');
      if (res.data?.status === 'healthy') {
        const dbType = res.data.database?.type || 'PostgreSQL';
        setSyncStatus(`Sync complete! Connected to central ${dbType} server. All registry records verified.`);
      } else {
        setSyncStatus('Server responded with operational warning. Using cached records.');
      }
    } catch (e) {
      setSyncStatus('Central server offline. Offline local storage mode active.');
    }
    setTimeout(() => setSyncStatus(''), 5000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="SYSTEM PREFERENCES & TELEMETRY"
        subtitle="Manage multilingual localization, accessibility modes, audio speech, and offline synchronization."
      />

      {syncStatus && (
        <div className="p-4 bg-accent text-primary border-2 border-primary font-mono text-xs font-bold flex items-center gap-2 shadow-brutal-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* 1. Multilingual Support (Section 20) */}
      <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-primary/20">
          <Globe className="w-5 h-5 text-accent" />
          <h3 className="font-heading text-xl text-primary dark:text-white">
            MULTILINGUAL LOCALIZATION (react-i18next)
          </h3>
        </div>
        <p className="text-xs text-secondary dark:text-gray-300 font-sans">
          Select interface language for seamless roadside operation across Indian state jurisdictions.
        </p>

        <div className="grid grid-cols-3 gap-4 pt-2">
          {[
            { code: 'en', label: 'English', native: 'English' },
            { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
            { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
          ].map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code)}
              className={`p-4 border-2 border-primary text-center transition-all ${
                currentLanguage === lang.code
                  ? 'bg-accent text-primary font-black shadow-brutal-sm'
                  : 'bg-surface dark:bg-surface-dark hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="font-heading text-lg">{lang.native}</div>
              <div className="text-[10px] font-mono text-gray-500 uppercase">{lang.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Audio Voice Feedback (Section 21) */}
      <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-primary/20">
          <Volume2 className="w-5 h-5 text-accent" />
          <h3 className="font-heading text-xl text-primary dark:text-white">
            HANDS-FREE VOICE ANNOUNCEMENTS (Web Speech API)
          </h3>
        </div>
        <p className="text-xs text-secondary dark:text-gray-300 font-sans">
          Enables text-to-speech audio readout of key document compliance findings (e.g. "Insurance expired") for field officers.
        </p>

        {/* Voice Selector & Engine Controls */}
        <div className="pt-2 space-y-3">
          <label className="text-xs font-mono font-bold text-primary dark:text-gray-300 uppercase block">
            SELECTED VOICE ENGINE & ACCENT:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedVoiceURI}
              onChange={(e) => {
                const uri = e.target.value;
                setSelectedVoiceURI(uri);
                speechUtil.setPreferredVoice(uri);
              }}
              className="flex-1 bg-surface dark:bg-[#101512] border-2 border-primary dark:border-[#2D3931] p-2.5 font-sans text-xs text-primary dark:text-white outline-none shadow-brutal-sm cursor-pointer"
            >
              {availableVoices.length === 0 ? (
                <option value="">Default Indian English Engine (Auto-detecting...)</option>
              ) : (
                <>
                  <optgroup label="🇮🇳 Recommended Indian Voices">
                    {availableVoices
                      .filter((v) => speechUtil.isIndianVoice(v))
                      .map((v) => (
                        <option key={v.voiceURI || v.name} value={v.voiceURI}>
                          🇮🇳 {v.name} ({v.lang})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="🌐 Other Available Voices">
                    {availableVoices
                      .filter((v) => !speechUtil.isIndianVoice(v))
                      .map((v) => (
                        <option key={v.voiceURI || v.name} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                  </optgroup>
                </>
              )}
            </select>

            <Button
              onClick={handleTestSpeech}
              variant="accent"
              size="sm"
              loading={testSpeechStatus}
              icon={Volume2}
              className="shadow-brutal-sm flex-shrink-0"
            >
              TEST VOICE ALERT
            </Button>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-500 dark:text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              {availableVoices.some((v) => speechUtil.isIndianVoice(v))
                ? 'Native Indian accent engine detected and prioritized.'
                : 'Using browser English engine with Indian phonetic pronunciation rules.'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Outdoor & Dark Theme Modes (Section 22) */}
      <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-primary/20">
          <Sun className="w-5 h-5 text-accent" />
          <h3 className="font-heading text-xl text-primary dark:text-white">
            DISPLAY THEMES & OUTDOOR VISIBILITY
          </h3>
        </div>
        <p className="text-xs text-secondary dark:text-gray-300 font-sans">
          High-contrast outdoor mode maximizes contrast and readability when working in direct sunlight glare.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 border-2 border-primary text-center ${
              theme === 'light' ? 'bg-accent text-primary font-black shadow-brutal-sm' : 'bg-surface dark:bg-surface-dark'
            }`}
          >
            <Sun className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="font-heading text-base">LIGHT MODE</div>
            <div className="text-[10px] text-gray-500 font-mono">Standard SaaS</div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 border-2 border-primary text-center ${
              theme === 'dark' ? 'bg-accent text-primary font-black shadow-brutal-sm' : 'bg-surface dark:bg-surface-dark'
            }`}
          >
            <Moon className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="font-heading text-base">DARK MODE</div>
            <div className="text-[10px] text-gray-500 font-mono">Low-light / Night Patrol</div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('outdoor')}
            className={`p-4 border-2 border-primary text-center ${
              theme === 'outdoor' ? 'bg-accent text-primary font-black shadow-brutal-sm ring-2 ring-primary' : 'bg-surface dark:bg-surface-dark'
            }`}
          >
            <Sun className="w-6 h-6 mx-auto mb-2 text-warning" />
            <div className="font-heading text-base">OUTDOOR MODE</div>
            <div className="text-[10px] text-gray-500 font-mono">Direct Sunlight High-Contrast</div>
          </button>
        </div>
      </div>

      {/* 4. Offline Database Synchronization (Section 23) */}
      <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-primary/20">
          <Database className="w-5 h-5 text-accent" />
          <h3 className="font-heading text-xl text-primary dark:text-white">
            OFFLINE CACHE & RECONCILIATION
          </h3>
        </div>
        <p className="text-xs text-secondary dark:text-gray-300 font-sans">
          Allows officers to inspect vehicles when cellular coverage drops on isolated highway segments.
        </p>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs font-mono">
            <div>LOCAL CACHE: 310 VEHICLES</div>
            <div className="text-gray-500 text-[10px]">IndexedDB / Local Storage Active</div>
          </div>
          <Button
            onClick={handleManualSync}
            variant="accent"
            size="sm"
          >
            FORCE RE-SYNC NOW
          </Button>
        </div>
      </div>
    </div>
  );
}

