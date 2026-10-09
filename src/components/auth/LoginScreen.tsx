import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';

interface LoginScreenProps {
  onLogin: (email: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { t, theme, setTheme, language, setLanguage } = useAppContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError(t('login.error'));
      return;
    }
    setError('');
    localStorage.setItem('guardian-user-email', email);
    onLogin(email);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest text-on-surface items-center justify-center p-space-xl">
      
      {/* Top right controls */}
      <div className="absolute top-4 right-4 flex gap-space-sm">
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface"
          title={t('settings.theme')}
        >
          <span className="material-symbols-outlined">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
        <button 
          onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
          className="p-2 rounded bg-surface-container hover:bg-surface-container-high transition-colors font-label-md uppercase font-bold text-on-surface"
          title={t('settings.language')}
        >
          {language}
        </button>
      </div>

      <div className="w-full max-w-md bg-surface-container-low border border-outline-variant rounded-xl p-space-xl shadow-2xl flex flex-col items-center">
        <div className="w-20 h-20 mb-space-md rounded-full bg-surface-container-highest flex items-center justify-center border-2 border-primary border-opacity-50">
          <span className="material-symbols-outlined text-[40px] text-primary">security</span>
        </div>
        
        <h1 className="font-headline-lg text-headline-lg text-primary mb-space-xs text-center">
          {t('login.title')}
        </h1>
        <p className="text-on-surface-variant font-body-sm text-body-sm mb-space-lg text-center">
          {t('login.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-sm text-label-sm text-on-surface-variant uppercase">
              {t('login.email')}
            </label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@kali.local"
              className="w-full bg-surface-container-highest border border-outline-variant rounded px-space-md py-2 text-on-surface focus:outline-none focus:border-primary transition-colors font-body-md"
            />
            {error && <span className="text-error font-body-sm text-xs">{error}</span>}
          </div>

          <button 
            type="submit"
            className="w-full bg-primary text-on-primary font-label-md text-label-md uppercase py-3 rounded hover:bg-primary-fixed transition-colors font-bold mt-space-sm"
          >
            {t('login.button')}
          </button>
        </form>
      </div>
    </div>
  );
};
