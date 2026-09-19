/**
 * SessionSetup component.
 *
 * Initial configuration gatekeeper screen where the operator must define:
 * 1. Authorized target IP, CIDR subnet, or domain ranges (Zero-Trust scope).
 * 2. Operational mode (Suggestion mode vs. Autonomous mode).
 *
 * Terminal Console and AI Chat remain locked until session parameters are initialized.
 */
import React, { useState } from 'react';
import {
  ActiveSessionConfig,
  AuthorizedTargetConfig,
  OperationMode,
} from '../../types/session';

export interface SessionSetupProps {
  onSessionInitialized: (config: ActiveSessionConfig) => void;
  onReplayIntro?: () => void;
}

// Regex to validate IPv4, IPv4 CIDR, or domain FQDN
const IPV4_CIDR_REGEX =
  /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\/(3[0-2]|[12]?[0-9]))?$/;
const DOMAIN_REGEX =
  /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export const SessionSetup: React.FC<SessionSetupProps> = ({
  onSessionInitialized,
  onReplayIntro,
}) => {
  const [targetInput, setTargetInput] = useState('');
  const [targetDescInput, setTargetDescInput] = useState('');
  const [targetError, setTargetError] = useState<string | null>(null);

  const [targets, setTargets] = useState<AuthorizedTargetConfig[]>([
    { value: '10.10.10.10', description: 'HackTheBox Target' },
  ]);

  const [operationMode, setOperationMode] = useState<OperationMode>('suggestion');
  const [operatorUser, setOperatorUser] = useState('carlos');

  // Quick preset targets
  const handleAddPreset = (value: string, description: string) => {
    if (!targets.some((t) => t.value.toLowerCase() === value.toLowerCase())) {
      setTargets((prev) => [...prev, { value, description }]);
    }
  };

  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = targetInput.trim();
    if (!trimmed) {
      setTargetError('Por favor ingresa una IP, rango CIDR o dominio objetivo.');
      return;
    }

    if (!IPV4_CIDR_REGEX.test(trimmed) && !DOMAIN_REGEX.test(trimmed)) {
      setTargetError('Formato inválido. Usa IPv4 (ej. 10.10.10.15), CIDR (ej. 192.168.1.0/24) o Dominio (ej. hackthebox.com).');
      return;
    }

    if (targets.some((t) => t.value.toLowerCase() === trimmed.toLowerCase())) {
      setTargetError('Este objetivo ya está en la lista de alcance autorizado.');
      return;
    }

    setTargets((prev) => [
      ...prev,
      {
        value: trimmed,
        description: targetDescInput.trim() || 'Alcance Personalizado',
      },
    ]);
    setTargetInput('');
    setTargetDescInput('');
    setTargetError(null);
  };

  const handleRemoveTarget = (targetValue: string) => {
    setTargets((prev) => prev.filter((t) => t.value !== targetValue));
  };

  const handleInitializeSession = () => {
    if (targets.length === 0) {
      setTargetError('Debes definir al menos un objetivo autorizado (IP, CIDR o dominio) antes de iniciar.');
      return;
    }

    const previousSessionId = localStorage.getItem('guardian-session-id');
    const finalSessionId = previousSessionId || (
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          })
    );

    const config: ActiveSessionConfig = {
      sessionId: finalSessionId,
      user: operatorUser.trim() || 'carlos',
      operationMode,
      authorizedTargets: targets,
      startedAt: new Date().toISOString(),
    };

    onSessionInitialized(config);
  };

  const handleStartNewSession = () => {
    localStorage.removeItem('guardian-session-id');
    handleInitializeSession();
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 p-6 md:p-10 text-zinc-100">
      <div className="w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-900/95 p-8 md:p-10 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800 pb-6 gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <span className="font-mono text-2xl">🛡️</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-wide text-zinc-100">
                The Guardian of Kali — Configuración de Sesión
              </h1>
              <p className="text-sm text-zinc-400 mt-0.5">
                Define el alcance de objetivos autorizados y el modo de operación antes de desbloquear la terminal y el copiloto IA.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 self-end sm:self-center">
            {onReplayIntro && (
              <button
                type="button"
                onClick={onReplayIntro}
                className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 border border-zinc-700 transition flex items-center space-x-1.5"
                title="Play system intro video"
              >
                <span>🎬 Intro</span>
              </button>
            )}
            <span className="rounded-lg bg-zinc-800 px-3.5 py-1.5 text-xs md:text-sm font-mono text-emerald-400 border border-zinc-700 font-semibold shadow-inner">
              WSL2 Security Gate
            </span>
          </div>
        </div>

        {/* 1. Operator Information */}
        <div className="mb-8">
          <label className="block text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-300 mb-2.5">
            1. Nombre de Usuario del Operador Linux
          </label>
          <input
            type="text"
            value={operatorUser}
            onChange={(e) => setOperatorUser(e.target.value)}
            placeholder="Usuario operador (ej. carlos)"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition font-mono"
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            Los comandos de este usuario se ejecutan como operador manual; los comandos IA se ejecutan en WSL2 como usuario restringido <code className="text-zinc-400">ia-user</code>.
          </p>
        </div>

        {/* 2. Authorized Targets Scope (Zero-Trust Boundary) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-300">
              2. Alcance de Objetivos Autorizados (Frontera Zero-Trust)
            </label>
            <span className="text-xs md:text-sm text-emerald-400 font-mono font-semibold">
              {targets.length} objetivo{targets.length === 1 ? '' : 's'} definido{targets.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Quick Presets */}
          <div className="mb-3.5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => handleAddPreset('10.10.10.0/24', 'Subred HackTheBox')}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs md:text-sm text-zinc-200 transition border border-zinc-700 font-mono"
            >
              + Subred HTB (10.10.10.0/24)
            </button>
            <button
              type="button"
              onClick={() => handleAddPreset('10.10.0.0/16', 'Red TryHackMe')}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs md:text-sm text-zinc-200 transition border border-zinc-700 font-mono"
            >
              + Red THM (10.10.0.0/16)
            </button>
            <button
              type="button"
              onClick={() => handleAddPreset('hackthebox.com', 'Dominio HTB')}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs md:text-sm text-zinc-200 transition border border-zinc-700 font-mono"
            >
              + hackthebox.com
            </button>
            <button
              type="button"
              onClick={() => handleAddPreset('127.0.0.1', 'Diagnóstico Localhost')}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs md:text-sm text-zinc-200 transition border border-zinc-700 font-mono"
            >
              + Localhost (127.0.0.1)
            </button>
          </div>

          {/* Add Target Input Form */}
          <form onSubmit={handleAddTarget} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={targetInput}
              onChange={(e) => {
                setTargetInput(e.target.value);
                setTargetError(null);
              }}
              placeholder="ej. 10.10.10.10, 192.168.1.0/24, example.htb"
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm md:text-base text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition font-mono"
            />
            <input
              type="text"
              value={targetDescInput}
              onChange={(e) => setTargetDescInput(e.target.value)}
              placeholder="Descripción (opcional)"
              className="sm:w-52 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm md:text-base text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
            />
            <button
              type="submit"
              className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-5 py-3 text-sm font-bold text-zinc-100 border border-zinc-700 transition active:scale-95 shadow-md cursor-pointer"
            >
              Agregar Objetivo
            </button>
          </form>

          {targetError && (
            <p className="mt-2 text-xs md:text-sm text-rose-400 font-medium">{targetError}</p>
          )}

          {/* Target List Badges */}
          <div className="mt-3 flex flex-wrap gap-2.5 max-h-40 overflow-y-auto p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
            {targets.length === 0 ? (
              <span className="text-xs md:text-sm text-zinc-500 italic p-1">
                No hay objetivos definidos. El copiloto IA estará restringido de ejecutar comandos de escaneo remotos.
              </span>
            ) : (
              targets.map((t) => (
                <span
                  key={t.value}
                  className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs md:text-sm font-mono text-zinc-200 border border-zinc-700 shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  <span className="font-semibold">{t.value}</span>
                  {t.description && (
                    <span className="text-xs text-zinc-400 font-sans">
                      ({t.description})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveTarget(t.value)}
                    className="ml-1 text-zinc-400 hover:text-rose-400 font-sans text-base leading-none transition"
                    title="Eliminar objetivo"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* 3. Operation Mode Selector */}
        <div className="mb-10">
          <label className="block text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-300 mb-3">
            3. Modo de Operación de Política
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Suggestion Mode */}
            <div
              onClick={() => setOperationMode('suggestion')}
              className={`cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${
                operationMode === 'suggestion'
                  ? 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-2 ring-emerald-500/50'
                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-base md:text-lg font-bold text-zinc-100">Modo Sugerencia</span>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                  Recomendado
                </span>
              </div>
              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                La IA analiza y propone comandos en tarjetas de acción separadas. Los comandos con riesgo superior a <strong className="text-zinc-200 font-mono">BAJO</strong> requieren estrictamente la confirmación del operador antes de ejecutarse.
              </p>
            </div>

            {/* Autonomous Mode */}
            <div
              onClick={() => setOperationMode('autonomous')}
              className={`cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${
                operationMode === 'autonomous'
                  ? 'border-amber-500 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-2 ring-amber-500/50'
                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-base md:text-lg font-bold text-zinc-100">Modo Autónomo</span>
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                  Avanzado
                </span>
              </div>
              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                Los comandos de riesgo <strong className="text-zinc-200 font-mono">BAJO</strong> y <strong className="text-zinc-200 font-mono">MEDIO</strong> se autoejecutan en WSL2 como <code className="text-zinc-300 font-mono">ia-user</code>. Los comandos de riesgo <strong className="text-rose-400 font-mono">ALTO</strong> siempre requieren confirmación manual.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Action Initialization Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-zinc-800 gap-4">
          <div className="text-xs md:text-sm text-zinc-400">
            {targets.length === 0 ? (
              <span className="text-amber-400 font-medium animate-pulse">
                ⚠️ Agrega al menos 1 objetivo para definir el alcance Zero-Trust
              </span>
            ) : (
              <span>
                Estado de Seguridad: <span className="text-emerald-400 font-bold">Motor de Políticas Listo y Armado</span>
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {localStorage.getItem('guardian-session-id') && (
              <button
                onClick={handleInitializeSession}
                disabled={targets.length === 0}
                className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed px-6 py-3.5 text-sm md:text-base font-black text-white shadow-xl shadow-blue-600/25 disabled:shadow-none transition-all active:scale-[0.98] cursor-pointer"
              >
                Reanudar Sesión Anterior →
              </button>
            )}
            <button
              onClick={handleStartNewSession}
              disabled={targets.length === 0}
              className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed px-8 py-3.5 text-sm md:text-base font-black text-white shadow-xl shadow-emerald-600/25 disabled:shadow-none transition-all hover:shadow-emerald-500/40 active:scale-[0.98] cursor-pointer"
            >
              Iniciar {localStorage.getItem('guardian-session-id') ? 'Nueva' : 'Sesión'} Segura →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSetup;
