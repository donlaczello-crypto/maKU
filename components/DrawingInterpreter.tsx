
import React, { useState, useRef, useEffect } from 'react';
import { analyzeDrawing, generateDrawingConversationGuide } from '../services/geminiService';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';
import { Icon } from './common/Icon';
import { LinkedDrawingData } from '../types';
import { renderMarkdownSafe } from '../utils/markdown';

const contextTags = [
    "Po kłótni/konflikcie",
    "Podczas swobodnej zabawy",
    "Na prośbę rodzica",
    "Po powrocie z przedszkola/szkoły",
    "Przed snem",
    "Rysunek o rodzinie",
];

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.8;
const COMPRESSED_MIME_TYPE = 'image/jpeg';


// Helper function to compress and resize the image
const compressImage = (file: Blob): Promise<{ previewUrl: string; base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const reader = new FileReader();

        image.onload = () => {
            let { width, height } = image;

            if (width > height) {
                if (width > MAX_DIMENSION) {
                    height = Math.round(height * (MAX_DIMENSION / width));
                    width = MAX_DIMENSION;
                }
            } else {
                if (height > MAX_DIMENSION) {
                    width = Math.round(width * (MAX_DIMENSION / height));
                    height = MAX_DIMENSION;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Nie można uzyskać kontekstu canvas.'));
            }
            ctx.drawImage(image, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                         return reject(new Error('Nie udało się utworzyć bloba z canvasa.'));
                    }
                    const previewUrl = URL.createObjectURL(blob);
                    const readerForBase64 = new FileReader();
                    readerForBase64.onloadend = () => {
                        const base64String = (readerForBase64.result as string)?.split(',')[1];
                        if (base64String) {
                            resolve({
                                previewUrl,
                                base64: base64String,
                                mimeType: COMPRESSED_MIME_TYPE,
                            });
                        } else {
                             reject(new Error('Nie udało się przekonwertować obrazu na base64.'));
                        }
                    };
                    readerForBase64.onerror = () => reject(new Error('Błąd odczytu skompresowanego obrazu.'));
                    readerForBase64.readAsDataURL(blob);
                },
                COMPRESSED_MIME_TYPE,
                JPEG_QUALITY
            );
        };
        
        image.onerror = () => reject(new Error('Nie udało się załadować obrazu.'));
        
        reader.onload = (e) => {
            if (typeof e.target?.result === 'string') {
                 image.src = e.target.result;
            } else {
                reject(new Error('Błąd podczas odczytywania pliku.'));
            }
        };

        reader.onerror = () => reject(new Error('Błąd odczytu pliku.'));

        reader.readAsDataURL(file);
    });
};

interface DrawingInterpreterProps {
    onLinkToABC: (data: LinkedDrawingData) => void;
}

