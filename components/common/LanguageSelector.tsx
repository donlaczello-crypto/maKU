
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
// Fix: Changed to named import for Icon.
import { Icon } from './Icon';

const LanguageSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setLanguage, currentLanguage } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const handleSelect = (lang: 'pl' | 'en') => {
    setLanguage(lang);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-600 hover:text-sky-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
        aria-label="Change language"
      >
        <Icon name="globe" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-slate-200 z-20">
          <button
            onClick={() => handleSelect('pl')}
            className={`block w-full text-left px-4 py-2 text-sm ${currentLanguage === 'pl' ? 'font-bold text-sky-600' : 'text-slate-700'} hover:bg-slate-100`}
          >
            Polski
          </button>
          <button
            onClick={() => handleSelect('en')}
            className={`block w-full text-left px-4 py-2 text-sm ${currentLanguage === 'en' ? 'font-bold text-sky-600' : 'text-slate-700'} hover:bg-slate-100`}
          >
            English
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;