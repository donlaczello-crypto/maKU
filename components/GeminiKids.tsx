
import React, { useState, useRef, useEffect } from 'react';
import { LiveServerMessage } from '@google/genai';
import { liveConversationService, analyzeConversationReport } from '../services/geminiService';
import { ConversationReport, ChildProfile, AssistantPersona } from '../types';
import { Icon } from './common/Icon';
import { useTranslation } from '../hooks/useTranslation';
import { cleanAndParseJson } from '../utils/jsonHelpers';

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
    speaker: 'child' | 'assistant';
    text: string;
};

const assistantPersonaMeta: Record<AssistantPersona, { name: string; defaultVoice: string; color: string; bgGradient: string; descKey: string }> = {
    'Friendly & Calm': { 
        name: 'Iskierka', 
        defaultVoice: 'Kore', 
        color: 'text-fuchsia-600', 
        bgGradient: 'from-pink-100 via-purple-100 to-indigo-100',
        descKey: 'persona_friendly_calm_desc' 
    },
    'Energetic & Playful': { 
        name: 'Ziuk', 
        defaultVoice: 'Puck', 
        color: 'text-sky-600', 
        bgGradient: 'from-sky-100 via-blue-100 to-cyan-100',
        descKey: 'persona_energetic_playful_desc' 
    },
    'Neutral': { 
        name: 'Asystent', 
        defaultVoice: 'Zephyr', 
        color: 'text-teal-600', 
        bgGradient: 'from-teal-50 via-emerald-50 to-slate-100',
        descKey: 'persona_neutral_desc' 
    },
};

// --- REDESIGNED AVATARS ---

const AvatarWrapper: React.FC<{ 
    isActive: boolean; 
    className?: string; 
    glowColorClass: string; 
    children: React.ReactNode 
}> = ({ isActive, className = "w-64 h-64", glowColorClass, children }) => {
    return (
        <div className={`relative flex items-center justify-center transition-all duration-700 ${isActive ? 'scale-100' : 'scale-90 opacity-80'} ${className}`}>
            <div className={`absolute inset-0 rounded-full blur-3xl opacity-30 ${glowColorClass} ${isActive ? 'animate-pulse' : ''}`}></div>
            {children}
        </div>
    );
};

const IskierkaAvatar: React.FC<{ isActive: boolean; isSpeaking: boolean; className?: string }> = ({ isActive, isSpeaking, className }) => {
    return (
        <AvatarWrapper isActive={isActive} className={className} glowColorClass="bg-fuchsia-300">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl z-10 overflow-visible">
                <defs>
                    <linearGradient id="iskierkaBody" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#f5d0fe" /> {/* Pink-200 */}
                        <stop offset="100%" stopColor="#d946ef" /> {/* Fuchsia-500 */}
                    </linearGradient>
                    <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur"/>
                        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                    </filter>
                </defs>

                <g className="animate-[bounce_3s_infinite]">
                    <g className="animate-[spin_8s_linear_infinite] origin-center">
                         <circle cx="30" cy="50" r="4" fill="#fde047" opacity="0.8" />
                         <circle cx="170" cy="60" r="3" fill="#fde047" opacity="0.6" />
                         <circle cx="160" cy="150" r="5" fill="#fde047" opacity="0.8" />
                         <circle cx="40" cy="140" r="3" fill="#fde047" opacity="0.6" />
                    </g>

                    <path 
                        d="M100,25 Q120,80 175,85 Q125,115 140,170 Q100,140 60,170 Q75,115 25,85 Q80,80 100,25 Z" 
                        fill="url(#iskierkaBody)" 
                        stroke="#fae8ff" 
                        strokeWidth="3" 
                        strokeLinejoin="round"
                    />

                    <g transform="translate(0, 15)">
                        <ellipse cx="80" cy="85" rx="8" ry="10" fill="#4a044e" />
                        <ellipse cx="120" cy="85" rx="8" ry="10" fill="#4a044e" />
                        <circle cx="83" cy="82" r="3" fill="white" />
                        <circle cx="123" cy="82" r="3" fill="white" />
                        
                        <circle cx="70" cy="100" r="7" fill="#fbcfe8" opacity="0.7" />
                        <circle cx="130" cy="100" r="7" fill="#fbcfe8" opacity="0.7" />

                        {isSpeaking ? (
                             <path d="M 92 105 Q 100 112 108 105" stroke="#4a044e" strokeWidth="3" strokeLinecap="round" fill="none" className="animate-[speaking-mouth_0.3s_ease-in-out_infinite]" />
                        ) : (
                             <path d="M 90 105 Q 100 115 110 105" stroke="#4a044e" strokeWidth="3" strokeLinecap="round" fill="none" />
                        )}
                    </g>
                </g>
            </svg>
        </AvatarWrapper>
    );
};

