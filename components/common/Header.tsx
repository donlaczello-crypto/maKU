
import React from 'react';
import { View } from '../../types';
import Icon from './Icon';
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
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
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
                     <h1 className="text-2xl font-bold text-sky-700">
                        PAS<span className="font-light text-slate-500">i</span>R
                    </h1>
                </div>
                <div className="flex items-center space-x-2">
                   <LanguageSelector />
                </div>
            </div>
        </header>
    );
};

export default Header;