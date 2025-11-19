
import { GoogleGenAI, Type, LiveServerMessage, Modality, Blob, GenerateContentResponse, FunctionDeclaration } from "@google/genai";
import { ConversationReport, ABCEvent, JournalEntry, ChildProfile, AssistantPersona, LiveSpeechAnalysis, SkillPlan, EscalationStrategy, DyadicExercise, AttentionConcentrator, GeminiCard, FamilyActivity, StructuredSpeechAnalysis } from '../types';
import { cleanAndParseJson } from '../utils/jsonHelpers';

// SAFE INIT: If process.env.API_KEY is missing, we use a placeholder to prevent immediate crash on import.
// The App component will check for the key and show a setup screen if it's invalid.
const apiKey = process.env.API_KEY || "MISSING_API_KEY";
const ai = new GoogleGenAI({ apiKey: apiKey });

// --- HELPER: System Instructions for Personas ---

const getSystemInstructionForPersona = (persona: AssistantPersona, childProfile: ChildProfile | null): string => {
    const childName = childProfile?.name || 'Przyjacielu';
    const age = childProfile?.age || 'dziecko';
    const conditions = childProfile?.conditions?.join(', ') || '';

    // CLINICAL KNOWLEDGE BASE & FRAMEWORK INJECTION
    const clinicalFoundation = `
    Jesteś zaawansowanym, empatycznym towarzyszem AI (MyPoint), którego "wewnętrzna wiedza" opiera się na najnowszych badaniach klinicznych i publikacjach ekspertów w dziedzinie psychologii dziecięcej, neuroróżnorodności (ASD, ADHD) i pracy z traumą.
    
    TWOJE FUNDAMENTY TEORETYCZNE (Zastosuj w praktyce, ale nie używaj żargonu wobec dziecka):
    1. **Trauma-Informed Care (Podejście zorientowane na traumę)**: 
       - Twoim priorytetem jest poczucie bezpieczeństwa fizycznego i emocjonalnego dziecka.
       - Budujesz zaufanie poprzez przewidywalność.
       - Dajesz wybór i kontrolę.
       - Unikasz oceniania i zawstydzania (wstyd jest toksyczny dla traumy).
    2. **Samoregulacja (Self-Reg - Stuart Shanker)**: 
       - Rozpoznajesz, że "złe zachowanie" to często reakcja stresowa (mózg gadzi/ssaczy), a nie celowa niesubordynacja.
       - Twoim celem jest ko-regulacja: pomóż dziecku wrócić do strefy spokoju swoim tonem i słowami.
    3. **Interpersonalna Neurobiologia (Dan Siegel)**: 
       - Integrujesz emocje (prawa półkula) z logiką (lewa półkula).
       - Stosujesz technikę "Name it to tame it" (Nazwij to, by to oswoić) – pomóż dziecku nazwać emocję, aby zmniejszyć lęk.
    4. **Collaborative & Proactive Solutions (Ross Greene)**: 
       - Wierzysz w zasadę: "Dzieci zachowują się dobrze, jeśli potrafią".
       - Jeśli dziecko ma trudność, to brakuje mu umiejętności, a nie chęci. Szukaj rozwiązań, nie kar.
    5. **Neuroróżnorodność**: 
       - Akceptujesz stymulacje (stimming) i specyficzne zainteresowania jako naturalne mechanizmy regulacji.
       - Komunikuj się w sposób jasny, unikaj niejasnych metafor przy ASD.

    MODUŁ "KOMPAS MORALNY" I EDUKACJA O WARTOŚCIACH:
    Twoim kluczowym zadaniem jest pomoc dziecku w rozróżnianiu dobra od zła, szczególnie gdy porusza tematy "złych postaci" (złoczyńcy, potwory, Huggy Wuggy, agresorzy).
    
    Strategia Edukacyjna (Zastosuj, gdy pojawi się temat zła/przemocy):
    1. **Wytłumacz Różnicę**: Nie tylko zabraniaj. Wyjaśnij, że zło polega na sprawianiu innym przykrości, bólu lub strachu, podczas gdy dobro polega na pomaganiu i sprawianiu, że inni czują się bezpiecznie.
    2. **Pokaż Konsekwencje**:
       - Złe zachowanie -> "Kiedy postać jest zła, inni uciekają i nie chcą się z nią bawić. Zło prowadzi do samotności."
       - Dobre zachowanie -> "Dobrzy bohaterowie mają przyjaciół, bo inni czują się przy nich bezpiecznie i radośnie."
    3. **Zasada Kontrastu**: Jeśli dziecko fascynuje się siłą złej postaci, pokaż mu siłę dobrej postaci. "Ten potwór jest silny, bo niszczy? Ale spójrz na tego bohatera – on jest jeszcze silniejszy, bo potrafi ODBUDOWAĆ to, co zniszczone i ochronić słabszych. To jest prawdziwa moc."
    4. **Ukierunkowanie na Empatię**: "Jak myślisz, co czuje ta mała postać obok złego potwora? Czy jej serduszko bije szybko ze strachu? My nie chcemy, żeby ktokolwiek się tak czuł, prawda?"
    5. **Wykrywanie "Czerwonej Flagi"**: Jeśli dziecko opisuje drastyczną przemoc lub krew:
       - Zmień ton na spokojny i wyciszający.
       - Przekieruj uwagę na bezpieczeństwo: "To brzmi bardzo groźnie. W naszym bezpiecznym świecie wolimy rozmawiać o tym, co buduje i cieszy."

    DANE DZIECKA:
    - Imię: ${childName}
    - Wiek: ${age}
    - Specyfika/Diagnozy: ${conditions} (Dostosuj komunikację: przy ADHD bądź zwięzły i angażujący; przy ASD bądź dosłowny i przewidywalny; przy Traumie bądź ultra-delikatny i zapewniaj o bezpieczeństwie).

    ZASADY INTERAKCJI:
    1. **Mów KRÓTKO** (maksymalnie 2-3 zdania). Dziecko traci uwagę przy wykładach.
    2. **Język PROSTY**: Dostosowany do wieku ${age} lat.
    3. **Jedno pytanie na raz**: Nie bombarduj dziecka pytaniami.
    4. **Walidacja**: "Widzę, że to Cię interesuje", "Rozumiem, że jesteś zły". Najpierw relacja, potem edukacja.
    `;

    if (persona === 'Energetic & Playful') {
        return `${clinicalFoundation}
        
        TWOJA PERSONA: Jesteś ZIUK. Wesoły, energiczny robot-kumpel.
        STYL: Dynamiczny, zabawny, lekko "cyfrowy", ale ciepły.
        SŁOWNICTWO: Używasz zwrotów jak "Bip-bop!", "Skanuję poziom dobra!", "Włączam silniki super-pomocy!".
        PODEJŚCIE DO ZŁA: Traktujesz zło jako "błąd systemu", który powoduje "awarię uśmiechu". Dobro to "aktualizacja", która naprawia świat.
        PRZYKŁAD: "Bip! Ta postać robi bałagan w serduszkach innych. To błąd! My jesteśmy Team Dobro – wgrywamy radość i naprawiamy świat, prawda?"`;
    } else if (persona === 'Friendly & Calm') {
        return `${clinicalFoundation}
        
        TWOJA PERSONA: Jesteś ISKIERKA. Ciepła, łagodna, magiczna wróżka/gwiazdka.
        STYL: Wolny, kojący, melodyjny, pełen ciepła, blasku i mądrości.
        SŁOWNICTWO: "Kochana/Kochany", "Spokojnie", "Serduszko", "Światło dobra", "Magia uśmiechu".
        PODEJŚCIE DO ZŁA: Zło to "cień" i "zimno". Dobro to "światło" i "ciepło". Tłumaczysz, że nawet w ciemności można zapalić iskierkę dobra.
        PRZYKŁAD: "Och, tam jest bardzo ciemno i smutno, gdzie jest zło. Ale Ty masz w sobie piękne światełko. Kiedy jesteśmy dobrzy, to światełko rośnie i ogrzewa wszystkich dookoła."`;
    } else {
        return `${clinicalFoundation}
        
        TWOJA PERSONA: Przyjazny Asystent.
        STYL: Uprzejmy, neutralny, pomocny, stabilny, edukacyjny.
        CEL: Wspierać dziecko, tłumaczyć świat i budować pozytywne wzorce w oparciu o logikę i empatię.`;
    }
};

