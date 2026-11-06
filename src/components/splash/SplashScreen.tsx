import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';

export interface SplashScreenProps {
  /** Current backend connectivity state, driven by the health poll in App. */
  backendStatus: 'online' | 'offline' | 'checking';
  /** Invoked once the splash has finished (backend validated or user skipped). */
  onDone: () => void;
}

/**
 * Animated welcome screen shown while the backend/socket connection is validated.
 *
 * Plays the bundled intro clip (with a graceful CSS-animated fallback) and keeps
 * the user informed of the connection state. Transitions automatically to the
 * main view once the backend reports healthy and a minimum display time elapsed.
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ backendStatus, onDone }) => {
  const { t } = useAppContext();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [minElapsed, setMinElapsed] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  // Enforce a minimum on-screen time so the animation never flashes by.
  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Safety fallback: never trap the user on the splash if the backend stays down.
  // The main app already surfaces an offline banner with a retry action.
  useEffect(() => {
    const maxTimer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(onDone, 600);
    }, 8000);
    return () => clearTimeout(maxTimer);
  }, [onDone]);

  // Transition to the app once the backend is healthy and the minimum time passed.
  useEffect(() => {
    if (backendStatus === 'online' && minElapsed && !fadingOut) {
      setFadingOut(true);
      const timer = setTimeout(onDone, 600); // allow the fade-out animation to play
      return () => clearTimeout(timer);
    }
  }, [backendStatus, minElapsed, fadingOut, onDone]);

  const statusLabel =
    backendStatus === 'online'
      ? t('splash.ready')
      : backendStatus === 'offline'
      ? t('splash.waiting')
      : t('splash.connecting');

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface-container-lowest transition-opacity duration-500 ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background intro animation (muted, best-effort autoplay). */}
      <video
        ref={videoRef}
        src="intro.mp4"
        autoPlay
        muted
        playsInline
        onError={() => videoRef.current?.remove()}
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest/40 via-surface-container-lowest/70 to-surface-container-lowest" />

      {/* Foreground branding + connection status. */}
      <div className="relative flex flex-col items-center gap-space-xl">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-surface-container text-primary font-terminal-stream text-4xl font-bold shadow-2xl animate-pulse">
          &gt;_
        </div>
        <div className="flex flex-col items-center gap-space-sm">
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-widest uppercase">
            {t('app.title')}
          </h1>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-[0.3em]">
            {t('app.native')}
          </span>
        </div>

        <div className="flex items-center gap-space-md mt-space-xl">
          <span
            className={`w-2 h-2 rounded-full ${
              backendStatus === 'online' ? 'bg-primary' : 'bg-tertiary animate-ping'
            }`}
          />
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            {statusLabel}
          </span>
        </div>

        {/* Indeterminate progress bar while connecting. */}
        <div className="w-64 h-1 rounded-full bg-surface-container overflow-hidden mt-space-md">
          <div
            className={`h-full bg-primary rounded-full transition-all duration-700 ${
              backendStatus === 'online' ? 'w-full' : 'w-1/3 animate-pulse'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
