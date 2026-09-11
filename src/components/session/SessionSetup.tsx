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
}

// Regex to validate IPv4, IPv4 CIDR, or domain FQDN
const IPV4_CIDR_REGEX =
  /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\/(3[0-2]|[12]?[0-9]))?$/;
const DOMAIN_REGEX =
  /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export const SessionSetup: React.FC<SessionSetupProps> = ({
  onSessionInitialized,
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
      setTargetError('Please enter a target IP address, CIDR range, or domain.');
      return;
    }

    if (!IPV4_CIDR_REGEX.test(trimmed) && !DOMAIN_REGEX.test(trimmed)) {
      setTargetError('Invalid format. Provide IPv4 (e.g. 10.10.10.15), CIDR (e.g. 192.168.1.0/24), or Domain (e.g. hackthebox.com).');
      return;
    }

    if (targets.some((t) => t.value.toLowerCase() === trimmed.toLowerCase())) {
      setTargetError('Target is already in the authorized scope list.');
      return;
    }

    setTargets((prev) => [
      ...prev,
      {
        value: trimmed,
        description: targetDescInput.trim() || 'Custom Authorized Scope',
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
      setTargetError('At least one authorized target IP, CIDR, or domain must be defined before initializing.');
      return;
    }

    // Generate UUID v4 for the session
    const generatedSessionId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

    const config: ActiveSessionConfig = {
      sessionId: generatedSessionId,
      user: operatorUser.trim() || 'carlos',
      operationMode,
      authorizedTargets: targets,
      startedAt: new Date().toISOString(),
    };

    onSessionInitialized(config);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 p-6 text-zinc-100">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-zinc-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <span className="font-mono text-lg font-bold">🛡️</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide text-zinc-100">
                The Guardian of Kali — Session Setup
              </h1>
              <p className="text-xs text-zinc-400">
                Define authorized target scopes and policy operation mode before unlocking terminal & AI co-pilot.
              </p>
            </div>
          </div>
          <span className="rounded bg-zinc-800 px-2.5 py-1 text-xs font-mono text-emerald-400 border border-zinc-700">
            WSL2 Security Gate
          </span>
        </div>

        {/* 1. Operator Information */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            1. Linux Operator Username
          </label>
          <input
            type="text"
            value={operatorUser}
            onChange={(e) => setOperatorUser(e.target.value)}
            placeholder="Operator username (e.g. carlos)"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none transition"
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            Commands from this user run as manual operator; AI commands run in WSL2 as restricted user <code className="text-zinc-400">ia-user</code>.
          </p>
        </div>

        {/* 2. Authorized Targets Scope (Zero-Trust Boundary) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              2. Authorized Target Scope (Zero-Trust Boundary)
            </label>
            <span className="text-[11px] text-emerald-400 font-mono">
              {targets.length} target{targets.length === 1 ? '' : 's'} defined
            </span>
          </div>

          {/* Quick Presets */}
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleAddPreset('10.10.10.0/24', 'HackTheBox Subnet')}
              className="rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-[11px] text-zinc-300 transition border border-zinc-700"
            >
              + HTB Subnet (10.10.10.0/24)
            </button>
            <button
              type="button"
              onClick={() => handleAddPreset('10.10.0.0/16', 'TryHackMe Network')}
              className="rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-[11px] text-zinc-300 transition border border-zinc-700"
            >
              + THM Network (10.10.0.0/16)
            </button>
            <button
              type="button"
              onClick={() => handleAddPreset('hackthebox.com', 'HTB Domain')}
              className="rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-[11px] text-zinc-300 transition border border-zinc-700"
            >
              + hackthebox.com
            </button>
            <button
              type="button"
              onClick={() => handleAddPreset('127.0.0.1', 'Localhost Diagnostic')}
              className="rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-[11px] text-zinc-300 transition border border-zinc-700"
            >
              + Localhost (127.0.0.1)
            </button>
          </div>

          {/* Add Target Input Form */}
          <form onSubmit={handleAddTarget} className="flex gap-2">
            <input
              type="text"
              value={targetInput}
              onChange={(e) => {
                setTargetInput(e.target.value);
                setTargetError(null);
              }}
              placeholder="e.g. 10.10.10.10, 192.168.1.0/24, example.htb"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none transition font-mono"
            />
            <input
              type="text"
              value={targetDescInput}
              onChange={(e) => setTargetDescInput(e.target.value)}
              placeholder="Description (optional)"
              className="w-44 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none transition"
            />
            <button
              type="submit"
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3.5 py-2 text-xs font-semibold text-zinc-200 border border-zinc-700 transition"
            >
              Add Scope
            </button>
          </form>

          {targetError && (
            <p className="mt-1.5 text-xs text-rose-400">{targetError}</p>
          )}

          {/* Target List Badges */}
          <div className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-lg bg-zinc-950 border border-zinc-800/80">
            {targets.length === 0 ? (
              <span className="text-xs text-zinc-500 italic p-1">
                No targets defined. The AI co-pilot will be restricted from executing remote scanning commands.
              </span>
            ) : (
              targets.map((t) => (
                <span
                  key={t.value}
                  className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-mono text-zinc-300 border border-zinc-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{t.value}</span>
                  {t.description && (
                    <span className="text-[10px] text-zinc-500 font-sans">
                      ({t.description})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveTarget(t.value)}
                    className="ml-1 text-zinc-500 hover:text-rose-400 font-sans"
                    title="Remove target"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* 3. Operation Mode Selector */}
        <div className="mb-8">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            3. Policy Operational Mode
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Suggestion Mode */}
            <div
              onClick={() => setOperationMode('suggestion')}
              className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                operationMode === 'suggestion'
                  ? 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-zinc-200">Suggestion Mode</span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The AI analyzes and proposes commands in distinct action cards. Commands above <strong className="text-zinc-200 font-mono">LOW</strong> risk strictly require operator confirmation before execution.
              </p>
            </div>

            {/* Autonomous Mode */}
            <div
              onClick={() => setOperationMode('autonomous')}
              className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                operationMode === 'autonomous'
                  ? 'border-amber-500 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50'
                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-zinc-200">Autonomous Mode</span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/30">
                  Advanced
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                <strong className="text-zinc-200 font-mono">LOW</strong> and <strong className="text-zinc-200 font-mono">MEDIUM</strong> risk commands auto-execute in WSL2 as <code className="text-zinc-300">ia-user</code>. <strong className="text-rose-400 font-mono">HIGH</strong> risk commands always require manual confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Action Initialization Button */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500">
            {targets.length === 0 ? (
              <span className="text-amber-400 font-medium animate-pulse">
                ⚠️ Add at least 1 target to define Zero-Trust scope
              </span>
            ) : (
              <span>
                Security Status: <span className="text-emerald-400 font-medium">Policy Engine Ready & Armed</span>
              </span>
            )}
          </div>
          <button
            onClick={handleInitializeSession}
            disabled={targets.length === 0}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 disabled:shadow-none transition-all hover:shadow-emerald-600/30 active:scale-[0.98]"
          >
            Initialize Secure Session →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionSetup;