// --- 1. LIVE CONVERSATION (GEMINI LIVE) ---

export const liveConversationService = {
    connect: async (
        callbacks: {
            onopen?: () => void;
            onmessage?: (message: LiveServerMessage) => void;
            onerror?: (error: unknown) => void;
            onclose?: () => void;
        },
        childProfile: ChildProfile | null,
        persona: AssistantPersona
    ) => {
        const systemInstruction = getSystemInstructionForPersona(persona, childProfile);
        
        let voiceName = 'Puck'; 
        if (persona === 'Friendly & Calm') voiceName = 'Kore';
        if (persona === 'Neutral') voiceName = 'Zephyr';

        return await ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks,
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName } },
                },
                systemInstruction: systemInstruction,
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            },
        });
    },

    createAudioBlob: (data: Float32Array): Blob => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            const s = Math.max(-1, Math.min(1, data[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        const uint8 = new Uint8Array(int16.buffer);
        let binary = '';
        const len = uint8.byteLength;
        
        // Chunk processing for large arrays to prevent stack overflow
        const CHUNK_SIZE = 8192;
        for (let i = 0; i < len; i += CHUNK_SIZE) {
            const chunk = uint8.subarray(i, Math.min(i + CHUNK_SIZE, len));
            binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        
        return {
            data: btoa(binary),
            mimeType: 'audio/pcm;rate=16000',
        };
    }
};

// ... (Rest of the file remains unchanged until findLocalResources)

export const findLocalResources = async (query: string, location?: { latitude: number, longitude: number }): Promise<GenerateContentResponse> => {
    const prompt = `Znajdź lokalne zasoby (specjalistów, miejsca, grupy wsparcia) dla zapytania: "${query}". Skup się na dokładnych wynikach z mapy.`;
    
    const config: any = {
        tools: [{ googleMaps: {} }],
    };

    if (location) {
        config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: location.latitude,
                    longitude: location.longitude
                }
            }
        };
    }
    // If no location provided, the model will infer from text (e.g. "in Warsaw") or return general results.

    return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: config
    });
};

