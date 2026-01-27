"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, Language } from "./translations";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof typeof translations['en']) => string;
    dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // Initialize from localStorage or default to 'en', but must handle hydration
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        const stored = localStorage.getItem('language') as Language;
        if (stored && (stored === 'en' || stored === 'ar')) {
            setLanguageState(stored);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
        // Update document direction
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    };

    // Sync direction on mount/change
    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    const t = (key: keyof typeof translations['en']) => {
        return translations[language][key] || key;
    };

    const dir = language === 'ar' ? 'rtl' : 'ltr';

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