const DrawingInterpreter: React.FC<DrawingInterpreterProps> = ({ onLinkToABC }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string>('');
    const [mimeType, setMimeType] = useState<string>('');
    const [customContext, setCustomContext] = useState<string>('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [isEditingAnalysis, setIsEditingAnalysis] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [conversationGuide, setConversationGuide] = useState<string>('');
    const [isGuideLoading, setIsGuideLoading] = useState<boolean>(false);

    // New State for Camera
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);


    useEffect(() => {
        const currentPreview = imagePreview;
        return () => {
            if (currentPreview && currentPreview.startsWith('blob:')) {
                URL.revokeObjectURL(currentPreview);
            }
        };
    }, [imagePreview]);

    // Camera Effect
    useEffect(() => {
        const startCamera = async () => {
            if (isCameraOpen) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                    streamRef.current = stream;
                } catch (err) {
                    console.error("Błąd dostępu do kamery:", err);
                    setError("Nie można uzyskać dostępu do kamery. Sprawdź uprawnienia w przeglądarce.");
                    setIsCameraOpen(false);
                }
            }
        };

        const stopCamera = () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };

        if (isCameraOpen) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isCameraOpen]);


    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
    
        const resetFileState = () => {
            setImagePreview(null);
            setImageBase64('');
            setMimeType('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };

        setError('');
        setAnalysis('');
        setIsEditingAnalysis(false);

        if (!file) {
            resetFileState();
            return;
        }

        const supportedTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!supportedTypes.includes(file.type)) {
            setError('Nieobsługiwany format pliku. Proszę wybrać PNG, JPG, lub WEBP.');
            resetFileState();
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit for original file
            setError('Plik jest zbyt duży. Maksymalny rozmiar to 10MB.');
            resetFileState();
            return;
        }
        
        try {
            const compressedData = await compressImage(file);
            setImagePreview(compressedData.previewUrl);
            setImageBase64(compressedData.base64);
            setMimeType(compressedData.mimeType);
        } catch (err) {
            console.error("Image compression error:", err);
            setError(err instanceof Error ? err.message : 'Nie udało się przetworzyć obrazu.');
            resetFileState();
        }
    };
    
    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleReset = () => {
        setImagePreview(null);
        setImageBase64('');
        setMimeType('');
        setCustomContext('');
        setSelectedTags([]);
        setAnalysis('');
        setError('');
        setIsEditingAnalysis(false);
        setIsCameraOpen(false); // Close camera if open
        setConversationGuide('');
        setIsGuideLoading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!imageBase64 || (!customContext.trim() && selectedTags.length === 0)) {
            setError('Proszę dodać rysunek i opisać kontekst sytuacji.');
            return;
        }
        setError('');
        setIsLoading(true);
        setAnalysis('');
        setIsEditingAnalysis(false);
        setConversationGuide('');
        setIsGuideLoading(false);

        try {
            const result = await analyzeDrawing(imageBase64, mimeType, customContext, selectedTags);
            setAnalysis(result);
        } catch (err) {
            if (err instanceof Error) {
                setError(`Błąd: ${err.message}. Spróbuj ponownie.`);
            } else {
                setError('Wystąpił nieoczekiwany, nieznany błąd podczas analizy.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleOpenCamera = () => {
        setError('');
        setIsCameraOpen(true);
    };

    const handleCloseCamera = () => {
        setIsCameraOpen(false);
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            // Fix: Rename 'canvas' to 'canvasElement' to avoid block-scoped variable error.
            const canvasElement = canvasRef.current;

            canvasElement.width = video.videoWidth;
            canvasElement.height = video.videoHeight;
            const context = canvasElement.getContext('2d');
            if(context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                canvasElement.toBlob(async (blob) => {
                    if (blob) {
                        try {
                           const compressedData = await compressImage(blob);
                            setImagePreview(compressedData.previewUrl);
                            setImageBase64(compressedData.base64);
                            setMimeType(compressedData.mimeType);
                        } catch (err) {
                            console.error("Capture compression error:", err);
                            setError(err instanceof Error ? err.message : 'Nie udało się przetworzyć zdjęcia.');
                        }
                    } else {
                        setError('Nie udało się przechwycić obrazu.');
                    }
                }, 'image/jpeg', 1.0); // Capture at high quality, compress later
                
                handleCloseCamera();
            } else {
                setError('Nie udało się przechwycić obrazu.');
                handleCloseCamera();
            }
        }
    };


    const handleShare = async () => {
        if (navigator.share && analysis) {
          try {
            const fullContext = [...selectedTags, customContext].filter(Boolean).join('. ');
            const shareText = `Analiza Rysunku z MyPoint\n\n--- Kontekst ---\n${fullContext}\n\n--- Analiza ---\n${analysis}`;

            await navigator.share({
              title: 'Analiza Rysunku z MyPoint',
              text: shareText,
            });
          } catch (error) {
            console.error('Błąd podczas udostępniania:', error);
          }
        } else {
          alert('Twoja przeglądarka nie wspiera funkcji udostępniania.');
        }
    };
    
    const handleDownloadImage = () => {
        if (!imagePreview) return;
        const link = document.createElement('a');
        link.href = imagePreview;
        link.download = `mypoint-rysunek-${Date.now()}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAnalysis = () => {
        if (!analysis) return;

        const fullContext = [...selectedTags, customContext].filter(Boolean).join('. ');
        const content = `Analiza Rysunku z MyPoint\n\n--- Kontekst ---\n${fullContext}\n\n--- Analiza ---\n${analysis}`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mypoint-analiza-rysunku-${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleLinkToABC = () => {
        if (analysis && imageBase64) {
            const fullContext = [...selectedTags, customContext].filter(Boolean).join('. ');
            onLinkToABC({
                analysis,
                context: fullContext,
                imageBase64,
            });
        }
    };

    const handleGenerateGuide = async () => {
        if (!analysis || !imageBase64) return;

        setIsGuideLoading(true);
        setConversationGuide('');
        setError(''); // Clear previous errors

        try {
            const guide = await generateDrawingConversationGuide(analysis, imageBase64, mimeType);
            setConversationGuide(guide);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd podczas generowania przewodnika.');
        } finally {
            setIsGuideLoading(false);
        }
    };

    // Use the global renderMarkdownSafe helper
    const renderGuide = (text: string) => {
        return <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={renderMarkdownSafe(text)} />;
    };

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Tłumacz Rysunków</h2>
            <p className="text-slate-500 mb-6">Prześlij rysunek dziecka, aby uzyskać wgląd w jego emocje i myśli.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-4">1. Prześlij rysunek</h3>
                    <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                        ref={fileInputRef}
                    />
                    {!imagePreview ? (
                        <div className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-8 space-y-4">
                            <button
                                type="button"
                                onClick={triggerFileInput}
                                className="w-full flex items-center justify-center p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-slate-700 font-semibold"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                Wybierz plik z urządzenia
                            </button>
                            <div className="text-sm text-slate-400">lub</div>
                            <button
                                type="button"
                                onClick={handleOpenCamera}
                                className="w-full flex items-center justify-center p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-slate-700 font-semibold"
                            >
                                <Icon name="camera" />
                                <span className="ml-2">Zrób zdjęcie aparatem</span>
                            </button>
                             <p className="text-xs text-slate-500 pt-2">PNG, JPG, WEBP (maks. 10MB)</p>
                        </div>
                    ) : (
                        <div className="relative group">
                            <img src={imagePreview} alt="Podgląd rysunku" className="w-full h-auto rounded-lg shadow-md" />
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleDownloadImage}
                                    className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition opacity-0 group-hover:opacity-100"
                                    aria-label="Pobierz obrazek"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition opacity-0 group-hover:opacity-100"
                                    aria-label="Usuń obraz"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-4">2. Wybierz kontekst (opcjonalnie)</h3>
                     <div className="flex flex-wrap gap-2">
                        {contextTags.map(tag => (
                            <button
                                type="button"
                                key={tag}
                                onClick={() => handleTagToggle(tag)}
                                className={`px-3 py-1.5 text-sm rounded-full transition ${selectedTags.includes(tag) ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-4">3. Opisz dodatkowy kontekst</h3>
                    <ConfidentialDataWarning />
                    <textarea
                        value={customContext}
                        onChange={(e) => setCustomContext(e.target.value)}
                        placeholder="Np. 'Córka była dziś cicha i zamyślona...'"
                        className="w-full p-3 border border-slate-300 rounded-lg h-28 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    />
                </div>
                
                {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error}</p>}

                <div className="mt-6">
                    <button
                        type="submit"
                        className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
                        disabled={isLoading || !imageBase64 || (!customContext.trim() && selectedTags.length === 0)}
                    >
                        {isLoading ? (
                           <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                        ) : null}
                        {isLoading ? 'Analizuję...' : 'Przeanalizuj rysunek'}
                    </button>
                </div>
            </form>

            {(analysis || (!isLoading && error)) && (
                <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-sky-700">Analiza rysunku</h3>
                        {!isEditingAnalysis && (
                             <div className="flex items-center gap-2 flex-wrap">
                                {imagePreview && (
                                     <button
                                        onClick={handleDownloadImage}
                                        className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-slate-200 transition"
                                        aria-label="Pobierz obrazek"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span>Pobierz Obrazek</span>
                                    </button>
                                )}
                                {analysis && (
                                     <button
                                        onClick={handleDownloadAnalysis}
                                        className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-slate-200 transition"
                                        aria-label="Pobierz analizę"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span>Pobierz Analizę</span>
                                    </button>
                                )}
                                {analysis && typeof navigator.share !== 'undefined' && (
                                     <button
                                        onClick={handleShare}
                                        className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-slate-200 transition"
                                        aria-label="Udostępnij analizę"
                                    >
                                        <Icon name="share" />
                                        <span>Udostępnij</span>
                                    </button>
                                )}
                                 <button
                                    onClick={() => setIsEditingAnalysis(true)}
                                    className="flex items-center gap-2 bg-sky-100 text-sky-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-sky-200 transition"
                                    aria-label={analysis ? "Edytuj analizę" : "Wpisz analizę ręcznie"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14.125v4.375a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                    <span>{analysis ? "Edytuj" : "Wpisz"}</span>
                                </button>
                            </div>
                        )}
                    </div>
                    {isEditingAnalysis ? (
                        <div className="space-y-4">
                            <textarea
                                value={analysis}
                                onChange={(e) => setAnalysis(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg h-48 focus:ring-2 focus:ring-sky-500 transition"
                                placeholder="Wpisz lub edytuj analizę tutaj..."
                            ></textarea>
                            <button
                                onClick={() => setIsEditingAnalysis(false)}
                                className="w-full bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 transition"
                            >
                                Zapisz zmiany
                            </button>
                        </div>
                    ) : (
                        <div className="prose prose-slate max-w-none whitespace-pre-wrap">{analysis}</div>
                    )}

                    {analysis && (
                        <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                            <h3 className="text-xl font-bold text-sky-700">Przewodnik do rozmowy z dzieckiem</h3>
                            <p className="text-slate-500">Generowanie pomocnych zwrotów i pytań w oparciu o analizę rysunku, aby rozpocząć rozmowę z dzieckiem.</p>
                            <button
                                onClick={handleGenerateGuide}
                                disabled={isGuideLoading}
                                className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition disabled:bg-slate-400 flex items-center justify-center"
                            >
                                {isGuideLoading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : null}
                                {isGuideLoading ? 'Generuję przewodnik...' : 'Wygeneruj przewodnik'}
                            </button>
                            {conversationGuide && (
                                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                    {renderGuide(conversationGuide)}
                                </div>
                            )}
                        </div>
                    )}
                    {analysis && (
                         <div className="mt-6 pt-6 border-t border-slate-200">
                             <button
                                 onClick={handleLinkToABC}
                                 className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 transition"
                             >
                                 Połącz z Rejestratorem ABC
                             </button>
                         </div>
                    )}
                </div>
            )}

            {isCameraOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="relative bg-white rounded-lg p-4 max-w-lg mx-auto">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">Zrób zdjęcie</h3>
                        <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg mb-4"></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        <div className="flex justify-center gap-4">
                            <button onClick={handleCapture} className="bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 transition">
                                <Icon name="camera" /> Zrób zdjęcie
                            </button>
                            <button onClick={handleCloseCamera} className="bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-400 transition">
                                Anuluj
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DrawingInterpreter;