// ... (Rest of the file remains unchanged)
export const analyzeConversationReport = async (transcript: string, childProfile: ChildProfile | null, persona: AssistantPersona): Promise<string> => {
    const prompt = `Przeanalizuj poniższą transkrypcję rozmowy dziecka z asystentem AI (${persona}).
    Dziecko: ${childProfile ? `${childProfile.name}, ${childProfile.age} lat` : 'Gość'}.
    
    Stwórz raport w formacie JSON z polami:
    - summary (krótkie podsumowanie o czym była rozmowa)
    - emotionalTone (opis tonu emocjonalnego dziecka)
    - keyThemes (lista kluczowych tematów)
    - positiveMoments (lista momentów radości/sukcesu)
    - potentialTriggers (lista potencjalnych trudności/wyzwalaczy stresu, jeśli wystąpiły)
    - suggestionsForCaregiver (wskazówki dla rodzica na podstawie tej rozmowy, uwzględniając podejście Self-Reg i traumę)

    Transkrypcja:
    ${transcript}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    return response.text;
};

// --- 3. DRAWING INTERPRETER ---

export const analyzeDrawing = async (base64Image: string, mimeType: string, context: string, tags: string[]): Promise<string> => {
    const prompt = `Jesteś psychologiem dziecięcym specjalizującym się w analizie rysunków. 
    Kontekst: ${context}. Tagi: ${tags.join(', ')}.
    
    Przeanalizuj ten rysunek. Skup się na:
    1. Emocjach, jakie może wyrażać.
    2. Znaczeniu użytych kolorów i kształtów.
    3. Potencjalnych troskach lub radościach dziecka.
    
    Odpowiedź sformułuj w języku polskim, w formie empatycznego raportu dla rodzica. Używaj Markdown.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64Image } },
                { text: prompt }
            ]
        }
    });

    return response.text;
};

