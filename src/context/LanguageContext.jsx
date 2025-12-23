import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from './translations'; // Importar el diccionario

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Cargar idioma guardado o defecto español
  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'es');

  useEffect(() => {
    localStorage.setItem('app_lang', language);
  }, [language]);

  // Función de traducción
  const t = (key) => {
    // Si no encuentra la traducción, devuelve la clave como fallback
    return translations[language][key] || key;
  };

  const changeLanguage = (lang) => {
    if (['es', 'en', 'zh'].includes(lang)) {
        setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ t, language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
