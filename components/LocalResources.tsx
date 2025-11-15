
import React, { useState, useEffect } from 'react';
import { findLocalResources } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import Icon from './common/Icon';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';

const LocalResources: React.FC = () => {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationError, setLocationError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [response, setResponse] = useState<GenerateContentResponse | null>(null);

    useEffect(() => {
        setIsLoading(true);
        setLocationError('');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    setIsLoading(false);
                },
                (err) => {
                    setLocationError('Nie udało się uzyskać lokalizacji. Wpisz miasto w zapytaniu.');
                    console.error(err);
                    setIsLoading(false);
                }
            );
        } else {
            setLocationError('Twoja przeglądarka nie wspiera geolokalizacji. Wpisz miasto w zapytaniu.');
            setIsLoading(false);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query || (!location && !locationError)) {
            setError('Proszę wpisać, czego szukasz, i poczekać na ustalenie lokalizacji.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResponse(null);

        try {
            if (!location) {
                throw new Error("Lokalizacja nie jest dostępna.");
            }
            const result = await findLocalResources(query, location);
            setResponse(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nie udało się wyszukać zasobów.');
        } finally {
            setIsLoading(false);
        }
    };

    const groundingChunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Zasoby Lokalne</h2>
            <p className="text-slate-500 mb-6">Znajdź wsparcie i specjalistów w swojej okolicy.</p>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <ConfidentialDataWarning />
                    <div>
                        <label htmlFor="query" className="block text-sm font-medium text-slate-700 mb-2">Czego szukasz?</label>
                        <input
                            id="query"
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Np. 'terapeuta integracji sensorycznej' lub 'grupa wsparcia dla rodziców ASD'"
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                            required
                        />
                         {locationError && <p className="text-amber-600 text-sm mt-1">{locationError}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !query}
                        className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 flex items-center justify-center"
                    >
                        {isLoading ? 'Szukam...' : 'Znajdź w pobliżu'}
                    </button>
                </form>
            </div>

            {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm mt-6 text-center">{error}</p>}
            
            {response && (
                <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-4">Sugerowane miejsca i specjaliści</h3>
                    <div className="prose prose-slate max-w-none whitespace-pre-wrap mb-6">{response.text}</div>

                    {groundingChunks && groundingChunks.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-slate-200">
                            <h4 className="font-semibold text-slate-600 text-sm mb-2">Miejsca w Mapach Google:</h4>
                            <div className="space-y-2">
                                {groundingChunks.map((chunk, index) => (
                                    'maps' in chunk && (
                                        <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" key={index} className="block p-3 bg-slate-50 hover:bg-slate-100 rounded-lg">
                                            <p className="font-bold text-sky-700">{chunk.maps.title}</p>
                                            <p className="text-xs text-green-700 truncate">{chunk.maps.uri}</p>
                                        </a>
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocalResources;
