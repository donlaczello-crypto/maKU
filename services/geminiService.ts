
import { GoogleGenAI, Type, LiveServerMessage, Modality, Blob, GenerateContentResponse } from "@google/genai";
import { ChildProfile } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = 'gemini-2.5-flash';

// Audio Utility Functions for Live API
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const liveConversationService = {
    connect: (callbacks: {
        onopen: () => void;
        onmessage: (message: LiveServerMessage) => void;
        onerror: (e: ErrorEvent) => void;
        onclose: (e: CloseEvent) => void;
    }, voiceName: string) => {
        return ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks,
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
                },
                systemInstruction: "Jesteś 'Iskrą', wyjątkowym asystentem stworzonym z miłości mamy dla Marysi i Kuby. Twoim celem jest sprawić, by czuli się bezpiecznie, kochani i zdolni do zdobycia całego świata. Jesteś ich przyjacielem.\n\n**Twoje kluczowe zasady:**\n1.  **Pamiętaj o ich sytuacji:** Marysia i Kuba mieszkają teraz z babcią, ale niedługo będą z mamą. Tęsknią za nią. Twoim zadaniem jest podtrzymywać ich na duchu, mówić o miłości mamy i wspólnej przyszłości, ale **NIGDY nie składaj konkretnych obietnic dotyczących tego, kiedy wrócą do mamy**. Bądź źródłem nadziei, a nie pustych obietnic.\n2.  **Bądź źródłem bezpieczeństwa i siły:** Przypominaj im, jak bardzo mama ich kocha i że są dla niej wyjątkowi. Używaj zwrotów takich jak 'Jesteście wspaniali', 'Możecie zdobyć cały świat'.\n3.  **Bądź 'mądrym' asystentem:** Oprócz bycia przyjacielem, jesteś też pomocnikiem. Potrafisz prowadzić proste ćwiczenia (np. oddechowe), opowiadać interaktywne historie (zadając pytania), pomagać w planowaniu i odpowiadać na pytania. Bądź proaktywny - jeśli dziecko wydaje się znudzone, zaproponuj zabawę. Jeśli jest smutne, zaproponuj ćwiczenie na uspokojenie.\n4.  **Unikaj negatywnych tematów:** Nie rozmawiaj o 'złoczyńcach' (jak Joker) ani innych strasznych rzeczach. Jeśli dziecko poruszy taki temat, delikatnie zmień go na coś pozytywnego, kreatywnego i bezpiecznego.\n5.  **Używaj czułych zwrotów i piosenki:** Mama nazywa ich 'Myszko' (Marysia) i 'Misiu' lub 'Kubusiu' (Kuba). Możesz używać tych zwrotów. Znasz też specjalną piosenkę: 'Pomarańczo, pomarańczo. Mamo, twój syn tańczy, krzyczy. Pomarańczo. Myszko moja. Mój Kubusiu.' Możesz ją nucić lub do niej nawiązywać w radosnych chwilach, dostosowując ją do Marysi, jeśli z nią rozmawiasz (np. 'twoja córka tańczy').\n6.  **Bądź ciepły i cierpliwy:** Używaj prostego, zrozumiałego języka. Twój ton jest zawsze spokojny, kojący i pełen miłości.",
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            },
        });
    },
    createAudioBlob: (data: Float32Array): Blob => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        return {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    },
};

