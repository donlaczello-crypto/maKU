
import React from 'react';
import { View } from '../../types';
import { Icon } from './Icon';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from '../../hooks/useTranslation';

interface HeaderProps {
    currentView: View;
    setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
    const { t } = useTranslation();
    return (
        <header className="bg-white shadow-md sticky top-0 z-10">
            <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {currentView !== View.Dashboard && (
                        <button
                            onClick={() => setView(View.Dashboard)}
                            className="text-slate-600 hover:text-sky-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                            aria-label={t('header.back_aria_label')}
                        >
                            <Icon name="back" />
                        </button>
                    )}
                     {/* Custom Typography Logo based on user request */}
                     <div className="flex flex-col leading-none select-none cursor-pointer group" onClick={() => setView(View.Dashboard)}>
                        {/* Main Title: "My Point!" - English, Child writing */}
                        <div className="flex items-end">
                            <span className="text-2xl md:text-3xl text-sky-600 transform -rotate-2 origin-bottom-left transition-transform group-hover:rotate-0 group-hover:scale-105" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                                My Point
                            </span>
                            <span className="text-2xl md:text-3xl text-sky-600 font-bold ml-0.5" style={{ fontFamily: "'Patrick Hand', cursive" }}>!</span>
                        </div>
                        
                        <div className="flex flex-col -mt-0.5 ml-1">
                             <div className="flex items-baseline space-x-1">
                                 {/* "Mój punkt myślenia" - Child writing */}
                                 <span className="text-[0.65rem] md:text-xs text-slate-400" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                                    Mój punkt myślenia
                                 </span>
                                 {/* ": Wasz punkt widzenia." - Adult formal writing */}
                                 <span className="text-[0.65rem] md:text-xs text-slate-500 font-serif italic" style={{ fontFamily: "'Lora', serif" }}>
                                    : Wasz punkt widzenia.
                                 </span>
                             </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                   <LanguageSelector />
                   <button
                        onClick={() => setView(View.PrivacySettings)}
                        className="text-slate-600 hover:text-sky-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                        aria-label={t('header.settings_aria_label')}
                   >
                       <Icon name="settings" />
                   </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