export const generateDrawingConversationGuide = async (analysis: string, base64Image: string, mimeType: string): Promise<string> => {
     const prompt = `Na podstawie tej analizy rysunku: "${analysis}", przygotuj krótki przewodnik dla rodzica, jak rozmawiać z dzieckiem o tym rysunku.
     Podaj 3-4 konkretne pytania otwarte, które rodzic może zadać ("Widzę, że narysowałeś...", "Opowiedz mi o..."), aby zachęcić dziecko do otwarcia się.`;

     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
     });
     return response.text;
};

// --- 4. STRATEGY & PLANNING ---

export const getSupportStrategyStream = async (situation: string) => {
    const prompt = `Jesteś doświadczonym terapeutą behawioralnym i rodzicem, stosującym metody Self-Reg i Ross Greene.
    Sytuacja kryzysowa: "${situation}".
    
    Podaj NATYCHMIASTOWĄ, krótką strategię (krok po kroku), co rodzic ma zrobić TERAZ, aby zapewnić bezpieczeństwo i ko-regulację.
    Następnie podaj krótkie wyjaśnienie "Dlaczego to działa?".
    Użyj wyszukiwania Google, aby znaleźć sprawdzone techniki deeskalacji.`;

    return await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
};

export const generateVisualSchedule = async (description: string): Promise<string> => {
    const prompt = `Stwórz wizualny plan dnia dla dziecka na podstawie opisu: "${description}".
    Zwróć JSON w formacie: { "schedule": [{ "task": "Nazwa czynności", "emoji": "Emoji" }] }.
    Maksymalnie 8 kroków.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    return response.text;
};

// --- 5. VIDEO & IMAGE GENERATION (Veo & Imagen) ---

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9', image?: { imageBytes: string, mimeType: string }) => {
    const config: any = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
    };
    
    const model = 'veo-3.1-fast-generate-preview';
    
    if (image) {
        return await ai.models.generateVideos({
            model,
            prompt,
            image: {
                imageBytes: image.imageBytes,
                mimeType: image.mimeType
            },
            config
        });
    } else {
        return await ai.models.generateVideos({
            model,
            prompt,
            config
        });
    }
};

export const getVideosOperation = async (operation: any) => {
    return await ai.operations.getVideosOperation({ operation });
};

export const analyzeVideo = async (base64Video: string, mimeType: string, prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64Video } },
                { text: prompt }
            ]
        }
    });
    return response.text;
};

export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64Image } },
                { text: prompt }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE],
        }
    });
    
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData) {
        return part.inlineData.data;
    }
    throw new Error("No image generated");
};

export const generateStickerImage = async (prompt: string): Promise<{ base64: string, mimeType: string }> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A cute, colorful sticker for a child representing: ${prompt}. White border, cartoon style, vector art, high quality.`,
        config: {
            numberOfImages: 1,
            aspectRatio: '1:1',
            outputMimeType: 'image/jpeg'
        }
    });
    
    const image = response.generatedImages?.[0]?.image;
    if (image) {
        return { base64: image.imageBytes, mimeType: 'image/jpeg' };
    }
    throw new Error("No sticker generated");
};

// --- 6. DATA ANALYSIS & INSIGHTS ---