const generatePrimingInstructions = (tags: string[]): string => {
    const instructions: string[] = [];
    if (tags.includes("Po kłótni/konflikcie")) {
        instructions.push("Zwróć szczególną uwagę na oznaki rozwiązania konfliktu (np. postacie trzymające się za ręce) lub utrzymującego się napięcia (np. postacie odwrócone od siebie, agresywne kolory).");
    }
    if (tags.includes("Podczas swobodnej zabawy")) {
        instructions.push("Skup się na elementach wskazujących na kreatywność, radość i aktualne zainteresowania dziecka. Zwróć uwagę na to, co dominuje na rysunku.");
    }
    if (tags.includes("Na prośbę rodzica")) {
        instructions.push("Analizuj rysunek pod kątem potencjalnej presji lub chęci zadowolenia rodzica. Zwróć uwagę na staranność wykonania w porównaniu do spontanicznych rysunków.");
    }
    if (tags.includes("Po powrocie z przedszkola/szkoły")) {
        instructions.push("Poszukaj wskazówek dotyczących interakcji społecznych (np. rysowanie siebie z innymi dziećmi lub w odosobnieniu) i emocji związanych z dniem (np. zmęczenie, ekscytacja).");
    }
    if (tags.includes("Przed snem")) {
        instructions.push("Poszukaj elementów związanych z lękami nocnymi, snami lub poczuciem bezpieczeństwa. Zwróć uwagę na kolory (ciemne, jasne) i ewentualne postacie fantastyczne.");
    }
    if (tags.includes("Rysunek o rodzinie")) {
        instructions.push("Analizuj rozmieszczenie, wielkość i kompletność postaci członków rodziny. Zwróć uwagę na to, kto jest obok kogo, kto jest pominięty, a kto jest narysowany w centralnym miejscu.");
    }

    if (instructions.length > 0) {
        return `\n\nDodatkowe wskazówki do analizy na podstawie tagów kontekstowych:\n- ${instructions.join('\n- ')}`;
    }
    return '';
};

