import React, { useState, useRef, useEffect } from 'react';
import { analyzeSpeech } from '../services/geminiService';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';
import Icon from './common/Icon';
import { StructuredSpeechAnalysis } from '../types';

const AnalysisVisualizer: React.FC<{ analysis: StructuredSpeechAnalysis }> = ({ analysis }) => {
    const getValenceColor = (valence: StructuredSpeechAnalysis['emotionalValence']) => {
        switch (valence) {
            case 'Pozytywny': return { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' };
            case 'Neutralny': return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' };
            case 'Negatywny': return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
        }
    };

    const maxWords = 50; // Arbitrary max for visualization
    const wordCountPercentage = Math.min(100, (analysis.wordCount / maxWords) * 100);
    const valenceColors = getValenceColor(analysis.emotionalValence);

    return (
        <div className="space-y-6">
            {/* Section 1: Key Indicators */}
            <div>
                <h3 className="text-lg font-bold text-sky-700 mb-3 border-b pb-2">Kluczowe Wskaźniki</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    <div className={`p-4 rounded-lg border ${valenceColors.bg} ${valenceColors.border}`}>
                        <p className={`text-sm font-semibold ${valenceColors.text}`}>Walencja Emocjonalna</p>
                        <p className={`text-2xl font-bold mt-1 ${valenceColors.text}`}>{analysis.emotionalValence}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p className="text-sm font-semibold text-slate-600">Liczba słów</p>
                         <p className="text-2xl font-bold text-slate-800 mt-1">{analysis.wordCount}</p>
                        <div className="w-full bg-slate-200 rounded-full h-4 mt-2">
                            <div className="bg-sky-500 h-4 rounded-full transition-all" style={{ width: `${wordCountPercentage}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Content Analysis */}
            <div>
                 <h3 className="text-lg font-bold text-sky-700 mb-3 border-b pb-2">Analiza Treści</h3>
                 <div className="space-y-4 mt-3">
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="font-semibold text-sm text-slate-600">Próba transkrypcji:</p>
                        <p className="italic text-slate-800">"{analysis.transcriptionAttempt}"</p>
                    </div>
                     <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="font-semibold text-sm text-slate-600">Prawdopodobna intencja:</p>
                        <p className="text-slate-800">{analysis.probableIntent}</p>
                    </div>
                     <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="font-semibold text-sm text-slate-600">Opis tonu emocjonalnego:</p>
                        <p className="text-slate-800">{analysis.emotionalToneDescription}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="font-semibold text-sm text-slate-600">Kluczowe słowa:</p>
                         <div className="flex flex-wrap gap-2 mt-2">
                            {analysis.keywords.length > 0 ?
                                analysis.keywords.map((kw, i) => <span key={i} className="bg-sky-200 text-sky-800 text-sm font-semibold px-3 py-1 rounded-full">{kw}</span>) :
                                <span className="text-sm text-slate-500">Brak</span>
                            }
                        </div>
                    </div>
                 </div>
            </div>

            {/* Section 3: Suggestions */}
             <div>
                <h3 className="text-lg font-bold text-sky-700 mb-3 border-b pb-2">Propozycje dla Ciebie</h3>
                 <ul className="list-disc pl-5 space-y-2 text-slate-700 mt-3">
                    {analysis.suggestedResponses.map((resp, i) => <li key={i}>{resp}</li>)}
                </ul>
            </div>
        </div>
    );
};

interface Recording {
    id: number;
    blob: Blob;
    url: string;
    analysis?: StructuredSpeechAnalysis;
    isAnalyzing?: boolean;
}

const SpeechInterpreter: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [context, setContext] = useState('');
    const [combinedAnalysis, setCombinedAnalysis] = useState<StructuredSpeechAnalysis | null>(null);
    const [isLoadingAll, setIsLoadingAll] = useState(false);
    const [error, setError] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        // Clean up object URLs on unmount
        return () => {
            recordings.forEach(rec => URL.revokeObjectURL(rec.url));
        };
    }, [recordings]);

    const handleStartRecording = async () => {
        setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const newRecording: Recording = {
                    id: Date.now(),
                    blob,
                    url: URL.createObjectURL(blob),
                };
                setRecordings(prev => [...prev, newRecording]);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError('Nie można uzyskać dostępu do mikrofonu. Sprawdź uprawnienia w przeglądarce.');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };
    
    const handleAnalyzeIndividual = async (id: number) => {
        const recording = recordings.find(r => r.id === id);
        if (!recording || !context) {
            setError('Proszę opisać kontekst, aby przeprowadzić analizę.');
            return;
        }
        setError('');
        
        setRecordings(prev => prev.map(r => r.id === id ? { ...r, isAnalyzing: true } : r));
        
        try {
            const base64Audio = await blobToBase64(recording.blob);
            const result = await analyzeSpeech([{ base64Audio, mimeType: recording.blob.type }], context);
            const parsedResult = JSON.parse(result);
            if(parsedResult.error) {
                 setError(parsedResult.error);
                 setRecordings(prev => prev.map(r => r.id === id ? { ...r, analysis: undefined, isAnalyzing: false } : r));
            } else {
                 setRecordings(prev => prev.map(r => r.id === id ? { ...r, analysis: parsedResult, isAnalyzing: false } : r));
            }
           
        } catch (err) {
            setError('Wystąpił nieoczekiwany błąd podczas analizy.');
            setRecordings(prev => prev.map(r => r.id === id ? { ...r, isAnalyzing: false } : r));
        }
    };

    const handleAnalyzeAll = async () => {
        if (recordings.length < 1 || !context) {
            setError('Proszę nagrać co najmniej jeden klip i opisać kontekst.');
            return;
        }
        setError('');
        setIsLoadingAll(true);
        setCombinedAnalysis(null);

        try {
            const audioPayloads = await Promise.all(recordings.map(async (r) => ({
                base64Audio: await blobToBase64(r.blob),
                mimeType: r.blob.type
            })));
            const result = await analyzeSpeech(audioPayloads, context);
            const parsedResult = JSON.parse(result);
            if (parsedResult.error) {
                setError(parsedResult.error);
            } else {
                setCombinedAnalysis(parsedResult);
            }
        } catch (err) {
            setError('Wystąpił nieoczekiwany błąd podczas analizy.');
        } finally {
            setIsLoadingAll(false);
        }
    };
    
    const handleDeleteRecording = (id: number) => {
        const recordingToDelete = recordings.find(r => r.id === id);
        if (recordingToDelete) {
            URL.revokeObjectURL(recordingToDelete.url);
        }
        setRecordings(prev => prev.filter(r => r.id !== id));
    };


    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Tłumacz Mowy</h2>
            <p className="text-slate-500 mb-6">Nagraj jedną lub więcej wypowiedzi dziecka, aby lepiej zrozumieć jego intencje i emocje.</p>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-4">1. Nagraj wypowiedź</h3>
                    <div className="flex flex-col items-center">
                        <button
                            type="button"
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            className={`w-24 h-24 rounded-full flex items-center justify-center transition ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-sky-500 hover:bg-sky-600'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </button>
                        <p className="mt-3 text-slate-600 font-semibold">{isRecording ? 'Nagrywanie...' : 'Naciśnij, aby nagrywać'}</p>
                    </div>
                </div>

                {recordings.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                        <h3 className="text-lg font-bold text-sky-700 mb-4">Nagrane klipy</h3>
                        <div className="space-y-4">
                            {recordings.map((rec, index) => (
                                <div key={rec.id} className="bg-slate-50 p-3 rounded-lg">
                                    <p className="font-bold text-slate-700 mb-2">Nagranie #{index + 1}</p>
                                    <audio controls src={rec.url} className="w-full mb-2"></audio>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleAnalyzeIndividual(rec.id)}
                                            disabled={rec.isAnalyzing || isLoadingAll}
                                            className="flex-1 bg-sky-100 text-sky-700 font-semibold py-2 px-3 rounded-lg hover:bg-sky-200 transition text-sm flex items-center justify-center disabled:opacity-50"
                                        >
                                            {rec.isAnalyzing ? 'Analizuję...' : 'Analizuj ten klip'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRecording(rec.id)}
                                            className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 transition"
                                            aria-label="Usuń nagranie"
                                        >
                                            <Icon name="trash" />
                                        </button>
                                    </div>
                                     {rec.analysis && (
                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                            <AnalysisVisualizer analysis={rec.analysis} />
                                        </div>
                                     )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-4">2. Opisz kontekst</h3>
                    <ConfidentialDataWarning />
                    <textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Np. 'Syn powiedział to, wskazując na zabawkę na wysokiej półce.'"
                        className="w-full p-3 border border-slate-300 rounded-lg h-24 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                        required
                    />
                </div>

                {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error}</p>}

                {recordings.length > 0 && (
                    <button
                        type="button"
                        onClick={handleAnalyzeAll}
                        className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
                        disabled={isLoadingAll || recordings.some(r => r.isAnalyzing) || !context}
                    >
                        {isLoadingAll ? 'Analizuję...' : `Analizuj wszystkie (${recordings.length}) razem`}
                    </button>
                )}
            </div>

            {combinedAnalysis && (
                <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Łączna analiza wypowiedzi</h2>
                    <AnalysisVisualizer analysis={combinedAnalysis} />
                </div>
            )}
        </div>
    );
};

export default SpeechInterpreter;