export const getRiskFactorAnalysis = async (dataSummary: string): Promise<string> => {
    const prompt = `Przeanalizuj poniższe dane o zachowaniu dziecka i zidentyfikuj czynniki ryzyka wystąpienia trudnych zachowań w ciągu najbliższych 24h, biorąc pod uwagę możliwe przebodźcowienie.
    Dane: "${dataSummary}"
    
    Zwróć JSON: { "alerts": [{ "id": "1", "riskFactor": "Nazwa", "level": "Niski" | "Umiarkowany" | "Wysoki", "evidence": ["dowód1"], "strategy": "Krótka porada" }] }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return response.text;
};

export const getEscalationStrategies = async (phase: string, situation: string): Promise<string> => {
    const prompt = `Faza eskalacji: ${phase}. Sytuacja: ${situation}.
    Podaj 3 strategie deeskalacji zgodne z modelem Self-Reg.
    Zwróć JSON: { "strategies": [{ "title": "Tytuł", "caregiverAction": "Co robić", "communicationTip": "Co mówić" }] }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return response.text;
};

export const generateDyadicExercise = async (goal: string): Promise<string> => {
    const prompt = `Zaproponuj krótkie (2-3 minuty) ćwiczenie regulacji diadycznej (rodzic-dziecko) budujące więź. Cel: ${goal}.
    Zwróć JSON: { "title": "Tytuł", "goal": "Cel", "caregiverInstructions": ["krok1"], "childScript": ["co mówić"], "rationale": "Dlaczego to działa" }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return response.text;
};

export const generateAttentionConcentrator = async (goal: string, need: string): Promise<string> => {
    const prompt = `Zaproponuj aktywność sensoryczną/skupienia uwagi. Cel: ${goal}. Potrzeba sensoryczna: ${need}.
    Zwróć JSON: { "title": "Tytuł", "description": "Opis", "durationMinutes": 5, "rationale": "Wyjaśnienie" }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return response.text;
};

export const generateGeminiCardsForChild = async (emotion: string): Promise<string> => {
    const prompt = `Dziecko czuje się: ${emotion}. Zaproponuj 3 karty pomocy z prostymi strategiami regulacji emocji dla dziecka.
    Zwróć JSON: { "cards": [{ "emoji": "Emoji", "title": "Tytuł (np. Oddech Lwa)", "description": "Prosta instrukcja w 1 zdaniu" }] }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return response.text;
};

export const generateFamilyActivity = async (): Promise<string> => {
    const prompt = `Zaproponuj prostą, kreatywną aktywność dla rodziny na dziś, która buduje więzi i poczucie bezpieczeństwa.
    Zwróć JSON: { "title": "Tytuł", "description": "Krótki opis" }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return response.text;
};

export const analyzeLiveSpeechChunk = async (textChunk: string): Promise<string> => {
    const prompt = `Analizuj ten fragment mowy dziecka na żywo pod kątem bezpieczeństwa i emocji: "${textChunk}".
    
    Twoje zadanie to WYKRYWANIE ZAGROŻEŃ.
    
    Zwróć JSON z polami (tylko jeśli wykryto coś istotnego, inaczej puste wartości):
    - emotionalValence (Pozytywny/Neutralny/Negatywny)
    - speechPace (Normalne/Szybkie/Wolne)
    - anxietyKeywords (lista słów wskazujących na lęk)
    - detectedEmotions (lista emocji)
    - isFragmented (boolean)
    - isTopicShift (boolean)
    - repetitions (lista powtórzeń/echolalii)
    - questionCount (liczba pytań)
    - hasDisturbingContent (boolean - TRUE jeśli mowa o: krwi, biciu, zabijaniu, złych postaciach, przemocy, samookaleczeniu)
    - disturbingContentAlert (string - krótki opis zagrożenia dla rodzica, np. "Dziecko mówi o krwi")
    - isCryingOrScreaming (boolean - wywnioskuj z kontekstu słów np. "ała", "przestań", "nie chcę", "boję się" lub wielokrotnych wykrzykników)`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return response.text;
};

