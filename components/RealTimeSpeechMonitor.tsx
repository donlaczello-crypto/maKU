
import React, { useState, useEffect, useRef } from 'react';
import { analyzeLiveSpeechChunk } from '../services/geminiService';
import { LiveSpeechAnalysis } from '../types';

// --- Local Interface Declarations for Web Speech API ---
// Defined locally to avoid global namespace conflicts with other components using the same API.

interface LocalSpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: LocalSpeechRecognitionEvent) => void;
    onerror: (event: LocalSpeechRecognitionErrorEvent) => void;
    onend: () => void;
}

interface LocalSpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: LocalSpeechRecognitionResultList;
}

interface LocalSpeechRecognitionResultList {
    readonly length: number;
    item(index: number): LocalSpeechRecognitionResult;
    [index: number]: LocalSpeechRecognitionResult;
}

interface LocalSpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): LocalSpeechRecognitionAlternative;
    [index: number]: LocalSpeechRecognitionAlternative;
}

interface LocalSpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface LocalSpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

const RealTimeSpeechMonitor: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [analysis, setAnalysis] = useState<Partial<LiveSpeechAnalysis>>({});
    const [keywordCounts, setKeywordCounts] = useState<Record<string, number>>({});
    const [repetitionCounts, setRepetitionCounts] = useState<Record<string, number>>({});
    const [emotionCounts, setEmotionCounts] = useState<Record<string, number>>({});
    const [error, setError] = useState('');
    
    const recognitionRef = useRef<LocalSpeechRecognition | null>(null);
    
    // Check for API support
    const isApiSupported = !!(typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));

    const analyzeFragment = async (chunkToAnalyze: string) => {
        if (!chunkToAnalyze) return;
        try {
            const result = await analyzeLiveSpeechChunk(chunkToAnalyze);
            if(result && result.trim() !== '{}') {
               const parsedResult: LiveSpeechAnalysis = JSON.parse(result);
               
               setAnalysis(prev => ({
                   ...prev,
                   emotionalValence: parsedResult.emotionalValence,
                   speechPace: parsedResult.speechPace,
                   isFragmented: parsedResult.isFragmented,
                   isTopicShift: parsedResult.isTopicShift,
                   wordCount: (prev.wordCount || 0) + (parsedResult.wordCount || chunkToAnalyze.split(' ').length),
                   questionCount: (prev.questionCount || 0) + (parsedResult.questionCount || 0),
               }));

               if (parsedResult.anxietyKeywords) {
                   setKeywordCounts(prevCounts => {
                       const newCounts = { ...prevCounts };
                       for (const keyword of parsedResult.anxietyKeywords) {
                           newCounts[keyword] = (newCounts[keyword] || 0) + 1;
                       }
                       return newCounts;
                   });
               }

               if (parsedResult.repetitions) {
                   setRepetitionCounts(prevCounts => {
                       const newCounts = { ...prevCounts };
                       for (const repetition of parsedResult.repetitions) {
                           newCounts[repetition] = (newCounts[repetition] || 0) + 1;
                       }
                       return newCounts;
                   });
               }

                if (parsedResult.detectedEmotions) {
                   setEmotionCounts(prevCounts => {
                       const newCounts = { ...prevCounts };
                       for (const emotion of parsedResult.detectedEmotions) {
                           newCounts[emotion] = (newCounts[emotion] || 0) + 1;
                       }
                       return newCounts;
                   });
               }
            }
        } catch (e) {
            console.error("Error parsing analysis result", e);
            setError('Wystąpił błąd podczas analizy danych.');
        }
    };

    useEffect(() => {
        if (!isApiSupported || !isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            return;
        }

        const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognitionConstructor() as unknown as LocalSpeechRecognition;
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pl-PL';

        recognition.onresult = (event: LocalSpeechRecognitionEvent) => {
            let finalTranscriptPart = '';
            let currentInterim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscriptPart += event.results[i][0].transcript;
                } else {
                    currentInterim += event.results[i][0].transcript;
                }
            }
            
            if (finalTranscriptPart) {
                const trimmedFinalPart = finalTranscriptPart.trim();
                setTranscript(prev => prev + ' ' + trimmedFinalPart);
                setInterimTranscript('');
                analyzeFragment(trimmedFinalPart);
            }
            
            setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event: LocalSpeechRecognitionErrorEvent) => {
            console.error("Speech recognition error", event.error);
            let errorMessage = 'Wystąpił nieznany błąd rozpoznawania mowy.';
            switch (event.error) {
                case 'not-allowed':
                    errorMessage = 'Brak dostępu do mikrofonu. Proszę sprawdzić uprawnienia przeglądarki.';
                    break;
                case 'no-speech':
                    errorMessage = 'Nie wykryto mowy. Proszę mówić głośniej lub wyraźniej.';
                    break;
                case 'aborted':
                    errorMessage = 'Rozpoznawanie mowy zostało przerwane.';
                    break;
                case 'network':
                    errorMessage = 'Błąd sieciowy podczas rozpoznawania mowy.';
                    break;
                case 'audio-capture':
                    errorMessage = 'Nie można przechwycić dźwięku z mikrofonu.';
                    break;
                case 'language-not-supported':
                    errorMessage = 'Język polski nie jest obsługiwany przez tę wersję API.';
                    break;
            }
            setError(errorMessage);
            setIsListening(false);
        };
        
        recognition.onend = () => {
            if (isListening) {
                try { recognition.start(); } catch(e) {} 
            }
        };

        recognitionRef.current = recognition;
        try {
            recognition.start(); 
        } catch(e) {
            console.error("Start error", e);
        }

        return () => {
            try { recognition.stop(); } catch(e) {}
        };
    }, [isListening, isApiSupported]);

    const handleToggleListening = () => {
        if (!isApiSupported) return;

        if (!isListening) {
            setTranscript('');
            setInterimTranscript('');
            setAnalysis({});
            setError('');
            setKeywordCounts({});
            setRepetitionCounts({});
            setEmotionCounts({});
        }
        setIsListening(prev => !prev);
    };
    
    if (!isApiSupported) {
        return (
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Monitor Mowy na Żywo</h2>
                <p className="text-slate-500 mb-6">Analizuj mowę w czasie rzeczywistym, aby wykrywać zmiany emocjonalne i poznawcze.</p>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-amber-200">
                    <h3 className="text-lg font-bold text-amber-700">Funkcja nieobsługiwana</h3>
                    <p className="text-slate-600 mt-2">
                        Twoja przeglądarka nie wspiera Web Speech API.
                    </p>
                </div>
            </div>
        );
    }
    
    const Indicator: React.FC<{ label: string; value: string | number | undefined; className?: string }> = ({ label, value, className }) => (
        <div className={`bg-slate-100 p-3 rounded-lg ${className}`}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-lg font-bold text-slate-800">{value ?? 'N/A'}</p>
        </div>
    );
    
    const ListIndicator: React.FC<{ label: string; items: Record<string, number> | undefined; className?: string }> = ({ label, items, className }) => (
        <div className={`bg-slate-100 p-3 rounded-lg ${className}`}>
            <p className="text-sm text-slate-500">{label}</p>
            {items && Object.keys(items).length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(items).map(([item, count]) => 
                        <span key={item} className="bg-red-200 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">{item} ({count})</span>
                    )}
                </div>
            ) : <p className="text-lg font-bold text-slate-800">Brak</p>}
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Monitor Mowy na Żywo</h2>
            <p className="text-slate-500 mb-6">Analizuj mowę w czasie rzeczywistym, aby wykrywać zmiany emocjonalne i poznawcze.</p>

            {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm mb-4">{error}</p>}
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-6">
                <div className="flex flex-col items-center text-center">
                    <button
                        onClick={handleToggleListening}
                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-sky-500 hover:bg-sky-600'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {isListening ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            )}
                        </svg>
                    </button>
                    <p className="mt-4 text-lg font-bold text-slate-700">
                        {isListening ? 'Analiza trwa...' : 'Naciśnij, aby rozpocząć analizę'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-64 flex flex-col">
                    <h3 className="text-lg font-bold text-sky-700 mb-2">Transkrypcja</h3>
                    <div className="flex-1 bg-slate-50 rounded-lg p-3 overflow-y-auto text-sm text-slate-700 font-medium border border-slate-200">
                        {transcript} <span className="text-slate-400 italic">{interimTranscript}</span>
                        {!transcript && !interimTranscript && <span className="text-slate-400 italic">Tutaj pojawi się tekst...</span>}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 space-y-4 overflow-y-auto h-64">
                    <h3 className="text-lg font-bold text-sky-700 mb-2">Wskaźniki</h3>
                    <Indicator label="Walencja emocjonalna" value={analysis.emotionalValence} className={analysis.emotionalValence === 'Negatywny' ? 'bg-red-50 border border-red-200' : ''} />
                    <Indicator label="Tempo mowy" value={analysis.speechPace} />
                    <div className="grid grid-cols-2 gap-4">
                         <Indicator label="Słowa" value={analysis.wordCount} />
                         <Indicator label="Pytania" value={analysis.questionCount} />
                    </div>
                    <div className="flex gap-2">
                        {analysis.isFragmented && <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full border border-amber-200">Fragmentaryczność</span>}
                        {analysis.isTopicShift && <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full border border-purple-200">Zmiana Tematu</span>}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 space-y-6">
                 <h3 className="text-lg font-bold text-sky-700">Szczegóły Analizy</h3>
                 <ListIndicator label="Słowa kluczowe (Lęk/Stres)" items={keywordCounts} className="border border-slate-200" />
                 <ListIndicator label="Wykryte Emocje" items={emotionCounts} className="border border-slate-200" />
                 <ListIndicator label="Powtórzenia/Echolalie" items={repetitionCounts} className="border border-slate-200" />
            </div>
        </div>
    );
};

export default RealTimeSpeechMonitor;
