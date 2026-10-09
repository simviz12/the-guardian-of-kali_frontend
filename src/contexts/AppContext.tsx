import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type Language = 'es' | 'en';

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  es: {
    'app.title': 'THE GUARDIAN OF KALICHE',
    'app.native': 'NATIVO WSL2',
    'app.scope': 'ALCANCE',
    'app.status.ok': 'API OK',
    'app.status.error': 'API ERROR',
    'nav.terminal': 'TERMINAL',
    'nav.history': 'HISTORIAL',
    'nav.settings': 'AJUSTES',
    'nav.guide': 'GUÍA',
    'nav.logout': 'SALIR DE SESIÓN',
    'footer.tunnel': 'TÚNEL: TUN0 (SEGURO)',
    'footer.session': 'ESTADO DE SESIÓN: PROTEGIDO',
    'login.title': 'Acceso Restringido',
    'login.subtitle': 'Por favor, ingrese sus credenciales para continuar.',
    'login.email': 'Correo Electrónico',
    'login.button': 'Entrar al Sistema',
    'login.error': 'Por favor ingrese un correo válido',
    'chat.placeholder': 'Escribe tu mensaje...',
    'chat.send': 'ENVIAR',
    'history.title': 'Registro de Auditoría',
    'history.empty': 'No hay comandos registrados aún.',
    'settings.title': 'Ajustes del Sistema',
    'settings.theme': 'Tema Visual',
    'settings.language': 'Idioma',
    'session.setup': 'Configuración de Sesión'
  },
  en: {
    'app.title': 'THE GUARDIAN OF KALICHE',
    'app.native': 'WSL2 NATIVE',
    'app.scope': 'SCOPE',
    'app.status.ok': 'API OK',
    'app.status.error': 'API ERROR',
    'nav.terminal': 'TERMINAL',
    'nav.history': 'HISTORY',
    'nav.settings': 'SETTINGS',
    'nav.guide': 'GUIDE',
    'nav.logout': 'LOGOUT',
    'footer.tunnel': 'TUNNEL: TUN0 (SECURE)',
    'footer.session': 'SESSION STATUS: PROTECTED',
    'login.title': 'Restricted Access',
    'login.subtitle': 'Please enter your credentials to continue.',
    'login.email': 'Email Address',
    'login.button': 'Enter System',
    'login.error': 'Please enter a valid email',
    'chat.placeholder': 'Type your message...',
    'chat.send': 'SEND',
    'history.title': 'Audit Log',
    'history.empty': 'No commands logged yet.',
    'settings.title': 'System Settings',
    'settings.theme': 'Visual Theme',
    'settings.language': 'Language',
    'session.setup': 'Session Setup'
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'dark';
  });
  
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'es';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('language', newLang);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const t = (key: string): string => {
    return (translations[language] as any)[key] || key;
  };

  return (
    <AppContext.Provider value={{ theme, setTheme, language, setLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
