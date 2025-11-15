
import React, { useState, useRef } from 'react';
import { editImage } from '../services/geminiService';
import Icon from './common/Icon';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';

const ImageEditor: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<{ base64: string; url: string; mimeType: string } | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setEditedImage(null);
        setError('');

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string)?.split(',')[1];
            setOriginalImage({
                base64: base64String,
                url: URL.createObjectURL(file),
                mimeType: file.type,
            });
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!originalImage || !prompt) {
            setError('Proszę dodać obraz i wpisać polecenie edycji.');
            return;
        }
        setIsLoading(true);
        setError('');
        setEditedImage(null);

        try {
            const resultBase64 = await editImage(originalImage.base64, originalImage.mimeType, prompt);
            setEditedImage(`data:image/jpeg;base64,${resultBase64}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nie udało się edytować obrazu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Edytor Obrazów Gemini</h2>
            <p className="text-slate-500 mb-6">Prześlij zdjęcie i opisz, jak chcesz je zmienić.</p>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">1. Prześlij obraz</label>
                        <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={handleImageChange}
                            className="hidden"
                            ref={fileInputRef}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center p-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-slate-700 font-semibold border-2 border-dashed border-slate-300"
                        >
                            {/* FIX: Changed icon name from "image" to "image_edit_auto" to match available icons. */}
                            <Icon name="image_edit_auto" />
                            <span className="ml-2">{originalImage ? 'Zmień obraz' : 'Wybierz obraz'}</span>
                        </button>
                    </div>

                    <ConfidentialDataWarning />

                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 mb-2">2. Opisz zmianę</label>
                        <input
                            id="prompt"
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Np. 'dodaj okulary przeciwsłoneczne', 'zmień tło na plażę'"
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !originalImage || !prompt}
                        className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 flex items-center justify-center"
                    >
                        {isLoading ? 'Przetwarzam...' : 'Zastosuj Magię Gemini'}
                    </button>
                </form>
            </div>

            {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm mt-6 text-center">{error}</p>}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-bold text-slate-700 text-center mb-2">Oryginał</h3>
                    <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center">
                        {originalImage ? (
                            <img src={originalImage.url} alt="Oryginał" className="max-w-full max-h-full object-contain rounded-lg" />
                        ) : <p className="text-slate-400">Czekam na obraz...</p>}
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-bold text-slate-700 text-center mb-2">Po Edycji</h3>
                    <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center">
                        {isLoading ? (
                            <svg className="animate-spin h-10 w-10 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : editedImage ? (
                            <img src={editedImage} alt="Po edycji" className="max-w-full max-h-full object-contain rounded-lg" />
                        ) : <p className="text-slate-400">Tutaj pojawi się wynik.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;