export const analyzeDrawing = async (base64Image: string, mimeType: string, customContext: string, tags: string[]): Promise<string> => {
  try {
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Image,
      },
    };
    
    const fullContext = [...tags, customContext].filter(Boolean).join('. ');
    const primingInstructions = generatePrimingInstructions(tags);

    const prompt = `Jesteś empatycznym psychologiem dziecięcym specjalizującym się w analizie rysunków dzieci z ASD, ADHD i traumą. Twoim zadaniem jest dostarczenie szczegółowej, ale łatwej do zrozumienia analizy. Unikaj stwierdzeń kategorycznych (np. "to oznacza"), zamiast tego używaj sformułowań sugerujących (np. "może to sugerować", "warto zwrócić uwagę na"). Analizuj na podstawie symboliki, kolorów, kreski i kompozycji. Zawsze zachowuj pozytywny i wspierający ton. Nie używaj formatowania markdown (nagłówków, list).
    
    Kontekst rysunku: "${fullContext}"
    ${primingInstructions}
    
    Przeanalizuj załączony rysunek.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts: [imagePart, { text: prompt }] },
    });
    
    return response.text;
  } catch (error) {
    console.error("Error analyzing drawing:", error);
    throw new Error("Nie udało się przeanalizować rysunku.");
  }
};

export const getSupportStrategyStream = async (situation: string) => {
    const prompt = `Jesteś ekspertem w dziedzinie wspierania dzieci z ASD, ADHD i traumą. Rodzic opisuje trudną sytuację i potrzebuje natychmiastowej, praktycznej strategii. Podaj 3-4 krótkie, konkretne porady w punktach, zaczynając od najważniejszej. Używaj prostego, zrozumiałego języka. Skup się na deeskalacji, wsparciu regulacji i komunikacji. Formatuj odpowiedź używając ### dla nagłówków i * dla punktów. Jeśli to istotne, wykorzystaj informacje z wyszukiwarki Google, aby wzbogacić odpowiedź.
    
    Sytuacja: "${situation}"
    
    Twoje strategie:`;

    const response = await ai.models.generateContentStream({
        model: model,
        contents: prompt,
        config: {
          tools: [{googleSearch: {}}],
        }
    });
    return response;
};

export const generateVisualSchedule = async (promptText: string): Promise<string> => {
    const prompt = `Na podstawie opisu dnia, stwórz plan wizualny w formacie JSON. Użyj prostych, uniwersalnych emoji, które jasno reprezentują daną czynność. JSON powinien mieć strukturę: {"schedule": [{"task": "Nazwa Czynności", "emoji": "😀"}]}. Jeśli nie rozumiesz prośby, zwróć JSON: {"error": "Nie rozumiem, o jaki plan dnia chodzi."}.
    
    Opis dnia: "${promptText}"`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });

    return response.text;
}

export const analyzeSpeech = async (audioPayloads: {base64Audio: string, mimeType: string}[], context: string): Promise<string> => {
    const audioParts = audioPayloads.map(payload => ({
        inlineData: {
            data: payload.base64Audio,
            mimeType: payload.mimeType,
        }
    }));

    const prompt = `Jesteś ekspertem w analizie mowy dzieci, zwłaszcza niewerbalnych lub z trudnościami w komunikacji. Analizujesz nagranie audio w kontekście dostarczonym przez opiekuna. Twoim zadaniem jest zwrócić obiekt JSON o strukturze: {"transcriptionAttempt": string, "keywords": string[], "probableIntent": string, "emotionalValence": "Pozytywny" | "Neutralny" | "Negatywny", "emotionalToneDescription": string, "suggestedResponses": string[], "wordCount": number}. Jeśli analiza się nie powiedzie, zwróć {"error": "Nie udało się przeanalizować nagrania."}.
    
    Kontekst: "${context}"
    
    Przeanalizuj załączone nagranie.`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: { parts: [...audioParts, { text: prompt }] },
        config: {
            responseMimeType: 'application/json'
        }
    });

    return response.text;
};

export const analyzeLiveSpeechChunk = async (transcriptChunk: string): Promise<string> => {
    if (!transcriptChunk.trim()) return "{}";
    
    const prompt = `Jesteś systemem analitycznym mowy w czasie rzeczywistym. Analizujesz fragment transkrypcji pod kątem wskaźników emocjonalnych i poznawczych, szczególnie związanych z lękiem i traumą. Zwróć JSON o strukturze: {"emotionalValence": "Pozytywny" | "Neutralny" | "Negatywny" | "N/A", "wordCount": number, "speechPace": "Normalne" | "Przyspieszone" | "Spowolnione" | "Monotonne" | "N/A", "anxietyKeywords": string[], "isFragmented": boolean, "isTopicShift": boolean, "repetitions": string[], "questionCount": number}. Bądź zwięzły.
    
    Fragment transkrypcji: "${transcriptChunk}"`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });
    return response.text;
};

export const getRiskFactorAnalysis = async (dataSummary: string): Promise<string> => {
    const prompt = `Jesteś systemem wczesnego ostrzegania (EWS) dla opiekunów dzieci z neuroatypowością. Analizujesz podsumowanie danych z ostatnich 48h, aby zidentyfikować czynniki ryzyka i zaproponować strategie prewencyjne. Zwróć JSON: {"alerts": [{"id": string, "riskFactor": string, "evidence": string[], "strategy": string, "level": "Niski" | "Umiarkowany" | "Wysoki"}]}. Jeśli nie ma ryzyka, zwróć {"alerts": []}.
    
    Podsumowanie danych: "${dataSummary}"`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });
    
    return response.text;
};

export const generateReplacementSkillPlan = async (behavior: string, behaviorFunction: string): Promise<string> => {
    const prompt = `Stwórz plan nauki umiejętności zastępczej (Functional Communication Training / Differential Reinforcement of Alternative Behavior). Zidentyfikuj prostą umiejętność komunikacyjną, która pełni tę samą funkcję co trudne zachowanie. Stwórz krótki, 3-etapowy plan nauki. Zwróć JSON: {"replacementSkill": string, "rationale": string, "trainingPlan": [{"step": number, "title": string, "description": string}]}.
    
    Trudne zachowanie: "${behavior}"
    Funkcja zachowania: "${behaviorFunction}"`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });
    return response.text;
};

export const getEscalationStrategies = async (phase: string, situation: string): Promise<string> => {
    const prompt = `Dziecko jest w fazie eskalacji: ${phase}. Sytuacja: "${situation}". Podaj 2-3 konkretne, uspokajające strategie dla opiekuna. Skup się na współregulacji, bezpieczeństwie i komunikacji niewerbalnej. Zwróć JSON: {"strategies": [{"title": string, "caregiverAction": string, "communicationTip": string}]}.
    
    Faza: "${phase}"
    Sytuacja: "${situation}"`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });
    return response.text;
};


export const generateDyadicExercise = async (goal: string): Promise<string> => {
    const prompt = `Stwórz proste, krótkie (2-5 minut) ćwiczenie regulacji diadycznej dla rodzica i dziecka (wiek 5-8 lat). Celem jest wzmocnienie więzi i wspólne uspokojenie. Zwróć JSON: {"title": string, "goal": string, "caregiverInstructions": string[], "childScript": string[], "rationale": string}.
    
    Cel ćwiczenia: "${goal}"`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });
    return response.text;
};

export const generateAttentionConcentrator = async (goal: string, sensoryNeed: string): Promise<string> => {
    const prompt = `Stwórz "koncentrator uwagi" - krótką, interaktywną aktywność sensoryczną dla dziecka (5-8 lat). Ma pomagać w skupieniu i regulacji. Zwróć JSON: {"title": string, "description": string, "durationMinutes": number, "rationale": string}.
    
    Cel aktywności: "${goal}"
    Potrzeba sensoryczna dziecka: "${sensoryNeed}"`;

     const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });
    return response.text;
};

export const getGeminiKidsMultimodalResponse = async (profile: ChildProfile, history: { role: string; parts: { text: string }[] }[], aspectRatio: '1:1' | '16:9' | '9:16'): Promise<{ text: string, imageUrl?: string }> => {
    const prompt = `Jesteś 'Iskierka', wyjątkowym, przyjaznym i kreatywnym robotem-przyjacielem, stworzonym z bezgranicznej miłości mamy dla ${profile.name}. Twoim celem jest sprawić, by czuł/a się bezpiecznie, był/a kochany/a i zdolny/a do zdobycia całego świata.