const ZiukAvatar: React.FC<{ isActive: boolean; isSpeaking: boolean; className?: string }> = ({ isActive, isSpeaking, className }) => {
    return (
        <AvatarWrapper isActive={isActive} className={className} glowColorClass="bg-sky-300">
             <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl z-10 overflow-visible">
                <defs>
                    <linearGradient id="ziukMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#bae6fd" /> {/* Sky-200 */}
                        <stop offset="100%" stopColor="#0ea5e9" /> {/* Sky-500 */}
                    </linearGradient>
                    <linearGradient id="ziukScreen" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                </defs>
                
                <g className="animate-[speaking-body_3s_ease-in-out_infinite]">
                    
                    <g className={isSpeaking ? "animate-[listening-antennae_0.5s_ease-in-out_infinite] origin-bottom" : ""}>
                        <line x1="100" y1="60" x2="100" y2="30" stroke="#0ea5e9" strokeWidth="4" />
                        <circle cx="100" cy="25" r="6" fill="#f97316" />
                    </g>

                    <rect x="50" y="60" width="100" height="90" rx="25" fill="url(#ziukMetal)" stroke="#e0f2fe" strokeWidth="3" />
                    
                    <path d="M 50 85 L 40 85 Q 35 85 35 95 L 35 115 Q 35 125 40 125 L 50 125 Z" fill="#f97316" />
                    <path d="M 150 85 L 160 85 Q 165 85 165 95 L 165 115 Q 165 125 160 125 L 150 125 Z" fill="#f97316" />

                    <rect x="60" y="75" width="80" height="55" rx="12" fill="url(#ziukScreen)" />

                    <g transform="translate(0, 5)">
                        {isSpeaking ? (
                             <>
                                <rect x="75" y="90" width="10" height="10" rx="2" fill="#38bdf8" className="animate-bounce" />
                                <rect x="115" y="90" width="10" height="10" rx="2" fill="#38bdf8" className="animate-bounce" style={{animationDelay: '0.1s'}} />
                             </>
                        ) : (
                            <>
                                <circle cx="80" cy="95" r="6" fill="#38bdf8" />
                                <circle cx="120" cy="95" r="6" fill="#38bdf8" />
                            </>
                        )}
                        
                        {isSpeaking ? (
                             <rect x="85" y="115" width="30" height="3" rx="1.5" fill="#38bdf8" className="animate-pulse" />
                        ) : (
                             <path d="M 88 115 Q 100 120 112 115" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" />
                        )}
                    </g>
                    
                    <path d="M 70 150 L 70 160 Q 100 170 130 160 L 130 150" fill="#64748b" />
                </g>
             </svg>
        </AvatarWrapper>
    );
};

