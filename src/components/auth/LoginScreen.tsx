import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';

interface LoginScreenProps {
  onLogin: (email: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t, theme, setTheme, language, setLanguage } = useAppContext();

  // Helper para gestionar usuarios en localStorage
  const getRegisteredUsers = (): Record<string, string> => {
    try {
      const stored = localStorage.getItem('guardian-registered-users');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validar correo
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError(t('login.error_email'));
      return;
    }

    // Validar contraseña
    if (!password || password.length < 6) {
      setError(t('login.error_password'));
      return;
    }

    const users = getRegisteredUsers();

    if (mode === 'register') {
      // Validar coincidencia de contraseñas
      if (password !== confirmPassword) {
        setError(t('login.error_password_match'));
        return;
      }

      // Validar si ya existe
      const normalizedEmail = email.trim().toLowerCase();
      if (users[normalizedEmail]) {
        setError(t('login.error_exists'));
        return;
      }

      // Guardar nuevo usuario
      users[normalizedEmail] = password;
      localStorage.setItem('guardian-registered-users', JSON.stringify(users));
      localStorage.setItem('guardian-user-email', normalizedEmail);

      setSuccess(t('login.success_register'));
      setTimeout(() => {
        onLogin(normalizedEmail);
      }, 700);
    } else {
      // Modo Login
      const normalizedEmail = email.trim().toLowerCase();
      const storedPassword = users[normalizedEmail];

      // Si no hay usuarios aún registrados en el sistema, permitir el primer acceso y registrarlo
      if (Object.keys(users).length === 0) {
        users[normalizedEmail] = password;
        localStorage.setItem('guardian-registered-users', JSON.stringify(users));
        localStorage.setItem('guardian-user-email', normalizedEmail);
        onLogin(normalizedEmail);
        return;
      }

      if (!storedPassword || storedPassword !== password) {
        setError(t('login.error_auth'));
        return;
      }

      localStorage.setItem('guardian-user-email', normalizedEmail);
      onLogin(normalizedEmail);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest text-on-surface items-center justify-center p-space-xl">
      
      {/* Top right controls */}
      <div className="absolute top-4 right-4 flex gap-space-sm z-50">
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface border border-outline-variant"
          title={t('settings.theme')}
        >
          <span className="material-symbols-outlined text-[18px]">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
        <button 
          onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
          className="px-2.5 py-1.5 rounded bg-surface-container hover:bg-surface-container-high transition-colors font-label-md text-xs font-bold text-on-surface flex items-center gap-1 border border-outline-variant"
          title={t('settings.language')}
        >
          <span className={language === 'es' ? 'text-primary font-black' : 'text-on-surface-variant'}>ES</span>
          <span className="text-outline-variant text-[10px]">|</span>
          <span className={language === 'en' ? 'text-primary font-black' : 'text-on-surface-variant'}>EN</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-surface-container-low border border-outline-variant rounded-xl p-space-xl shadow-2xl flex flex-col items-center relative overflow-hidden">
        {/* Glow indicator line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80"></div>

        <div className="w-16 h-16 mb-space-md rounded-full bg-surface-container-highest flex items-center justify-center border-2 border-primary border-opacity-50 shadow-inner">
          <span className="material-symbols-outlined text-[34px] text-primary">security</span>
        </div>
        
        <h1 className="font-headline-lg text-headline-lg text-primary mb-space-xs text-center tracking-tight">
          {t('login.title')}
        </h1>
        <p className="text-on-surface-variant font-body-sm text-body-sm mb-space-md text-center">
          {t('login.subtitle')}
        </p>

        {/* Tab switcher: Iniciar Sesión / Crear Cuenta */}
        <div className="w-full grid grid-cols-2 bg-surface-container p-1 rounded-lg border border-outline-variant mb-space-lg">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            className={`py-2 text-center font-label-md text-xs uppercase rounded transition-all font-semibold ${
              mode === 'login'
                ? 'bg-primary text-on-primary shadow'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t('login.tab_login')}
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            className={`py-2 text-center font-label-md text-xs uppercase rounded transition-all font-semibold ${
              mode === 'register'
                ? 'bg-primary text-on-primary shadow'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t('login.tab_register')}
          </button>
        </div>

        <form onSubmit={handleAuth} className="w-full flex flex-col gap-space-md">
          {/* Correo Electrónico */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-sm text-label-sm text-on-surface-variant uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">alternate_email</span>
              {t('login.email')}
            </label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@kali.local"
              className="w-full bg-surface-container-highest border border-outline-variant rounded px-space-md py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-body-md"
            />
          </div>

          {/* Contraseña */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-sm text-label-sm text-on-surface-variant uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">lock</span>
              {t('login.password')}
            </label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-container-highest border border-outline-variant rounded px-space-md py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-body-md"
            />
          </div>

          {/* Confirmar Contraseña (solo modo Registro) */}
          {mode === 'register' && (
            <div className="flex flex-col gap-space-xs animate-fadeIn">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
                {t('login.confirm_password')}
              </label>
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container-highest border border-outline-variant rounded px-space-md py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-body-md"
              />
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded bg-error-container/30 border border-error/50 text-error font-body-sm text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 rounded bg-primary/20 border border-primary/40 text-primary font-body-sm text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>{success}</span>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-primary text-on-primary font-label-md text-label-md uppercase py-3 rounded hover:bg-surface-tint transition-colors font-bold mt-space-xs flex items-center justify-center gap-2 shadow"
          >
            <span className="material-symbols-outlined text-[18px]">
              {mode === 'login' ? 'login' : 'how_to_reg'}
            </span>
            {mode === 'login' ? t('login.button') : t('login.register_button')}
          </button>
        </form>

        {/* Footer selector auxiliar */}
        <div className="mt-space-lg text-center font-body-sm text-xs text-on-surface-variant">
          {mode === 'login' ? (
            <span>
              {t('login.no_account')}{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                className="text-primary hover:underline font-semibold ml-1 cursor-pointer"
              >
                {t('login.switch_to_register')}
              </button>
            </span>
          ) : (
            <span>
              {t('login.has_account')}{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="text-primary hover:underline font-semibold ml-1 cursor-pointer"
              >
                {t('login.switch_to_login')}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
