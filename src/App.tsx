/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Globe, Mic, ChevronDown, Languages, Loader2, AlertCircle, Copy, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translateText, getTransliteration } from './services/sarvam';

// Country and Language Data
const countries = [
  { name: 'India', languages: ['Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi'] },
  { name: 'United States', languages: ['English', 'Spanish'] },
  { name: 'France', languages: ['French'] },
  { name: 'Germany', languages: ['German'] },
  { name: 'Spain', languages: ['Spanish', 'Catalan', 'Galician', 'Basque'] },
  { name: 'China', languages: ['Mandarin', 'Cantonese'] },
  { name: 'Japan', languages: ['Japanese'] },
  { name: 'South Korea', languages: ['Korean'] },
  { name: 'Italy', languages: ['Italian'] },
  { name: 'Brazil', languages: ['Portuguese'] },
  { name: 'Russia', languages: ['Russian'] },
  { name: 'United Kingdom', languages: ['English'] },
  { name: 'United Arab Emirates', languages: ['Arabic'] },
];

const languageCodes: Record<string, string> = {
  'Hindi': 'hi-IN',
  'Tamil': 'ta-IN',
  'Telugu': 'te-IN',
  'Kannada': 'kn-IN',
  'Malayalam': 'ml-IN',
  'Bengali': 'bn-IN',
  'Marathi': 'mr-IN',
  'Gujarati': 'gu-IN',
  'Punjabi': 'pa-IN',
  'English': 'en-US',
  'Spanish': 'es-ES',
  'French': 'fr-FR',
  'German': 'de-DE',
  'Mandarin': 'zh-CN',
  'Cantonese': 'zh-HK',
  'Japanese': 'ja-JP',
  'Korean': 'ko-KR',
  'Italian': 'it-IT',
  'Portuguese': 'pt-BR',
  'Russian': 'ru-RU',
  'Arabic': 'ar-SA',
};