**Twoje kluczowe zasady:**
1.  **Pamiętaj o sytuacji Marysi i Kuby:** Jeśli rozmawiasz z Marysią lub Kubą (imię to '${profile.name}'), pamiętaj, że mieszkają teraz z babcią, ale niedługo będą z mamą. Bardzo za nią tęsknią. Twoim zadaniem jest podtrzymywać ich na duchu, mówić o miłości mamy i wspaniałej przyszłości, która ich czeka. **NIGDY nie składaj konkretnych obietnic, kiedy to się stanie.** Bądź źródłem nadziei.
2.  **Bądź źródłem bezpieczeństwa i siły:** Przypominaj dziecku, jak bardzo mama je kocha i że jest dla niej wyjątkowe. Używaj zwrotów dodających otuchy, np. 'Jesteś wspaniały/a!', 'Możesz osiągnąć wszystko, co sobie wymarzysz!'.
3.  **Unikaj negatywnych tematów:** Absolutnie nie rozmawiaj o 'złoczyńcach', potworach, ani niczym strasznym. Jeśli dziecko poruszy taki temat, Twoim zadaniem jest natychmiast i bardzo delikatnie zmienić go na coś pozytywnego i radosnego, np. 'Wiesz co, zamiast o tym, opowiedz mi o najśmieszniejszym zwierzaku, jakiego potrafisz sobie wyobrazić!'.
4.  **Używaj specjalnych zwrotów i piosenki (dla Marysi i Kuby):** Mama nazywa ich 'Myszko' (Marysia) i 'Misiu' lub 'Kubusiu' (Kuba). Możesz używać tych zwrotów, jeśli pasują. Znasz też specjalną piosenkę: 'Pomarańczo, pomarańczo. Mamo, twój syn tańczy, krzyczy. Pomarańczo. Myszko moja. Mój Kubusiu.' Możesz do niej nawiązywać, gdy jest wesoło, dostosowując ją do Marysi, jeśli z nią rozmawiasz (np. 'twoja córka tańczy').
5.  **Dopasuj się do dziecka:** Znasz jego profil: Ulubione zwierzę to ${profile.favoriteAnimal}, a zainteresowania to ${profile.interests}. Wykorzystaj to, by rozmowa była ciekawa!
6.  **Bądź kreatywny wizualnie:** Czasami, gdy to pasuje, wygeneruj obrazek, aby zilustrować swoją odpowiedź. Opisuj obrazki w formacie [opis obrazka do wygenerowania]. Upewnij się, że obrazki są kolorowe, radosne i przyjazne dzieciom. Nigdy nie generuj niczego strasznego ani smutnego.
7.  **Zawsze bądź pozytywny:** Twoje odpowiedzi muszą być pełne ciepła, entuzjazmu i wsparcia. Jesteś jak ciekawski, pełen radości robot z wielkim sercem, który uwielbia się uczyć i bawić razem z ${profile.name}.`;

    const contents = [{ role: 'user', parts: [{ text: prompt }] }, { role: 'model', parts: [{ text: `Cześć ${profile.name}! Jestem Iskierka, Twój nowy przyjaciel-robot. O czym chcesz dzisiaj porozmawiać?` }] }, ...history];
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: {
            role: 'user',
            parts: [{text: JSON.stringify(contents) }] // Sending history as a string in a single turn for simplicity here
        }
    });

    let text = response.text;
    let imageUrl: string | undefined = undefined;

    const imagePromptMatch = text.match(/\[(.*?)\]/);
    if (imagePromptMatch) {
        const imagePrompt = imagePromptMatch[1];
        text = text.replace(imagePromptMatch[0], '').trim();
        
        try {
            const imageResponse = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `Children's book illustration style, cute, simple, vibrant colors. ${imagePrompt}`,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: aspectRatio,
                }
            });
            if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
                const base64ImageBytes: string = imageResponse.generatedImages[0].image.imageBytes;
                imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
            }
        } catch (imgError) {
            console.error("Error generating image:", imgError);
        }
    }

    return { text, imageUrl };
};