const NeutralAvatar: React.FC<{ isActive: boolean; isSpeaking: boolean; className?: string }> = ({ isActive, isSpeaking, className }) => {
    return (
        <AvatarWrapper isActive={isActive} className={className} glowColorClass="bg-teal-200">
             <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl z-10">
                 <defs>
                    <linearGradient id="neutralBody" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f0fdf4" /> {/* Teal-50 */}
                        <stop offset="100%" stopColor="#ccfbf1" /> {/* Teal-100 */}
                    </linearGradient>
                 </defs>
                 
                 <g className="animate-[breathing_5s_ease-in-out_infinite]">
                    <path d="M100,30 
                             Q140,30 160,70 
                             Q180,110 150,150 
                             Q120,190 80,180 
                             Q40,170 30,130 
                             Q20,90 50,50 
                             Q70,30 100,30 Z" 
                          fill="url(#neutralBody)" stroke="#99f6e4" strokeWidth="3" />
                    
                    <g transform="translate(0, -5)">
                        <circle cx="75" cy="95" r="6" fill="#0d9488" />
                        <circle cx="125" cy="95" r="6" fill="#0d9488" />
                        
                        <path d="M 60 95 Q 75 110 90 95" stroke="#0d9488" strokeWidth="2" fill="none" opacity="0.5" />
                        <path d="M 110 95 Q 125 110 140 95" stroke="#0d9488" strokeWidth="2" fill="none" opacity="0.5" />
                        <line x1="90" y1="95" x2="110" y2="95" stroke="#0d9488" strokeWidth="2" opacity="0.5" />

                        {isSpeaking ? (
                            <circle cx="100" cy="130" r="8" fill="#0d9488" opacity="0.8" className="animate-ping" />
                        ) : (
                             <path d="M 85 125 Q 100 135 115 125" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" fill="none" />
                        )}
                    </g>
                 </g>
            </svg>
        </AvatarWrapper>
    );
};

const AvatarDisplay: React.FC<{ persona: AssistantPersona; isActive?: boolean; isSpeaking?: boolean; className?: string }> = ({ persona, isActive = true, isSpeaking = false, className }) => {
    switch (persona) {
        case 'Friendly & Calm': return <IskierkaAvatar isActive={isActive} isSpeaking={isSpeaking} className={className} />;
        case 'Energetic & Playful': return <ZiukAvatar isActive={isActive} isSpeaking={isSpeaking} className={className} />;
        default: return <NeutralAvatar isActive={isActive} isSpeaking={isSpeaking} className={className} />;
    }
};

// --- END REDESIGNED AVATARS ---


const ConversationReportView: React.FC<{
    report: Omit<ConversationReport, 'id' | 'date' | 'childProfileId' | 'assistantPersona'>;
    onNewConversation: () => void;
    onProfileChange: () => void;
}> = ({ report, onNewConversation, onProfileChange }) => {
    const { t } = useTranslation();
    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-1 text-center">{t('geminiKids.report_title')}</h2>
            <p className="text-slate-500 mb-6 text-center">{t('geminiKids.report_description')}</p>
            
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-2">{t('geminiKids.report_summary_title')}</h3>
                    <p className="text-slate-600">{report.summary}</p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-2">{t('geminiKids.report_emotional_tone_title')}</h3>
                    <p className="text-slate-600">{report.emotionalTone}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                        <h3 className="text-lg font-bold text-sky-700 mb-2">{t('geminiKids.report_key_themes_title')}</h3>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600">
                            {report.keyThemes.map((theme, i) => <li key={i}>{theme}</li>)}
                        </ul>
                    </div>
                     <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                        <h3 className="text-lg font-bold text-teal-700 mb-2">{t('geminiKids.report_positive_moments_title')}</h3>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600">
                            {report.positiveMoments.map((moment, i) => <li key={i}>{moment}</li>)}
                        </ul>
                    </div>
                </div>
                
                {report.potentialTriggers.length > 0 && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-lg">
                        <h3 className="text-lg font-bold text-amber-800 mb-2">{t('geminiKids.report_potential_triggers_title')}</h3>
                        <ul className="list-disc pl-5 space-y-1 text-amber-700">
                            {report.potentialTriggers.map((trigger, i) => <li key={i}>{trigger}</li>)}
                        </ul>
                    </div>
                )}
                
                 <div className="bg-teal-50 border-l-4 border-teal-400 p-6 rounded-r-lg">
                    <h3 className="text-lg font-bold text-teal-800 mb-2">{t('geminiKids.report_suggestions_title')}</h3>
                    <ul className="list-disc pl-5 space-y-1 text-teal-700">
                        {report.suggestionsForCaregiver.map((sug, i) => <li key={i}>{sug}</li>)}
                    </ul>
                </div>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
                 <button onClick={onNewConversation} className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition">
                    {t('geminiKids.new_conversation_button')}
                </button>
                 <button onClick={onProfileChange} className="w-full bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 transition">
                    {t('geminiKids.change_profile_button')}
                </button>
            </div>
        </div>
    );
};

