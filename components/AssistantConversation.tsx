import React, { useState, useRef, useEffect } from 'react';
import { LiveServerMessage, Session } from '@google/genai';
import { liveConversationService } from '../services/geminiService';
import Icon from './common/Icon';

// --- AUDIO UTILITY FUNCTIONS ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
// --- END OF AUDIO UTILITY FUNCTIONS ---


type TranscriptionEntry = {
    speaker: 'Dziecko' | 'Iskra';
    text: string;
};

// Resamples an audio buffer from a source sample rate to a target sample rate.
function resampleBuffer(input: Float32Array, fromSampleRate: number, toSampleRate: number): Float32Array {
    if (fromSampleRate === toSampleRate) {
        return input;
    }

    const sampleRateRatio = fromSampleRate / toSampleRate;
    const newLength = Math.round(input.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        let accum = 0, count = 0;
        for (let i = offsetBuffer; i < nextOffsetBuffer && i < input.length; i++) {
            accum += input[i];
            count++;
        }
        result[offsetResult] = accum / count;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
    }
    return result;
}

const availableVoices = ['Zephyr', 'Kore', 'Puck'];
const smartPrompts = [
    "Opowiedz mi bajkę",
    "Pobawmy się w zgadywanki",
    "Zróbmy razem ćwiczenie oddechowe",
    "Zaśpiewajmy piosenkę"
];