export default function App() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [targetCountry, setTargetCountry] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');
  const [transliteration, setTransliteration] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslatingPronunciation, setIsTranslatingPronunciation] = useState(false);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showCountryList, setShowCountryList] = useState(false);
  const [showLanguageList, setShowLanguageList] = useState(false);
  const [showTargetCountryList, setShowTargetCountryList] = useState(false);
  const [showTargetLanguageList, setShowTargetLanguageList] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscription(transcript);
        handleTranslate(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setError('Speech recognition failed. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      setError('Speech recognition is not supported in this browser.');
    }
  }, []);

  // Update recognition language when source language changes
  useEffect(() => {
    if (recognitionRef.current && selectedLanguage) {
      recognitionRef.current.lang = languageCodes[selectedLanguage] || 'en-US';
    }
  }, [selectedLanguage]);

  const performTranslation = async (text: string, sourceLang: string, targetLang: string) => {
    if (!sourceLang || !targetLang) {
      setError('Please select both source and target languages first.');
      return;
    }

    setIsTranslating(true);
    setTransliteration('');
    setShowPronunciation(false);
    setError(null);
    try {
      const result = await translateText(text, sourceLang, targetLang);
      setTranslation(result);
      
      // Also get transliteration
      setIsTranslatingPronunciation(true);
      try {
        const pron = await getTransliteration(result, targetLang);
        setTransliteration(pron);
      } catch (pErr) {
        console.error('Pronunciation error:', pErr);
      } finally {
        setIsTranslatingPronunciation(false);
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslate = (text: string) => {
    if (selectedLanguage && targetLanguage) {
      performTranslation(text, selectedLanguage, targetLanguage);
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) return;
    if (!selectedLanguage) {
      setError('Please select a source language first.');
      return;
    }
    setTranscription('');
    setTranslation('');
    setError(null);
    setIsRecording(true);
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Start recording error:', err);
      setIsRecording(false);
      setError('Could not start microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Stop recording error:', err);
    }
    setIsRecording(false);
  };

  const handleCopy = () => {
    if (!transcription || !translation) return;
    let textToCopy = `${selectedLanguage}: ${transcription}\n${targetLanguage}: ${translation}`;
    if (transliteration) {
      textToCopy += `\n(Pronunciation: ${transliteration})`;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Copy failed:', err);
      setError('Failed to copy text.');
    });
  };

  const handleClear = () => {
    setTranscription('');
    setTranslation('');
    setTransliteration('');
    setShowPronunciation(false);
    setError(null);
    setIsCopied(false);
  };

  const selectCountry = (country: string) => {
    setSelectedCountry(country);
    setSelectedLanguage(null);
    setShowCountryList(false);
    setShowLanguageList(true);
  };

  const selectLanguage = (lang: string) => {
    setSelectedLanguage(lang);
    setShowLanguageList(false);
    if (transcription && targetLanguage) {
      performTranslation(transcription, lang, targetLanguage);
    }
  };

  const selectTargetCountry = (country: string) => {
    setTargetCountry(country);
    setTargetLanguage(null);
    setShowTargetCountryList(false);
    setShowTargetLanguageList(true);
  };

  const selectTargetLanguage = (lang: string) => {
    setTargetLanguage(lang);
    setShowTargetLanguageList(false);
    if (transcription && selectedLanguage) {
      performTranslation(transcription, selectedLanguage, lang);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-[24px] shadow-sm overflow-hidden border border-black/5">
        {/* Header */}
        <header className="p-6 border-bottom border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
              <Languages className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Voice Translator</h1>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </header>

        <main className="p-6 space-y-8">
          {/* Step 1: Select Source & Target Languages */}
          <section className="space-y-6">
            {/* Source Language Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest opacity-50 ml-1">Source Language (Select Country first)</label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowCountryList(!showCountryList)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#f0f0f0] rounded-xl hover:bg-[#e5e5e5] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 opacity-50" />
                      <span className="font-medium">{selectedCountry || 'Select Country'}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCountryList ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showCountryList && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-30 top-full left-0 right-0 mt-2 bg-white border border-black/5 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                      >
                        {countries.map((c) => (
                          <button
                            key={c.name}
                            onClick={() => selectCountry(c.name)}
                            className="w-full text-left px-4 py-3 hover:bg-[#f5f5f5] transition-colors border-b border-black/5 last:border-0"
                          >
                            {c.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative flex-1">
                  <button
                    disabled={!selectedCountry}
                    onClick={() => setShowLanguageList(!showLanguageList)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#f0f0f0] rounded-xl hover:bg-[#e5e5e5] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <Languages className="w-5 h-5 opacity-50" />
                      <span className="font-medium">{selectedLanguage || 'Select Language'}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showLanguageList ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showLanguageList && selectedCountry && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-30 top-full left-0 right-0 mt-2 bg-white border border-black/5 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                      >
                        {countries.find(c => c.name === selectedCountry)?.languages.map((lang) => (
                          <button
                            key={lang}
                            onClick={() => selectLanguage(lang)}
                            className="w-full text-left px-4 py-3 hover:bg-[#f5f5f5] transition-colors border-b border-black/5 last:border-0"
                          >
                            {lang}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Target Language Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest opacity-50 ml-1">Translate to which language?</label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowTargetCountryList(!showTargetCountryList)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#f0f0f0] rounded-xl hover:bg-[#e5e5e5] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 opacity-50" />
                      <span className="font-medium">{targetCountry || 'Select Target Country'}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showTargetCountryList ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showTargetCountryList && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-black/5 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                      >
                        {countries.map((c) => (
                          <button
                            key={c.name}
                            onClick={() => selectTargetCountry(c.name)}
                            className="w-full text-left px-4 py-3 hover:bg-[#f5f5f5] transition-colors border-b border-black/5 last:border-0"
                          >
                            {c.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative flex-1">
                  <button
                    disabled={!targetCountry}
                    onClick={() => setShowTargetLanguageList(!showTargetLanguageList)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#f0f0f0] rounded-xl hover:bg-[#e5e5e5] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <Languages className="w-5 h-5 opacity-50" />
                      <span className="font-medium">{targetLanguage || 'Select Target Language'}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showTargetLanguageList ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showTargetLanguageList && targetCountry && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-black/5 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                      >
                        {countries.find(c => c.name === targetCountry)?.languages.map((lang) => (
                          <button
                            key={lang}
                            onClick={() => selectTargetLanguage(lang)}
                            className="w-full text-left px-4 py-3 hover:bg-[#f5f5f5] transition-colors border-b border-black/5 last:border-0"
                          >
                            {lang}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Voice Input */}
          <section className="flex flex-col items-center gap-6">
            <div className="w-full p-6 bg-[#f9f9f9] rounded-2xl border border-black/5 min-h-[120px] flex flex-col justify-center">
              {transcription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-50">{selectedLanguage} (Original)</span>
                  </div>
                  <p className="text-lg text-center font-medium leading-relaxed">{transcription}</p>
                </div>
              ) : (
                <p className="text-center text-[#9e9e9e]">Your speech will appear here...</p>
              )}
            </div>

            <button
              disabled={!selectedLanguage}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-black hover:bg-[#333]'
              }`}
            >
              <Mic className="text-white w-8 h-8" />
            </button>
            <p className="text-sm text-[#9e9e9e] font-medium uppercase tracking-wider">
              {isRecording ? 'Listening...' : 'Hold to Speak'}
            </p>
          </section>

          {/* Step 3: Translation & Playback */}
          <AnimatePresence>
            {(isTranslating || translation) && (
              <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 pt-4 border-t border-black/5"
              >
                <div className="w-full p-6 bg-black text-white rounded-2xl shadow-lg relative overflow-hidden">
                  {isTranslating ? (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="font-medium">Translating...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-50">{targetLanguage} (Translated)</span>
                      </div>
                      <p className="text-2xl font-light leading-snug">{translation}</p>
                    </div>
                  )}

                  {/* Pronunciation Section */}
                  <AnimatePresence>
                    {translation && !isTranslating && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-4 pt-4 border-t border-white/10"
                      >
                        <button
                          onClick={() => setShowPronunciation(!showPronunciation)}
                          className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity flex items-center gap-2"
                        >
                          {showPronunciation ? 'Hide Pronunciation' : 'Read it in other language with English letters'}
                        </button>
                        
                        <AnimatePresence>
                          {showPronunciation && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="mt-2"
                            >
                              {isTranslatingPronunciation ? (
                                <div className="flex items-center gap-2 opacity-50">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span className="text-sm italic">Generating pronunciation...</span>
                                </div>
                              ) : (
                                <p className="text-lg font-medium text-emerald-400 italic">
                                  "{transliteration}"
                                </p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Decorative background element */}
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Action Buttons */}
                {!isTranslating && translation && (
                  <div className="flex gap-3">
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleCopy}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-black/10 rounded-xl hover:bg-[#f9f9f9] transition-all shadow-sm active:scale-[0.98]"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-semibold text-green-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="text-sm font-semibold">Copy Both</span>
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleClear}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-black/10 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all shadow-sm active:scale-[0.98]"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-semibold">Clear All</span>
                    </motion.button>
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </main>

        <footer className="p-6 bg-[#f9f9f9] border-t border-black/5 text-center">
          <p className="text-xs text-[#9e9e9e] font-medium uppercase tracking-widest">
            Powered by iniyan.talkies
          </p>
        </footer>
      </div>
    </div>
  );
}
