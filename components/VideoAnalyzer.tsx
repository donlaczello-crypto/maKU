
import React, { useState, useRef } from 'react';
import { analyzeVideo } from '../services/geminiService';
import { Icon } from './common/Icon';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const VideoAnalyzer: React.FC = () => {
    const [video, setVideo] = useState<{ base64: string; url: string; mimeType: string } | null>(null);
    const [prompt, setPrompt] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            setError(`Plik jest za duży. Maksymalny rozmiar to ${MAX_FILE_SIZE / 1024 / 1024} MB.`);
            return;
        }

        setAnalysis('');
        setError('');

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string)?.split(',')[1];
            setVideo({
                base64: base64String,
                url: URL.createObjectURL(file),
                mimeType: file.type,
            });
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!video || !prompt) {
            setError('Proszę dodać wideo i wpisać pytanie.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysis('');

        try {
            const result = await analyzeVideo(video.base64, video.mimeType, prompt);
            setAnalysis(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nie udało się przeanalizować wideo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Analizator Wideo Gemini</h2>
            <p className="text-slate-500 mb-6">Prześlij film i zadaj pytanie, aby uzyskać analizę jego treści.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Upload & Prompt */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">1. Prześlij wideo</label>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoChange}
                                className="hidden"
                                ref={fileInputRef}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center p-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-slate-700 font-semibold border-2 border-dashed border-slate-300"
                            >
                                <Icon name="video_library" />
                                <span className="ml-2">{video ? 'Zmień wideo' : 'Wybierz plik wideo'}</span>
                            </button>
                             {video && <video src={video.url} controls className="w-full mt-2 rounded-lg" />}
                        </div>
                        
                        <ConfidentialDataWarning />

                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 mb-2">2. Zadaj pytanie</label>
                            <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Np. 'Opisz, co robi dziecko w 15 sekundzie filmu' lub 'Czy na nagraniu widać oznaki frustracji?'"
                                className="w-full p-3 border border-slate-300 rounded-lg h-28 focus:ring-2 focus:ring-sky-500"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !video || !prompt}
                            className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 flex items-center justify-center"
                        >
                            {isLoading ? 'Analizuję...' : 'Przeanalizuj wideo'}
                        </button>
                    </form>
                </div>

                {/* Right Column: Analysis */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-4">Analiza Gemini</h3>
                     {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                           <svg className="animate-spin h-10 w-10 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        </div>
                     ) : error ? (
                        <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm text-center">{error}</p>
                     ) : analysis ? (
                        <div className="prose prose-slate max-w-none whitespace-pre-wrap">{analysis}</div>
                     ) : (
                        <p className="text-slate-400 text-center flex items-center justify-center h-full">Tutaj pojawi się analiza wideo.</p>
                     )}
                </div>
            </div>
        </div>
    );
};

export default VideoAnalyzer;