const AssistantConversation: React.FC = () => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('Gotowy do rozmowy');
    const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);

    // Settings state
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState('Zephyr');
    const [volume, setVolume] = useState(1);

    const sessionPromiseRef = useRef<Promise<Session> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const outputGainNodeRef = useRef<GainNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    
    // Refs for transcription buffers
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    // Refs for audio queuing
    const activeSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const nextStartTimeRef = useRef(0);
    const isActiveRef = useRef(isActive);
    useEffect(() => {
        isActiveRef.current = isActive;
    }, [isActive]);


    // Update volume
    useEffect(() => {
        if (outputGainNodeRef.current) {
            outputGainNodeRef.current.gain.value = volume;
        }
    }, [volume]);
    
    // Auto-scroll transcription
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcription]);

    const resourceCleanup = () => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close()).catch(console.error);
            sessionPromiseRef.current = null;
        }

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().catch(console.error);
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(console.error);
        }
        
        for (const source of activeSourcesRef.current) {
            source.stop();
        }
        activeSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    };


    const cleanup = () => {
        resourceCleanup();
        setIsActive(false);
        setIsConnecting(false);
        setIsSpeaking(false);
        setStatus('Rozmowa zakończona');
    };

    const handleStart = async () => {
        setError('');
        setIsConnecting(true);
        setStatus('Łączenie...');
        setTranscription([]);
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Twoja przeglądarka nie wspiera dostępu do mikrofonu.');
            }
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const sourceSampleRate = inputAudioContextRef.current.sampleRate;
            const targetSampleRate = 16000;

            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputGainNodeRef.current = outputAudioContextRef.current.createGain();
            outputGainNodeRef.current.gain.value = volume;
            outputGainNodeRef.current.connect(outputAudioContextRef.current.destination);

            sessionPromiseRef.current = liveConversationService.connect({
                onopen: () => {
                    setIsConnecting(false);
                    setIsActive(true);
                    setStatus('Słucham...');

                    const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
                    processorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);

                    processorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const resampledData = resampleBuffer(inputData, sourceSampleRate, targetSampleRate);
                        const pcmBlob = liveConversationService.createAudioBlob(resampledData);
                        if (sessionPromiseRef.current) {
                            sessionPromiseRef.current.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        }
                    };
                    source.connect(processorRef.current);
                    processorRef.current.connect(inputAudioContextRef.current!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.outputTranscription) {
                        currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                    } else if (message.serverContent?.inputTranscription) {
                        currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                    }

                    if (message.serverContent?.turnComplete) {
                        const finalInput = currentInputTranscriptionRef.current.trim();
                        const finalOutput = currentOutputTranscriptionRef.current.trim();
                        
                        if (finalInput || finalOutput) {
                             setTranscription(prev => {
                                const newEntries: TranscriptionEntry[] = [];
                                if (finalInput) {
                                    newEntries.push({ speaker: 'Dziecko', text: finalInput });
                                }
                                if (finalOutput) {
                                    newEntries.push({ speaker: 'Iskra', text: finalOutput });
                                }
                                return [...prev, ...newEntries];
                            });
                        }

                        currentInputTranscriptionRef.current = '';
                        currentOutputTranscriptionRef.current = '';
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContextRef.current && outputGainNodeRef.current) {
                        setStatus('Iskra odpowiada...');
                        setIsSpeaking(true);

                        const audioContext = outputAudioContextRef.current;
                        const gainNode = outputGainNodeRef.current;
                        
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);

                        const audioBuffer = await decodeAudioData(
                            decode(base64Audio),
                            audioContext,
                            24000,
                            1,
                        );

                        const source = audioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(gainNode);

                        activeSourcesRef.current.add(source);
                        source.onended = () => {
                            activeSourcesRef.current.delete(source);
                            if (activeSourcesRef.current.size === 0) {
                                setIsSpeaking(false);
                                if (isActiveRef.current) {
                                    setStatus('Słucham...');
                                }
                            }
                        };
                        
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                    }

                    const interrupted = message.serverContent?.interrupted;
                    if (interrupted) {
                        for (const source of activeSourcesRef.current) {
                            source.stop();
                        }
                        activeSourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                        setIsSpeaking(false);
                        if (isActiveRef.current) {
                            setStatus('Słucham...');
                        }
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error(e);
                    setError('Wystąpił błąd połączenia.');
                    cleanup();
                },
                onclose: (e: CloseEvent) => {
                    cleanup();
                },
            }, selectedVoice);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Nie udało się uruchomić mikrofonu.');
            setIsConnecting(false);
        }
    };

    const handleStop = () => {
        cleanup();
    };
    
    useEffect(() => {
        return resourceCleanup;
    }, []);

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
            <div className="text-center flex-shrink-0">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Rozmowa z Asystentem</h2>
                <p className="text-slate-500 mb-4">Porozmawiaj z Iskrą, przyjaznym asystentem AI.</p>
            </div>
            
            {error && <p className="flex-shrink-0 text-red-600 bg-red-100 p-3 rounded-lg text-sm mb-4">{error}</p>}
            
            <div className="flex-1 bg-white p-4 rounded-2xl shadow-lg border border-slate-100 overflow-y-auto mb-4 min-h-0">
                <div className="space-y-4">
                    {transcription.length > 0 ? transcription.map((entry, index) => (
                        <div key={index} className={`flex items-end gap-3 ${entry.speaker === 'Dziecko' ? 'justify-end' : 'justify-start'}`}>
                           {entry.speaker === 'Iskra' && <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0"><Icon name="gemini-kids" /></div>}
                           <div className={`px-4 py-3 rounded-2xl max-w-sm ${entry.speaker === 'Dziecko' ? 'bg-sky-500 text-white rounded-br-none' : 'bg-slate-700 text-white rounded-bl-none'}`}>
                                <p className="text-sm">{entry.text}</p>
                           </div>
                        </div>
                    )) : <p className="text-center text-slate-400 h-full flex items-center justify-center">Transkrypcja rozmowy pojawi się tutaj...</p>}
                    <div ref={transcriptEndRef} />
                </div>
            </div>

            <div className="flex-shrink-0 px-4 mb-4">
                <h3 className="text-center text-sm font-bold text-slate-500 mb-2">Jak zacząć? Spróbuj powiedzieć:</h3>
                <div className="flex flex-wrap justify-center gap-2">
                    {smartPrompts.map(prompt => (
                        <span key={prompt} className="bg-slate-100 text-slate-700 text-sm px-3 py-1.5 rounded-full">
                            {prompt}
                        </span>
                    ))}
                </div>
            </div>
            
            <div className="flex-shrink-0 bg-white p-4 rounded-2xl shadow-lg border border-slate-100 relative">
                <div className="absolute top-2 right-2 z-20">
                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500" aria-label="Ustawienia">
                        <Icon name="settings" />
                    </button>
                </div>

                {isSettingsOpen && (
                    <div className="w-full mb-4 p-4 border-b border-slate-200">
                        <h4 className="text-md font-bold text-slate-700 mb-2 text-center">Ustawienia</h4>
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="voice-select" className="block text-sm font-medium text-slate-600">Głos asystenta</label>
                                <select 
                                    id="voice-select" 
                                    value={selectedVoice} 
                                    onChange={(e) => setSelectedVoice(e.target.value)} 
                                    disabled={isActive || isConnecting}
                                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white disabled:bg-slate-100"
                                >
                                    {availableVoices.map(voice => <option key={voice} value={voice}>{voice}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="volume-slider" className="block text-sm font-medium text-slate-600">Głośność: {Math.round(volume * 100)}%</label>
                                <input 
                                    type="range" 
                                    id="volume-slider" 
                                    min="0" 
                                    max="1" 
                                    step="0.01" 
                                    value={volume} 
                                    onChange={(e) => setVolume(parseFloat(e.target.value))} 
                                    className="w-full mt-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                                />
                            </div>
                        </div>
                    </div>
                )}
                 <div className="flex flex-col items-center">
                    <div className="relative w-24 h-24">
                        {isActive && !isSpeaking && (
                            <div className="absolute top-0 left-0 w-full h-full rounded-full bg-sky-400/50 animate-ping"></div>
                        )}
                        {isSpeaking && (
                            <div className="absolute top-0 left-0 w-full h-full rounded-full bg-teal-400/50 animate-pulse"></div>
                        )}
                        <button
                            onClick={isActive ? handleStop : handleStart}
                            disabled={isConnecting}
                            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition text-white shadow-lg ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-sky-500 hover:bg-sky-600'} disabled:bg-slate-400`}
                        >
                            {isConnecting ? (
                                 <svg className="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                 </svg>
                            )}
                        </button>
                    </div>
                     <p className="mt-3 text-slate-600 font-semibold h-5">{status}</p>
                 </div>
            </div>
        </div>
    );
};

export default AssistantConversation;
