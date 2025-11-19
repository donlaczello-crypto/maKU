import React, { useState, useRef, useEffect } from 'react';
import { generateVideo, getVideosOperation } from '../services/geminiService';
import { Icon } from './common/Icon';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';

type GenerationMode = 'text' | 'image';
type AspectRatio = '16:9' | '9:16';

// Interface for the AIStudio object on window
interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
    apiKey?: string;
}

const VideoGenerator: React.FC = () => {
    const [mode, setMode] = useState<GenerationMode>('text');
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [image, setImage] = useState<{ base64: string; url: string; mimeType: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);

    useEffect(() => {
        const checkApiKey = async () => {
            const aistudio = (window as any).aistudio as AIStudio | undefined;
            if (aistudio) {
                const hasKey = await aistudio.hasSelectedApiKey();
                setApiKeySelected(hasKey);
            }
        };
        checkApiKey();
    }, []);

    const pollOperation = async (operation: any) => {
        setStatusMessage('Zadanie zostało wysłane. Oczekiwanie na rozpoczęcie przetwarzania...');
        while (true) {
            try {
                const updatedOperation = await getVideosOperation(operation);
                if (updatedOperation.done) {
                    const downloadLink = updatedOperation.response?.generatedVideos?.[0]?.video?.uri;
                    if (downloadLink) {
                        // FIX: Use the correct API key for fetching the video.
                        // If the user selected a key via aistudio, we should use it (or prompt again/handle it).
                        // Since we can't easily get the key string back from aistudio helper if it's hidden,
                        // we rely on the fact that for Veo we need to pass it.
                        // However, the aistudio helper usually injects it or handles it.
                        // If we assume window.aistudio.apiKey is accessible (it often is in these environments), we use it.
                        // Otherwise fall back to process.env.API_KEY.
                        const aistudio = (window as any).aistudio as AIStudio | undefined;
                        const apiKey = aistudio?.apiKey || process.env.API_KEY;
                        const response = await fetch(`${downloadLink}&key=${apiKey}`);
                        
                        if (!response.ok) {
                            throw new Error(`Błąd pobierania wideo: ${response.statusText}`);
                        }
                        
                        const blob = await response.blob();
                        setVideoUrl(URL.createObjectURL(blob));
                        setStatusMessage('Wideo wygenerowane pomyślnie!');
                    } else {
                        throw new Error('Nie znaleziono linku do pobrania wideo.');
                    }
                    setIsLoading(false);
                    break;
                }
                setStatusMessage('Trwa generowanie wideo... To może potrwać kilka minut.');
                await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10s
            } catch (err) {
                 const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd podczas pobierania statusu.';
                if (errorMessage.includes("Requested entity was not found.")) {
                    setError('Błąd klucza API. Wybierz klucz ponownie.');
                    setApiKeySelected(false); // Reset key selection state
                } else {
                    setError(`Błąd podczas sprawdzania statusu: ${errorMessage}`);
                }
                setIsLoading(false);
                break;
            }
        }
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError('');
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string)?.split(',')[1];
            setImage({
                base64: base64String,
                url: URL.createObjectURL(file),
                mimeType: file.type,
            });
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt && mode === 'text') {
            setError('Proszę wpisać opis wideo.');
            return;
        }
        if (!image && mode === 'image') {
            setError('Proszę przesłać obraz do animacji.');
            return;
        }
        
        setIsLoading(true);
        setError('');
        setStatusMessage('Inicjowanie generowania wideo...');
        setVideoUrl(null);
        
        try {
            const imagePayload = image ? { imageBytes: image.base64, mimeType: image.mimeType } : undefined;
            const operation = await generateVideo(prompt, aspectRatio, imagePayload);
            await pollOperation(operation);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd.';
            if (errorMessage.includes("Requested entity was not found.")) {
                setError('Błąd klucza API. Wybierz klucz ponownie.');
                setApiKeySelected(false); // Reset key selection state
            } else {
                setError(`Błąd: ${errorMessage}`);
            }
            setIsLoading(false);
        }
    };
    
    const handleSelectKey = async () => {
        const aistudio = (window as any).aistudio as AIStudio | undefined;
        if(aistudio) {
            await aistudio.openSelectKey();
            // Assume success to avoid race condition
            setApiKeySelected(true);
        }
    };

    if (!apiKeySelected) {
        return (
             <div className="p-4 md:p-8 max-w-2xl mx-auto text-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
                    <Icon name="video_spark" />
                    <h2 className="text-2xl font-bold text-slate-800 mt-4 mb-2">Generator Wideo Veo</h2>
                    <p className="text-slate-500 mb-6">Aby korzystać z tej funkcji, musisz wybrać klucz API. Generowanie wideo jest operacją płatną.</p>
                    <p className="text-sm text-slate-500 mb-6">Więcej informacji o cenach znajdziesz w <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">dokumentacji bilingowej</a>.</p>
                    <button onClick={handleSelectKey} className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition">
                        Wybierz Klucz API
                    </button>
                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Generator Wideo Veo</h2>
            <p className="text-slate-500 mb-6">Twórz wideo z tekstu lub animuj obrazy.</p>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <div className="flex border-b border-slate-200 mb-4">
                    <button onClick={() => setMode('text')} className={`px-4 py-2 font-semibold ${mode === 'text' ? 'border-b-2 border-sky-500 text-sky-600' : 'text-slate-500'}`}>Tekst na Wideo</button>
                    <button onClick={() => setMode('image')} className={`px-4 py-2 font-semibold ${mode === 'image' ? 'border-b-2 border-sky-500 text-sky-600' : 'text-slate-500'}`}>Obraz na Wideo</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'image' && (
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">1. Prześlij obraz do animacji</label>
                            <input type="file" accept="image/png, image/jpeg" onChange={handleImageChange} className="hidden" ref={fileInputRef} />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center p-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-slate-700 font-semibold border-2 border-dashed border-slate-300">
                                {image ? <img src={image.url} alt="Podgląd" className="max-h-24 rounded-md" /> : <><Icon name="movie" /><span className="ml-2">Wybierz obraz</span></>}
                            </button>
                        </div>
                    )}
                    <ConfidentialDataWarning />
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 mb-2">{mode === 'text' ? '1. Opisz wideo' : '2. Opisz, co ma się dziać (opcjonalnie)'}</label>
                        <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Np. 'Latający kot w stylu retro zjada tęczę w kosmosie'" className="w-full p-3 border border-slate-300 rounded-lg h-24 focus:ring-2 focus:ring-sky-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">3. Wybierz proporcje</label>
                        <div className="flex gap-2">
                            {(['16:9', '9:16'] as AspectRatio[]).map(ratio => (
                                <button type="button" key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-4 py-2 text-sm rounded-lg border-2 ${aspectRatio === ratio ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}`}>{ratio === '16:9' ? 'Poziomo' : 'Pionowo'}</button>
                            ))}
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400">
                        {isLoading ? 'Generuję...' : 'Wygeneruj Wideo'}
                    </button>
                </form>
            </div>
            
            {(isLoading || videoUrl || error) && (
                 <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg border border-slate-100 text-center">
                    {isLoading && (
                        <>
                            <svg className="animate-spin h-10 w-10 text-sky-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p className="text-slate-600 font-semibold mt-2">{statusMessage}</p>
                        </>
                    )}
                    {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error}</p>}
                    {videoUrl && (
                        <div>
                            <h3 className="text-lg font-bold text-sky-700 mb-4">Twoje wideo jest gotowe!</h3>
                            <video src={videoUrl} controls autoPlay loop className="w-full max-w-lg mx-auto rounded-lg" />
                        </div>
                    )}
                 </div>
            )}
        </div>
    );
};

export default VideoGenerator;