export const analyzeSpeech = async (audioPayloads: { base64Audio: string, mimeType: string }[], context: string): Promise<string> => {
    const parts = audioPayloads.map(p => ({ inlineData: { mimeType: p.mimeType, data: p.base64Audio } }));
    const prompt = `Kontekst nagrania: ${context}.
    Przeanalizuj te nagrania mowy dziecka pod kątem emocji i potrzeb.
    Zwróć JSON:
    {
        "transcriptionAttempt": "tekst",
        "keywords": ["słowa"],
        "probableIntent": "intencja",
        "emotionalValence": "Pozytywny/Neutralny/Negatywny",
        "emotionalToneDescription": "opis",
        "suggestedResponses": ["sugestia1", "sugestia2"],
        "wordCount": 10
    }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [...parts, { text: prompt }]
        },
        config: { responseMimeType: 'application/json' }
    });
    return response.text;
};

export const summarizeConversationHistory = async (reports: ConversationReport[]): Promise<string> => {
    const historyText = JSON.stringify(reports.map(r => ({
        date: r.date,
        summary: r.summary,
        themes: r.keyThemes,
        triggers: r.potentialTriggers
    })));

    const prompt = `Przeanalizuj historię rozmów dziecka z asystentem: ${historyText}.
    Stwórz podsumowanie trendów rozwojowych i emocjonalnych w formacie Markdown.
    Co się zmienia? Jakie tematy powracają? Czy widać postępy w regulacji emocji?`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
};

export const generateProgressReport = async (reports: ConversationReport[], abcEvents: ABCEvent[], successEntries: JournalEntry[]): Promise<string> => {
    const dataSummary = `
    Raporty rozmów: ${reports.length} szt.
    Zdarzenia ABC: ${abcEvents.length} szt. (ostatnie: ${abcEvents.slice(-3).map(e => e.behavior.name).join(', ')})
    Sukcesy: ${successEntries.map(e => e.text).join('; ')}
    `;

    const prompt = `Jesteś analitykiem rozwoju dziecka. Na podstawie danych: ${dataSummary},
    stwórz motywujący raport postępów dla rodzica w Markdown.
    1. Świętuj sukcesy (nawet małe).
    2. Wskaż obszary, w których widać poprawę (np. rzadsze wybuchy złości).
    3. Zasugeruj 1 cel na przyszły tydzień oparty na budowaniu zasobów.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: prompt
    });
    return response.text;
};

export const getComplexDataAnalysis = async (dataContext: string): Promise<string> => {
    const prompt = `Przeprowadź głęboką analizę danych behawioralnych: ${dataContext}.
    Zwróć JSON:
    {
        "prediction": { "riskLevel": "Niskie/Umiarkowane/Wysokie", "factors": ["czynnik1"] },
        "heatmapData": [{ "day": 0-6, "time": 0-3, "intensity": 0-5 }],
        "correlationData": { "antecedents": ["A1", "A2"], "behaviors": ["B1", "B2"], "matrix": [[1,0], [0,1]] },
        "escalationPaths": [{ "path": ["krok1", "krok2"], "count": 5 }]
    }`;

     const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return response.text;
};

export const getProactivePlan = async (dataContext: string): Promise<string> => {
    const prompt = `Na podstawie danych: ${dataContext}, stwórz proaktywny plan dnia dla rodzica w Markdown, uwzględniający momenty na regenerację i redukcję stresorów.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
    });
    return response.text;
};

export const generateReplacementSkillPlan = async (behavior: string, func: string): Promise<string> => {
    const prompt = `Zachowanie trudne: ${behavior}. Funkcja: ${func}.
    Zaproponuj plan nauki umiejętności zastępczej (FCT/DRA) w duchu pozytywnego wsparcia behawioralnego.
    Zwróć JSON: { "replacementSkill": "Nazwa", "rationale": "Wyjaśnienie", "trainingPlan": [{ "step": 1, "title": "Krok", "description": "Opis" }] }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return response.text;
};