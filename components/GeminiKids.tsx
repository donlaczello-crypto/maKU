
import React, { useState, useRef, useEffect } from 'react';
import { getGeminiKidsMultimodalResponse, generateSpeech } from '../services/geminiService';
import { ChildProfile } from '../types';
import Icon from './common/Icon';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';

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

type Message = {
    role: 'user' | 'model';
    text: string;
    imageUrl?: string;
};

type AspectRatio = '1:1' | '16:9' | '9:16';

const GeminiKids: React.FC = () => {
    const [profile, setProfile] = useState<ChildProfile | null>(null);
    const [history, setHistory] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);


    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history]);
    
    useEffect(() => {
        // Initialize AudioContext on first interaction
        const initAudio = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            document.removeEventListener('click', initAudio);
        };
        document.addEventListener('click', initAudio);

        return () => {
            document.removeEventListener('click', initAudio);
            activeAudioSourceRef.current?.stop();
            audioContextRef.current?.close().catch(console.error);
        };
    }, []);

    const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newProfile: ChildProfile = {
            name: formData.get('name') as string,
            favoriteAnimal: formData.get('animal') as string,
            interests: formData.get('interests') as string,
        };
        setProfile(newProfile);
        setHistory([{ role: 'model', text: `Cześć ${newProfile.name}! Jestem Iskierka, Twój nowy przyjaciel-robot. O czym chcesz dzisiaj porozmawiać?` }]);
    };

    const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !profile) return;

        const userMessage: Message = { role: 'user', text: input };
        const newHistory = [...history, userMessage];
        setHistory(newHistory);
        setInput('');
        setIsLoading(true);

        try {
            const response = await getGeminiKidsMultimodalResponse(
                profile,
                newHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
                aspectRatio
            );

            const modelMessage: Message = {
                role: 'model',
                text: response.text,
                imageUrl: response.imageUrl,
            };
    
            setHistory(prev => [...prev, modelMessage]);

        } catch (error) {
            console.error("Error in Gemini Kids chat:", error);
            const errorMessage: Message = {
                role: 'model',
                text: "Ojej, coś mi się zepsuło. Spróbujmy jeszcze raz!"
            };
            setHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
     const handleSpeak = async (text: string) => {
        if (isSpeaking) {
            activeAudioSourceRef.current?.stop();
            setIsSpeaking(false);
            return;
        }
        if (!audioContextRef.current) return;
        
        setIsSpeaking(true);
        try {
            const base64Audio = await generateSpeech(text);
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start();
            activeAudioSourceRef.current = source;
            source.onended = () => {
                setIsSpeaking(false);
                activeAudioSourceRef.current = null;
            };

        } catch (error) {
            console.error("Error generating or playing speech:", error);
            setIsSpeaking(false);
        }
    };


    if (!profile) {
        return (
            <div className="p-4 md:p-8 max-w-lg mx-auto">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 text-center">
                    <div className="mx-auto bg-sky-100 text-sky-600 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                        <Icon name="gemini-kids" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mt-4 mb-2">Witaj w Gemini Kids!</h2>
                    <p className="text-slate-500 mb-6">Zanim zaczniemy, opowiedz mi trochę o dziecku, abym mógł być najlepszym przyjacielem.</p>
                    <ConfidentialDataWarning />
                    <form onSubmit={handleProfileSubmit} className="space-y-4 text-left">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Jak ma na imię dziecko?</label>
                            <input type="text" name="name" id="name" required className="mt-1 w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <div>
                            <label htmlFor="animal" className="block text-sm font-medium text-slate-700">Jakie jest jego ulubione zwierzę?</label>
                            <input type="text" name="animal" id="animal" required className="mt-1 w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <div>
                            <label htmlFor="interests" className="block text-sm font-medium text-slate-700">Czym się interesuje? (np. dinozaury, kosmos, rysowanie)</label>
                            <input type="text" name="interests" id="interests" required className="mt-1 w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <button type="submit" className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition">Zacznijmy rozmowę!</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1 text-center">Rozmowa z Iskierką</h2>
            <p className="text-slate-500 mb-6 text-center">Naciśnij "enter" lub przycisk, aby wysłać wiadomość.</p>
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col h-[70vh]">
                <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0"><Icon name="gemini-kids" /></div>}
                            <div className={`relative group px-4 py-3 rounded-2xl max-w-sm ${msg.role === 'user' ? 'bg-sky-500 text-white rounded-br-none' : 'bg-slate-700 text-white rounded-bl-none'}`}>
                                {msg.imageUrl && (
                                    <img 
                                        src={msg.imageUrl} 
                                        alt="Odpowiedź od Iskierki" 
                                        className="rounded-lg mb-2 max-w-full h-auto" 
                                    />
                                )}
                                <p className="text-base whitespace-pre-wrap">{msg.text}</p>
                                {msg.role === 'model' && msg.text && (
                                    <button 
                                      onClick={() => handleSpeak(msg.text)}
                                      className="absolute -bottom-4 -right-4 bg-white text-sky-600 rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                      aria-label="Przeczytaj na głos"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 3a1 1 0 011 1v1.134a7.963 7.963 0 013.913 2.543l.886-.886a1 1 0 111.414 1.414l-.886.886A7.963 7.963 0 0117 10h1.134a1 1 0 110 2H17a7.963 7.963 0 01-1.636 4.813l.886.886a1 1 0 11-1.414 1.414l-.886-.886A7.963 7.963 0 0111 17.866V19a1 1 0 11-2 0v-1.134a7.963 7.963 0 01-3.913-2.543l-.886.886a1 1 0 11-1.414-1.414l.886-.886A7.963 7.963 0 013 12H1.866a1 1 0 110-2H3a7.963 7.963 0 011.636-4.813l-.886-.886a1 1 0 011.414-1.414l.886.886A7.963 7.963 0 019 4.134V3a1 1 0 011-1zM5 10a5 5 0 1110 0 5 5 0 01-10 0z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex items-end gap-3 justify-start">
                            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0"><Icon name="gemini-kids" /></div>
                            <div className="px-4 py-3 rounded-2xl max-w-sm bg-slate-700 text-white rounded-bl-none">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                     )}
                </div>
                <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-slate-500">Format obrazka:</span>
                        {(['1:1', '16:9', '9:16'] as AspectRatio[]).map(ratio => (
                            <button 
                                key={ratio} 
                                onClick={() => setAspectRatio(ratio)}
                                className={`px-2.5 py-1 text-xs rounded-full ${aspectRatio === ratio ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                            >
                                {ratio}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Napisz coś do Iskierki..."
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="bg-sky-600 text-white p-3 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GeminiKids;
