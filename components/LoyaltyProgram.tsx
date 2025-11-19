
import React, { useState, useEffect } from 'react';
import { Sticker, FamilyActivity } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { generateStickerImage, generateFamilyActivity } from '../services/geminiService';
import { Icon } from './common/Icon';
import { useTimeBasedTheme } from '../hooks/useTimeBasedTheme';

// Custom hook for simplified state management with localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}

const stickerPrompts = ["uśmiechnięte słońce", "przyjazny lew", "tańczący robot", "latająca rakieta kosmiczna", "magiczny jednorożec", "wesoła pszczoła", "superbohater miś"];
const REWARD_THRESHOLD = 5;

const LoyaltyProgram: React.FC = () => {
    const { t } = useTranslation();
    const { greeting } = useTimeBasedTheme();
    
    const [stickers, setStickers] = useLocalStorage<Sticker[]>('mypoint_stickers', []);
    const [lastEarnedDate, setLastEarnedDate] = useLocalStorage<string | null>('mypoint_lastEarnedDate', null);
    const [printHistory, setPrintHistory] = useLocalStorage<Record<string, string>>('mypoint_printHistory', {});
    const [familyActivity, setFamilyActivity] = useLocalStorage<FamilyActivity | null>('mypoint_familyActivity', null);
    
    const [isLoadingSticker, setIsLoadingSticker] = useState(false);
    const [isLoadingActivity, setIsLoadingActivity] = useState(false);
    const [error, setError] = useState('');

    const isToday = (dateString: string | null) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const today = new Date();
        return date.getFullYear() === today.getFullYear() &&
               date.getMonth() === today.getMonth() &&
               date.getDate() === today.getDate();
    };

    const canEarnSticker = !isToday(lastEarnedDate);
    
    const handleEarnSticker = async () => {
        if (!canEarnSticker) return;
        
        setIsLoadingSticker(true);
        setError('');
        try {
            const prompt = stickerPrompts[Math.floor(Math.random() * stickerPrompts.length)];
            const { base64, mimeType } = await generateStickerImage(prompt);
            
            const newSticker: Sticker = {
                id: `sticker_${Date.now()}`,
                imageBase64: base64,
                name: prompt,
                earnedDate: new Date().toISOString(),
            };
            
            setStickers(prev => [...prev, newSticker]);
            setLastEarnedDate(new Date().toISOString());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nie udało się wygenerować naklejki.');
        } finally {
            setIsLoadingSticker(false);
        }
    };
    
    const handlePrintSticker = (sticker: Sticker) => {
        if (isToday(printHistory[sticker.id])) {
            alert(t('loyaltyProgram.printed_today'));
            return;
        }

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head><title>${t('loyaltyProgram.print_sticker')}</title>
                    <style>
                        @media print { body { -webkit-print-color-adjust: exact; } }
                        body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                        img { max-width: 90%; max-height: 90%; object-fit: contain; }
                    </style>
                    </head>
                    <body>
                        <img src="data:image/jpeg;base64,${sticker.imageBase64}" alt="${sticker.name}" />
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);

            setPrintHistory(prev => ({ ...prev, [sticker.id]: new Date().toISOString() }));
        }
    };

    const handleUnlockActivity = async () => {
        setIsLoadingActivity(true);
        setError('');
        try {
            const result = await generateFamilyActivity();
            const activity: FamilyActivity = JSON.parse(result);
            setFamilyActivity(activity);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nie udało się odblokować aktywności.');
        } finally {
            setIsLoadingActivity(false);
        }
    };

    const stickersToNextReward = REWARD_THRESHOLD - (stickers.length % REWARD_THRESHOLD);
    const canUnlockReward = stickers.length > 0 && stickers.length % REWARD_THRESHOLD === 0;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-1">{greeting}</h2>
            <p className="text-lg opacity-80 mb-6">{t('loyaltyProgram.title')}</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sticker Earning & Rewards */}
                <div className="space-y-8">
                    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-sky-600 dark:text-sky-400 mb-4">{t('loyaltyProgram.earn_sticker_button')}</h3>
                        <button 
                            onClick={handleEarnSticker}
                            disabled={!canEarnSticker || isLoadingSticker}
                            className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                        >
                            {isLoadingSticker ? t('loyaltyProgram.earning_sticker') : (canEarnSticker ? t('loyaltyProgram.earn_sticker_button') : t('loyaltyProgram.sticker_earned_today'))}
                        </button>
                    </div>

                    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-teal-600 dark:text-teal-400 mb-4">{t('loyaltyProgram.family_rewards_title')}</h3>
                        {familyActivity && (
                            <div className="bg-teal-50 dark:bg-teal-900/50 p-4 rounded-lg mb-4">
                                <h4 className="font-bold">{familyActivity.title}</h4>
                                <p className="text-sm opacity-90">{familyActivity.description}</p>
                            </div>
                        )}
                        <button
                            onClick={handleUnlockActivity}
                            disabled={!canUnlockReward || isLoadingActivity}
                            className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {isLoadingActivity ? t('loyaltyProgram.unlocking_activity') : t('loyaltyProgram.unlock_activity_button')}
                        </button>
                        {!canUnlockReward && (
                            <p className="text-center text-sm opacity-70 mt-2">
                                {t('loyaltyProgram.collect_more_stickers', { count: stickersToNextReward })}
                            </p>
                        )}
                    </div>
                </div>

                {/* Sticker Collection */}
                <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold mb-4">{t('loyaltyProgram.your_stickers')}</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2 bg-slate-100/50 dark:bg-slate-900/50 rounded-lg">
                        {stickers.length > 0 ? stickers.map(sticker => (
                            <div key={sticker.id} className="relative aspect-square bg-white dark:bg-slate-800 rounded-lg shadow-sm p-1 flex flex-col items-center justify-center">
                                <img src={`data:image/jpeg;base64,${sticker.imageBase64}`} alt={sticker.name} className="w-full h-full object-contain" />
                                <button
                                    onClick={() => handlePrintSticker(sticker)}
                                    disabled={isToday(printHistory[sticker.id])}
                                    className="absolute bottom-1 right-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-bold py-1 px-2 rounded-md transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isToday(printHistory[sticker.id]) ? t('loyaltyProgram.printed_today') : t('loyaltyProgram.print_sticker')}
                                </button>
                            </div>
                        )).reverse() : <p className="col-span-full text-center p-8 opacity-70">{t('dashboard.cards.loyaltyProgram.description')}</p>}
                    </div>
                </div>
            </div>
            {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg text-sm mt-4 text-center">{error}</p>}
        </div>
    );
};

export default LoyaltyProgram;