import React, { useState, useEffect, useRef } from 'react';
import { analyzeLiveSpeechChunk } from '../services/geminiService';
import { LiveSpeechAnalysis } from '../types';

// Add types for Web Speech API to resolve TypeScript errors.
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
}

interface SpeechRecognitionStatic {
    new(): SpeechRecognition;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionStatic;
        webkitSpeechRecognition: SpeechRecognitionStatic;
    }
}

const RealTimeSpeechMonitor: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [analysis, setAnalysis] = useState<Partial<LiveSpeechAnalysis>>({});
    const [error, setError] = useState('');
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const analysisIntervalRef = useRef<number | null>(null);
    const transcriptChunkRef = useRef('');

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Twoja przeglądarka nie wspiera Web Speech API. Spróbuj użyć Google Chrome.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pl-PL';

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let currentInterim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    currentInterim += event.results[i][0].transcript;
                }
            }
            
            if (finalTranscript) {
                setTranscript(prev => prev + finalTranscript);
                transcriptChunkRef.current += finalTranscript;
                setInterimTranscript('');
            } else {
                setInterimTranscript(currentInterim);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setError(`Błąd rozpoznawania mowy: ${event.error}`);
            setIsListening(false);
        };
        
        recognition.onend = () => {
            if (isListening) {
                recognition.start(); // Keep listening if it stops unexpectedly
            }
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
            if (analysisIntervalRef.current) {
                clearInterval(analysisIntervalRef.current);
            }
        };
    }, [isListening]);

    const handleToggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
        } else {
            setTranscript('');
            setInterimTranscript('');
            transcriptChunkRef.current = '';
            setAnalysis({});
            setError('');
            recognitionRef.current?.start();
            analysisIntervalRef.current = window.setInterval(async () => {
                if (transcriptChunkRef.current.trim().length > 0) {
                    const chunkToAnalyze = transcriptChunkRef.current;
                    transcriptChunkRef.current = '';
                    try {
                        const result = await analyzeLiveSpeechChunk(chunkToAnalyze);
                        if(result && result.trim() !== '{}') {
                           const parsedResult: LiveSpeechAnalysis = JSON.parse(result);
                           setAnalysis(prev => {
                               const newKeywords = [...new Set([...(prev.anxietyKeywords || []), ...(parsedResult.anxietyKeywords || [])])];
                               const newRepetitions = [...new Set([...(prev.repetitions || []), ...(parsedResult.repetitions || [])])];
                               return {
                                   ...prev,
                                   ...parsedResult,
                                   wordCount: (prev.wordCount || 0) + (parsedResult.wordCount || chunkToAnalyze.split(' ').length),
                                   questionCount: (prev.questionCount || 0) + (parsedResult.questionCount || 0),
                                   anxietyKeywords: newKeywords,
                                   repetitions: newRepetitions
                               };
                           });
                        }
                    } catch (e) {
                        console.error("Error parsing analysis result", e);
                        setError('Wystąpił błąd podczas analizy danych.');
                    }
                }
            }, 5000); // Analyze every 5 seconds
        }
        setIsListening(!isListening);
    };
    
    const Indicator: React.FC<{ label: string; value: string | number | undefined; className?: string }> = ({ label, value, className }) => (
        <div className={`bg-slate-100 p-3 rounded-lg ${className}`}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-lg font-bold text-slate-800">{value ?? 'N/A'}</p>
        </div>
    );
    
    const ListIndicator: React.FC<{ label: string; items: string[] | undefined; className?: string }> = ({ label, items, className }) => (
        <div className={`bg-slate-100 p-3 rounded-lg ${className}`}>
            <p className="text-sm text-slate-500">{label}</p>
            {items && items.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                    {items.map((item, index) => <span key={index} className="bg-red-200 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">{item}</span>)}
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
                <div className="flex flex-col items-center">
                    <button
                        onClick={handleToggleListening}
                        className={`w-24 h-24 rounded-full flex items-center justify-center transition ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-sky-500 hover:bg-sky-600'}`}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 text-white ${isListening ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                         </svg>
                    </button>
                    <p className="mt-3 text-slate-600 font-semibold text-lg">{isListening ? 'Słucham...' : 'Rozpocznij monitorowanie'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Transcript */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                     <h3 className="text-lg font-bold text-sky-700 mb-4">Transkrypcja na Żywo</h3>
                     <div className="w-full h-48 bg-slate-50 rounded-lg p-3 overflow-y-auto border border-slate-200">
                        <p className="text-slate-700 whitespace-pre-wrap">
                            {transcript}
                            <span className="text-slate-400">{interimTranscript}</span>
                        </p>
                     </div>
                </div>

                {/* Cognitive Indicators */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-4">Wskaźniki Poznawcze</h3>
                    <div className="grid grid-cols-2 gap-3">
                       <Indicator label="Walencja Emocjonalna" value={analysis.emotionalValence} />
                       <Indicator label="Liczba Słów" value={analysis.wordCount} />
                       <Indicator label="Liczba Pytań" value={analysis.questionCount} />
                       <Indicator label="Powtórzenia (echolalia)" value={analysis.repetitions?.length || 0} />
                    </div>
                </div>
                
                 {/* Emotional Threat Indicators */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-amber-300">
                    <h3 className="text-lg font-bold text-amber-700 mb-4">Wskaźniki Emocjonalnego Zagrożenia (Trauma/Lęk)</h3>
                     <div className="grid grid-cols-1 gap-3">
                       <Indicator label="Tempo i Ton Mowy" value={analysis.speechPace} />
                       <ListIndicator label="Słowa Kluczowe (Lęk/Zagrożenie)" items={analysis.anxietyKeywords} />
                       <Indicator label="Fragmentacja Mowy" value={analysis.isFragmented ? 'Wykryto' : 'Brak'} />
                       <Indicator label="Nagłe Zmiany Tematu" value={analysis.isTopicShift ? 'Wykryto' : 'Brak'} />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default RealTimeSpeechMonitor;