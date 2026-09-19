import React, { useEffect } from 'react';

export interface IntroVideoModalProps {
  onComplete: () => void;
  videoSrc?: string;
}

export const IntroVideoModal: React.FC<IntroVideoModalProps> = ({
  onComplete,
}) => {

  const handleSkip = () => {
    onComplete();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-md">
      {/* Top Brand Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center space-x-3">
          <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_#34d399]" />
          <span className="text-sm md:text-base font-black tracking-widest uppercase text-emerald-400 font-mono drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
            The Guardian of Kali // System Initialization
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSkip}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 text-xs md:text-sm tracking-wide uppercase transition shadow-lg shadow-emerald-600/30 hover:shadow-emerald-500/50 active:scale-95 flex items-center space-x-2"
          >
            <span>Entrar al Sistema</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Static Logo Container */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center justify-center animate-pulse">
          {/* Custom SVG icon representing the system */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-48 h-48 text-emerald-500 opacity-80 mb-6 drop-shadow-[0_0_25px_rgba(52,211,153,0.3)]">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd" />
          </svg>
          <h1 className="text-4xl md:text-6xl font-black text-emerald-400 font-mono tracking-[0.2em] drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">
            KALI LINUX
          </h1>
          <p className="mt-4 text-zinc-400 font-mono text-lg tracking-widest">GUARDIAN CO-PILOT INITIALIZED</p>
        </div>
        
        {/* Subtle bottom gradient & quick prompt */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col md:flex-row justify-between items-center bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 pointer-events-none">
          <p className="text-xs md:text-sm text-zinc-400 font-mono tracking-wide mb-3 md:mb-0">
            Motor de Políticas Zero-Trust • Puente WSL2 Kali • Gemini 2.5 Flash
          </p>
          <div className="pointer-events-auto">
            <button
              onClick={handleSkip}
              className="text-xs text-zinc-400 hover:text-emerald-400 transition font-mono underline underline-offset-4"
            >
              Saltar Intro [Esc / Enter]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroVideoModal;

