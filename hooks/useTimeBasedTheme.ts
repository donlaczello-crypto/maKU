import { useState, useEffect } from 'react';
import { useTranslation } from './useTranslation';

export const useTimeBasedTheme = () => {
    const { t, currentLanguage } = useTranslation();
    const [theme, setTheme] = useState({ themeClasses: '', greeting: '' });

    useEffect(() => {
        const date = new Date();
        const hour = date.getHours();
        const month = date.getMonth(); // 0-11

        let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
        let season: 'spring' | 'summer' | 'autumn' | 'winter';

        if (hour >= 5 && hour < 12) timeOfDay = 'morning';
        else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
        else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
        else timeOfDay = 'night';

        if (month >= 2 && month <= 4) season = 'spring';
        else if (month >= 5 && month <= 7) season = 'summer';
        else if (month >= 8 && month <= 10) season = 'autumn';
        else season = 'winter';

        let themeClasses = '';
        switch (timeOfDay) {
            case 'morning':
                themeClasses = 'bg-sky-50 text-slate-800';
                break;
            case 'afternoon':
                themeClasses = 'bg-amber-50 text-slate-800';
                break;
            case 'evening':
                themeClasses = 'bg-indigo-900 text-slate-200';
                break;
            case 'night':
                themeClasses = 'bg-slate-900 text-slate-300';
                break;
        }

        setTheme({
            themeClasses,
            greeting: t(`loyaltyProgram.greetings.${timeOfDay}`),
        });
    }, [t, currentLanguage]);

    return theme;
};