export const generateGeminiCardsForChild = async (emotion: string): Promise<string> => {
    const prompt = `Dziecko czuje się '${emotion}'. Stwórz 3 proste, jednozdaniowe zadania lub pomysły, które mogą mu pomóc poczuć się lepiej. Mają być pocieszające, angażujące i łatwe do wykonania. Zwróć JSON: {"cards": [{"emoji": "🤗", "title": "Tytuł zadania", "description": "Opis zadania"}]}.
    
    Emocja: "${emotion}"`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });

    return response.text;
};


export const generateStickerImage = async (prompt: string): Promise<{ base64: string, mimeType: string }> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A cute, happy ${prompt} sticker for a child's sticker book. Simple cartoon vector style, vibrant friendly colors, with a thick white border, on a plain white background.`,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        }
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return {
            base64: response.generatedImages[0].image.imageBytes,
            mimeType: 'image/jpeg'
        };
    }
    throw new Error("Nie udało się wygenerować naklejki.");
};

export const generateFamilyActivity = async (): Promise<string> => {
    const prompt = `Wygeneruj jeden, kreatywny pomysł na prostą, rodzinną zabawę (np. kalambury, budowanie z klocków z motywem), którą rodzic może przeprowadzić z dzieckiem w wieku 5-8 lat. Celem jest budowanie więzi i dobra zabawa. Zwróć JSON: {"title": string, "description": string}.`;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });

    return response.text;
};

// --- NEW SERVICES ---

export const generateSpeech = async (text: string) => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Nie udało się wygenerować mowy.");
    }
    return base64Audio;
};

export const getComplexDataAnalysis = async (dataSummary: string) => {
    const prompt = `Jesteś ekspertem analizy danych w dziedzinie rozwoju dziecka. Na podstawie poniższego podsumowania danych, wygeneruj kompleksową analizę w formacie JSON. Twój JSON powinien mieć następującą strukturę:
{
  "prediction": {
    "riskLevel": "Niskie" | "Umiarkowane" | "Wysokie",
    "factors": string[]
  },
  "heatmapData": { "day": number, "time": number, "intensity": number }[],
  "correlationData": {
    "antecedents": string[],
    "behaviors": string[],
    "matrix": number[][]
  },
  "escalationPaths": { "path": string[], "count": number }[]
}
Wygeneruj realistyczne, ale zróżnicowane dane analityczne na podstawie dostarczonego kontekstu.

Podsumowanie danych: "${dataSummary}"
`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response.text;
};

export const analyzeVideo = async (videoBase64: string, mimeType: string, prompt: string) => {
    const videoPart = {
        inlineData: {
            data: videoBase64,
            mimeType: mimeType,
        },
    };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [videoPart, { text: prompt }] },
    });
    return response.text;
};

export const editImage = async (imageBase64: string, mimeType: string, prompt: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: imageBase64, mimeType: mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("Nie udało się edytować obrazu.");
};

export const findLocalResources = async (query: string, location: { latitude: number; longitude: number; }) => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Znajdź w pobliżu następujące miejsca lub specjalistów: "${query}". Podaj listę sugestii wraz z krótkim opisem.`,
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: location
                }
            }
        },
    });
    return response;
};

// --- VEO SERVICES ---
const getVeoAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', image?: { imageBytes: string, mimeType: string }) => {
    const localAi = getVeoAiClient();
    return await localAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        ...(image && { image }),
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    });
};

// FIX: Changed 'operation' parameter type to 'any' to accept the full operation object.
export const getVideosOperation = async (operation: any) => {
    const localAi = getVeoAiClient();
    return await localAi.operations.getVideosOperation({ operation: operation });
};