interface GeminiKidsProps {
    onSaveReport: (report: Omit<ConversationReport, 'id' | 'date' | 'childProfileId' | 'assistantPersona'>, childProfileId: string | null, assistantPersona: AssistantPersona) => void;
}

export const GeminiKids: React.FC<GeminiKidsProps> = ({ onSaveReport }) => {
    const { t } = useTranslation();
    
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sessionRef = useRef<Promise<any> | null>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const conversationHistoryRef = useRef<TranscriptionEntry[]>([]);
    const currentInputRef = useRef('');
    const currentOutputRef = useRef('');

    const [view, setView] = useState<'profileSelection' | 'createProfile' | 'conversation' | 'report'>('profileSelection');
    const [childProfiles, setChildProfiles] = useState<ChildProfile[]>(() => {
        try {
             const savedProfiles = localStorage.getItem('mypoint_childProfiles');
             return savedProfiles ? JSON.parse(savedProfiles) : [];
        } catch (e) { return []; }
    });
    const [selectedChildProfile, setSelectedChildProfile] = useState<ChildProfile | null>(null);
    const [activeAssistantPersona, setActiveAssistantPersona] = useState<AssistantPersona>('Neutral');

    const [newProfilePersona, setNewProfilePersona] = useState<AssistantPersona>('Friendly & Calm');

    const [isConnecting, setIsConnecting] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState(t('geminiKids.status_ready'));
    const [generatedReport, setGeneratedReport] = useState<Omit<ConversationReport, 'id' | 'date' | 'childProfileId' | 'assistantPersona'> | null>(null);

    const [transcriptLines, setTranscriptLines] = useState<TranscriptionEntry[]>([]);
    const [interimInput, setInterimInput] = useState('');

    useEffect(() => {
        if (transcriptEndRef.current) {
            transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [transcriptLines, interimInput]);

    useEffect(() => {
        return () => {
            cleanupAudio();
            if (sessionRef.current) {
                sessionRef.current.then((session: any) => {
                    try { session.close(); } catch(e) { console.error(e); }
                });
            }
        };
    }, []);

    const handleCreateProfile = (profile: Omit<ChildProfile, 'id'>) => {
        const newProfile: ChildProfile = { ...profile, id: Date.now().toString() };
        const updatedProfiles = [...childProfiles, newProfile];
        setChildProfiles(updatedProfiles);
        localStorage.setItem('mypoint_childProfiles', JSON.stringify(updatedProfiles));
        setSelectedChildProfile(newProfile);
        setActiveAssistantPersona(newProfile.preferredAssistantPersona);
        setView('conversation');
    };

    const handleSelectProfile = (profile: ChildProfile) => {
        setSelectedChildProfile(profile);
        setActiveAssistantPersona(profile.preferredAssistantPersona);
        setView('conversation');
    };

    const handleGuestMode = () => {
        setSelectedChildProfile(null);
        setActiveAssistantPersona('Neutral');
        setView('conversation');
    };

    const cleanupAudio = async () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => {
                try { track.stop(); } catch(e) { console.error("Error stopping track:", e); }
            });
            mediaStreamRef.current = null;
        }

        if (inputAudioContextRef.current) {
            try {
                if (inputAudioContextRef.current.state !== 'closed') {
                    await inputAudioContextRef.current.close();
                }
            } catch (e) {
                console.error("Error closing input audio context:", e);
            }
            inputAudioContextRef.current = null;
        }

        if (audioContextRef.current) {
            try {
                if (audioContextRef.current.state !== 'closed') {
                    await audioContextRef.current.close();
                }
            } catch (e) {
                console.error("Error closing output audio context:", e);
            }
            audioContextRef.current = null;
        }

        sourcesRef.current.forEach(source => {
            try { source.stop(); } catch(e) {}
        });
        sourcesRef.current.clear();
    };

    const startConversation = async () => {
        if (isConnecting || isActive) return;

        await cleanupAudio(); 
        setError('');
        setIsConnecting(true);
        setStatus(t('geminiKids.status_connecting'));
        
        conversationHistoryRef.current = [];
        currentInputRef.current = '';
        currentOutputRef.current = '';
        setTranscriptLines([]);
        setInterimInput('');
        
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            
            // Init audio context
            const audioCtx = new AudioContextClass({ sampleRate: 24000 });
            audioContextRef.current = audioCtx;

            // CRITICAL FIX: Ensure audio context is running (resume if suspended by browser policy)
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }
            
            nextStartTimeRef.current = 0;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            
            inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            
            const sessionPromise = liveConversationService.connect({
                onopen: () => {
                    console.log('Connected to Gemini Live');
                    setStatus(t('geminiKids.status_listening'));
                    setIsActive(true);
                    setIsConnecting(false);
                    
                    if (inputAudioContextRef.current) {
                        const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            if (!inputAudioContextRef.current || inputAudioContextRef.current.state === 'closed') return;

                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = liveConversationService.createAudioBlob(inputData);
                            
                            sessionPromise.then((session) => {
                               if (session && sessionRef.current === sessionPromise) {
                                   try {
                                       session.sendRealtimeInput({ media: pcmBlob });
                                   } catch (sendError) {
                                       console.error("Error sending audio input:", sendError);
                                   }
                               }
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current.destination);
                    }
                },
                onmessage: async (message: LiveServerMessage) => {
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio) {
                        setIsSpeaking(true);
                        setStatus(t('geminiKids.status_assistant_speaking', { name: assistantPersonaMeta[activeAssistantPersona].name }));
                        
                        if (audioContextRef.current && audioContextRef.current.state === 'running') {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                            const sourceNode = audioContextRef.current.createBufferSource();
                            sourceNode.buffer = audioBuffer;
                            sourceNode.connect(audioContextRef.current.destination);
                            sourceNode.addEventListener('ended', () => {
                                sourcesRef.current.delete(sourceNode);
                                if (sourcesRef.current.size === 0) {
                                    setIsSpeaking(false);
                                    setStatus(t('geminiKids.status_listening'));
                                }
                            });
                            sourceNode.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(sourceNode);
                        }
                    }

                    if (message.serverContent?.interrupted) {
                         sourcesRef.current.forEach(node => {
                            try { node.stop(); } catch (e) {}
                         });
                         sourcesRef.current.clear();
                         nextStartTimeRef.current = 0;
                         setIsSpeaking(false);
                         setStatus(t('geminiKids.status_listening'));
                    }
                    
                    if (message.serverContent?.inputTranscription?.text) {
                        const text = message.serverContent.inputTranscription.text;
                        currentInputRef.current += text;
                        setInterimInput(currentInputRef.current); 
                    }
                    if (message.serverContent?.outputTranscription?.text) {
                        const text = message.serverContent.outputTranscription.text;
                        currentOutputRef.current += text;
                    }
                    
                    if (message.serverContent?.turnComplete) {
                        if (currentInputRef.current.trim()) {
                            const text = currentInputRef.current.trim();
                            conversationHistoryRef.current.push({ speaker: 'child', text });
                            setTranscriptLines(prev => [...prev, { speaker: 'child', text }]); 
                            currentInputRef.current = '';
                            setInterimInput('');
                        }
                         if (currentOutputRef.current.trim()) {
                            const text = currentOutputRef.current.trim();
                            conversationHistoryRef.current.push({ speaker: 'assistant', text });
                            setTranscriptLines(prev => [...prev, { speaker: 'assistant', text }]); 
                            currentOutputRef.current = '';
                        }
                    }
                },
                onerror: (e: any) => {
                    console.error("Session Error:", e);
                    let errorMsg = t('geminiKids.error_connection');
                    
                    const rawError = e instanceof Error ? e.message : (e?.message || String(e));
                    if (rawError.includes('unavailable') || rawError.includes('503')) {
                        errorMsg = "Serwis jest chwilowo niedostępny. Proszę spróbować ponownie za chwilę.";
                    } else if (rawError.includes('aborted')) {
                         errorMsg = "Połączenie przerwane.";
                    }
                    
                    setError(errorMsg);
                    setIsActive(false);
                    setIsConnecting(false);
                    setIsSpeaking(false);
                    setStatus(t('geminiKids.status_ready'));
                    cleanupAudio();
                    sessionRef.current = null;
                },
                onclose: () => {
                    console.log("Session Closed");
                    setIsActive(false);
                    setIsConnecting(false);
                    setIsSpeaking(false);
                    setStatus(t('geminiKids.status_ready'));
                }
            }, selectedChildProfile, activeAssistantPersona);
            
            sessionRef.current = sessionPromise;
            
            sessionPromise.catch((err) => {
                 console.error("Connection failed:", err);
                 let errorMsg = t('geminiKids.error_connection');
                 const rawError = String(err);
                 if (rawError.includes('unavailable') || rawError.includes('503')) {
                     errorMsg = "Serwis jest chwilowo niedostępny. Proszę spróbować ponownie za chwilę.";
                 }
                 setError(errorMsg);
                 setIsActive(false);
                 setIsConnecting(false);
                 setStatus(t('geminiKids.status_ready'));
                 cleanupAudio();
                 sessionRef.current = null;
            });

        } catch (err) {
            console.error("Error starting conversation:", err);
            setError(t('geminiKids.error_microphone_start_failed'));
            setIsConnecting(false);
            cleanupAudio();
            sessionRef.current = null;
        }
    };

    const stopConversation = async () => {
        if (!isActive && !isConnecting) return;
        
        setStatus(t('geminiKids.status_ending_conversation'));
        await cleanupAudio();
        
        if (sessionRef.current) {
             sessionRef.current.then((session: any) => {
                try { session.close(); } catch(e) { console.error(e); }
             });
             sessionRef.current = null;
        }

        if (currentInputRef.current.trim()) {
            const text = currentInputRef.current.trim();
            conversationHistoryRef.current.push({ speaker: 'child', text });
            setTranscriptLines(prev => [...prev, { speaker: 'child', text }]);
        }
        if (currentOutputRef.current.trim()) {
            const text = currentOutputRef.current.trim();
            conversationHistoryRef.current.push({ speaker: 'assistant', text });
            setTranscriptLines(prev => [...prev, { speaker: 'assistant', text }]);
        }
        setInterimInput('');

        setIsActive(false);
        setIsSpeaking(false);
        setIsConnecting(false);

        if (conversationHistoryRef.current.length > 0) {
            setStatus(t('geminiKids.status_analyzing'));
            try {
                const transcriptText = conversationHistoryRef.current
                    .map(entry => `${entry.speaker === 'child' ? 'Dziecko' : 'Asystent'}: ${entry.text}`)
                    .join('\n');
                
                const report = await analyzeConversationReport(transcriptText, selectedChildProfile, activeAssistantPersona);
                const parsedReport = cleanAndParseJson<Omit<ConversationReport, 'id' | 'date' | 'childProfileId' | 'assistantPersona'>>(report);
                setGeneratedReport(parsedReport);
                onSaveReport(parsedReport, selectedChildProfile?.id || null, activeAssistantPersona);
                setView('report');
            } catch (err) {
                console.error("Report generation failed:", err);
                setError(t('geminiKids.error_report_generation'));
                setView('profileSelection');
            }
        } else {
             setStatus(t('geminiKids.status_ready'));
             if (error === '') {
                setError(t('geminiKids.status_report_no_content'));
             }
             if (!error) setView('profileSelection');
        }
    };

    if (view === 'profileSelection') {
        return (
            <div className="p-4 md:p-8 max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('geminiKids.profile_selection_title')}</h2>
                    <p className="text-slate-500">{t('geminiKids.profile_selection_description')}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {childProfiles.map(profile => (
                        <button 
                            key={profile.id} 
                            onClick={() => handleSelectProfile(profile)} 
                            className="relative group bg-white rounded-3xl shadow-lg border-2 border-slate-100 hover:border-sky-400 hover:shadow-xl transition-all duration-300 overflow-hidden p-6 flex flex-col items-center hover:-translate-y-1 text-center"
                        >
                            <div className="w-32 h-32 mb-4 transform group-hover:scale-110 transition-transform duration-500">
                                 <AvatarDisplay persona={profile.preferredAssistantPersona} isActive={true} isSpeaking={false} className="w-full h-full" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-1">{profile.name}</h3>
                            <p className="text-sm text-slate-500 mb-3">{profile.age} {t('geminiKids.profile_age_unit')}</p>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-700 transition-colors`}>
                                 {assistantPersonaMeta[profile.preferredAssistantPersona].name}
                            </span>
                        </button>
                    ))}
                    
                    <button onClick={() => setView('createProfile')} className="group bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50 transition-all duration-300 p-6 flex flex-col items-center justify-center min-h-[250px]">
                        <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors mb-4">
                            <Icon name="plus" className="w-8 h-8" />
                        </div>
                        <span className="font-bold text-slate-600 group-hover:text-sky-700">{t('geminiKids.create_new_profile_button')}</span>
                    </button>
                </div>
                
                 <div className="mt-8 flex justify-center">
                    <button onClick={handleGuestMode} className="text-slate-500 font-semibold hover:text-sky-600 hover:underline transition">
                        {t('geminiKids.guest_mode_title')}
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'createProfile') {
        return (
            <div className="p-4 md:p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">{t('geminiKids.create_new_profile_button')}</h2>
                <p className="text-slate-500 text-center mb-8">{t('geminiKids.create_profile_description')}</p>
                
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleCreateProfile({
                        name: formData.get('name') as string,
                        age: Number(formData.get('age')),
                        conditions: (formData.get('conditions') as string).split(',').map(s => s.trim()).filter(Boolean),
                        preferredAssistantPersona: newProfilePersona,
                    });
                }} className="space-y-6 bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">{t('geminiKids.profile_form_name_label')}</label>
                            <input name="name" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-transparent transition" placeholder={t('geminiKids.profile_form_name_placeholder')} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">{t('geminiKids.profile_form_age_label')}</label>
                            <input name="age" type="number" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-transparent transition" placeholder={t('geminiKids.profile_form_age_placeholder')} />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">{t('geminiKids.profile_form_conditions_label')}</label>
                        <input name="conditions" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-transparent transition" placeholder="ASD, ADHD, Lęk" />
                    </div>
                    
                    <div>
                        <label className="block text-lg font-bold text-slate-800 mb-4 text-center">Wybierz Towarzysza</label>
                        <div className="grid grid-cols-2 gap-6">
                            <div 
                                onClick={() => setNewProfilePersona('Friendly & Calm')}
                                className={`cursor-pointer rounded-3xl border-4 flex flex-col items-center justify-center transition-all duration-300 p-6 ${newProfilePersona === 'Friendly & Calm' ? 'border-fuchsia-400 bg-fuchsia-50 shadow-xl scale-105' : 'border-slate-200 bg-white hover:border-fuchsia-200 grayscale hover:grayscale-0'}`}
                            >
                                 <div className="w-32 h-32 mb-4">
                                    <AvatarDisplay persona="Friendly & Calm" isActive={true} isSpeaking={false} className="w-full h-full" />
                                 </div>
                                 <p className="text-xl font-bold text-fuchsia-600">Iskierka</p>
                                 <p className="text-sm text-slate-500 font-medium">(Dla dziewczynki)</p>
                            </div>

                            <div 
                                onClick={() => setNewProfilePersona('Energetic & Playful')}
                                className={`cursor-pointer rounded-3xl border-4 flex flex-col items-center justify-center transition-all duration-300 p-6 ${newProfilePersona === 'Energetic & Playful' ? 'border-sky-400 bg-sky-50 shadow-xl scale-105' : 'border-slate-200 bg-white hover:border-sky-200 grayscale hover:grayscale-0'}`}
                            >
                                 <div className="w-32 h-32 mb-4">
                                    <AvatarDisplay persona="Energetic & Playful" isActive={true} isSpeaking={false} className="w-full h-full" />
                                 </div>
                                 <p className="text-xl font-bold text-sky-600">Ziuk</p>
                                 <p className="text-sm text-slate-500 font-medium">(Dla chłopca)</p>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                             <button type="button" onClick={() => setNewProfilePersona('Neutral')} className={`text-sm px-4 py-2 rounded-full transition ${newProfilePersona === 'Neutral' ? 'bg-slate-200 text-slate-800 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
                                 Wolę neutralnego asystenta
                             </button>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setView('profileSelection')} className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition">Anuluj</button>
                        <button type="submit" className="flex-1 bg-sky-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-sky-700 hover:shadow-xl transition transform hover:-translate-y-0.5">{t('geminiKids.create_profile_button')}</button>
                    </div>
                </form>
            </div>
        );
    }

    if (view === 'report' && generatedReport) {
        return <ConversationReportView report={generatedReport} onNewConversation={() => setView('conversation')} onProfileChange={() => setView('profileSelection')} />;
    }

    const personaMeta = assistantPersonaMeta[activeAssistantPersona];
    
    return (
        <div className={`p-4 md:p-8 flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-b ${personaMeta.bgGradient}`}>
            <div className="relative w-72 h-72 flex items-center justify-center mb-8">
                <AvatarDisplay persona={activeAssistantPersona} isActive={isActive} isSpeaking={isSpeaking} className="w-full h-full z-10" />
            </div>

            <h2 className={`text-4xl font-bold mb-2 ${personaMeta.color} tracking-tight`}>{personaMeta.name}</h2>
            <p className="text-slate-500 mb-6 text-xl font-medium animate-pulse">{status}</p>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-3 rounded-xl mb-6 text-center max-w-md shadow-sm">{error}</div>}

            {!isActive ? (
                <button onClick={startConversation} disabled={isConnecting} className="w-full max-w-sm bg-white text-slate-800 font-bold py-5 px-8 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 transform flex items-center justify-center gap-4 text-xl group border-2 border-white/50">
                    <div className={`p-3 rounded-full text-white transition-transform group-hover:scale-110 ${activeAssistantPersona === 'Friendly & Calm' ? 'bg-fuchsia-500' : activeAssistantPersona === 'Energetic & Playful' ? 'bg-sky-500' : 'bg-teal-500'}`}>
                        <Icon name="microphone" className="w-6 h-6" />
                    </div>
                    {isConnecting ? t('geminiKids.status_connecting') : t('geminiKids.start_conversation_aria_label')}
                </button>
            ) : (
                <button onClick={stopConversation} className="w-full max-w-sm bg-white border-2 border-red-100 text-red-500 font-bold py-5 px-8 rounded-full shadow-lg hover:bg-red-50 hover:border-red-200 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-4 text-xl group">
                    <div className="bg-red-100 p-2 rounded-full group-hover:bg-red-200 transition-colors">
                        <Icon name="stop" className="w-6 h-6 text-red-500" />
                    </div>
                    {t('geminiKids.stop_conversation_aria_label')}
                </button>
            )}
            
            {isActive && (transcriptLines.length > 0 || interimInput) && (
                <div className="w-full max-w-md mt-8 bg-white/60 backdrop-blur-sm rounded-2xl p-4 h-48 overflow-y-auto border border-white/50 shadow-inner">
                    {transcriptLines.map((line, idx) => (
                        <div key={idx} className={`mb-2 text-sm ${line.speaker === 'child' ? 'text-right' : 'text-left'}`}>
                            <span className={`inline-block px-3 py-2 rounded-xl ${line.speaker === 'child' ? 'bg-sky-100 text-sky-800' : 'bg-white text-slate-700 border border-slate-200'}`}>
                                {line.text}
                            </span>
                        </div>
                    ))}
                    {interimInput && (
                         <div className="text-right mb-2 text-sm">
                            <span className="inline-block px-3 py-2 rounded-xl bg-sky-50 text-sky-400 italic border border-dashed border-sky-200">
                                {interimInput}...
                            </span>
                        </div>
                    )}
                    <div ref={transcriptEndRef} />
                </div>
            )}

            <button onClick={() => setView('profileSelection')} className="mt-12 text-slate-400 hover:text-sky-600 font-semibold text-sm transition-colors flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg