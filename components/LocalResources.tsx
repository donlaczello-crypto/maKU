
import React, { useState, useEffect } from 'react';
import { findLocalResources } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import { Icon } from './common/Icon';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';

// Structure to hold collected places history
interface CollectedPlace {
    title: string;
    uri: string;
    query: string;
    area: string;
    timestamp: string;
}

// Correctly typed interface for Grounding Chunks based on API response structure
interface GroundingChunk {
    web?: {
        uri: string;
        title: string;
    };
    maps?: {
        title: string;
        uri: string;
        placeId?: string;
    };
}

const LocalResources: React.FC = () => {
    const [query, setQuery] = useState('');
    const [manualLocation, setManualLocation] = useState('');
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationError, setLocationError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [response, setResponse] = useState<GenerateContentResponse | null>(null);
    
    // History state to accumulate all findings
    const [collectedHistory, setCollectedHistory] = useState<CollectedPlace[]>([]);

    useEffect(() => {
        // Only attempt geolocation if user hasn't typed a manual location
        if (!manualLocation) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    },
                    (err) => {
                        setLocationError('Nie udało się uzyskać lokalizacji. Wpisz miasto w polu obszaru.');
                        console.warn(err);
                    }
                );
            } else {
                setLocationError('Twoja przeglądarka nie wspiera geolokalizacji. Wpisz miasto w polu obszaru.');
            }
        }
    }, [manualLocation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) {
            setError('Proszę wpisać, czego szukasz.');
            return;
        }
        if (!location && !manualLocation) {
             setError('Proszę zezwolić na lokalizację lub wpisać obszar (miasto/dzielnica).');
             return;
        }

        setIsLoading(true);
        setError('');
        setResponse(null);

        try {
            // If manual location is provided, append it to query. Otherwise use lat/long tool config.
            let finalQuery = query;
            let locationConfig = location;
            const currentArea = manualLocation || 'Lokalizacja GPS';

            if (manualLocation) {
                finalQuery = `${query} w obszarze: ${manualLocation}`;
                locationConfig = undefined; // Disable lat/long preference if manual area is set
            }

            const result = await findLocalResources(finalQuery, locationConfig || undefined);
            setResponse(result);

            // Process and collect history
            const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
            const chunks = groundingMetadata?.groundingChunks;
            
            if (chunks && Array.isArray(chunks)) {
                const newPlaces: CollectedPlace[] = [];
                
                // Explicit type checking loop
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i] as unknown as GroundingChunk;
                    if (chunk && chunk.maps) {
                        newPlaces.push({
                            title: chunk.maps.title || "Nieznane miejsce",
                            uri: chunk.maps.uri || "#",
                            query: query,
                            area: currentArea,
                            timestamp: new Date().toLocaleString()
                        });
                    }
                }
                
                if (newPlaces.length > 0) {
                    setCollectedHistory(prev => [...newPlaces, ...prev]);
                }
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nie udało się wyszukać zasobów.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveHistory = () => {
        if (collectedHistory.length === 0) {
            alert("Brak historii do zapisania. Wykonaj wyszukiwanie.");
            return;
        }
        
        let content = `RAPORT: PEŁNA HISTORIA MAPY - MyPoint!\nData wygenerowania: ${new Date().toLocaleString()}\n\n`;
        
        // Group by Area/Query for readability
        const grouped = collectedHistory.reduce((acc, place) => {
            const key = `${place.query} (${place.area})`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(place);
            return acc;
        }, {} as Record<string, CollectedPlace[]>);

        Object.entries(grouped).forEach(([key, places]) => {
            content += `### Szukano: ${key}\n`;
            // Explicit cast to ensure TS knows places is an array
            (places as CollectedPlace[]).forEach(place => {
                content += `- [${place.timestamp}] ${place.title}: ${place.uri}\n`;
            });
            content += `\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mypoint-historia-mapy-${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Zasoby Lokalne i Mapa</h2>
            <p className="text-slate-500 mb-6">Wyszukuj miejsca i buduj historię zasobów w swojej okolicy.</p>

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
                            placeholder="Np. 'terapeuta integracji sensorycznej', 'plac zabaw', 'apteka'"
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                            required
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="area" className="block text-sm font-medium text-slate-700 mb-2">Obszar (opcjonalnie)</label>
                        <input
                            id="area"
                            type="text"
                            value={manualLocation}
                            onChange={(e) => setManualLocation(e.target.value)}
                            placeholder={location ? "Używam GPS (wpisz aby nadpisać)" : "Wpisz miasto lub dzielnicę"}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                        />
                         {!manualLocation && locationError && <p className="text-amber-600 text-sm mt-1">{locationError}</p>}
                         {!manualLocation && location && <p className="text-green-600 text-xs mt-1">✓ Lokalizacja GPS aktywna</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !query}
                        className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 flex items-center justify-center"
                    >
                        {isLoading ? 'Pobieram dane z Map Google...' : 'Szukaj i Dodaj do Historii'}
                    </button>
                </form>
            </div>

            {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm mt-6 text-center">{error}</p>}
            
            {/* Accumulated History / Current Results Area */}
            <div className="mt-8">
                 <div className="flex justify-between items-center mb-4 bg-slate-100 p-3 rounded-lg">
                    <h3 className="text-lg font-bold text-slate-700">
                        Zebrana Historia Mapy ({collectedHistory.length})
                    </h3>
                    <button 
                        onClick={handleSaveHistory}
                        disabled={collectedHistory.length === 0}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-md disabled:bg-slate-300"
                    >
                        <Icon name="journal" className="w-4 h-4" />
                        <span>Zapisz Pełną Historię (Raport)</span>
                    </button>
                </div>

                {response && (
                    <div className="bg-sky-50 p-4 rounded-xl border border-sky-200 mb-6">
                        <h4 className="font-bold text-sky-800 mb-2">Ostatnie wyszukiwanie (Asystent):</h4>
                        <div className="prose prose-sm max-w-none text-slate-700">{response.text}</div>
                    </div>
                )}

                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                     {collectedHistory.length > 0 ? (
                         collectedHistory.map((place, index) => (
                            <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition animate-fade-in">
                                <div className="flex flex-col">
                                    <a href={place.uri} target="_blank" rel="noopener noreferrer" className="font-bold text-sky-700 hover:underline text-lg">
                                        {place.title}
                                    </a>
                                    <div className="flex justify-between items-center mt-1 text-xs text-slate-500">
                                        <span>Zapytanie: <strong>{place.query}</strong> ({place.area})</span>
                                        <span>{place.timestamp}</span>
                                    </div>
                                </div>
                            </div>
                         ))
                     ) : (
                         <div className="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                             <p className="text-slate-400">Historia mapy jest pusta. Wyszukaj miejsca, aby je tutaj zebrać.</p>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default LocalResources;
