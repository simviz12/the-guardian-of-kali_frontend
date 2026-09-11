/**
 * GlobalErrorBanner component.
 *
 * Displays actionable, color-coded diagnostic alert banners for:
 * - WSL Unavailable
 * - Claude AI API Failures
 * - FastAPI Backend Down
 * - Pydantic Validation Errors
 * - Zero-Trust Policy Violations
 */
import React, { useState } from 'react';
import { AppErrorDetails } from '../../types/errors';

export interface GlobalErrorBannerProps {
  error: AppErrorDetails;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
}

export const GlobalErrorBanner: React.FC<GlobalErrorBannerProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  compact = false,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Styling theme depending on error kind
  const getTheme = () => {
    switch (error.kind) {
      case 'WSL_UNAVAILABLE':
        return {
          container: 'border-orange-500/50 bg-orange-950/40 text-orange-200',
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          icon: '🐧',
          accent: 'text-orange-400',
          button: 'bg-orange-600 hover:bg-orange-500 text-white',
        };
      case 'CLAUDE_API_FAILURE':
        return {
          container: 'border-purple-500/50 bg-purple-950/40 text-purple-200',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: '🤖',
          accent: 'text-purple-400',
          button: 'bg-purple-600 hover:bg-purple-500 text-white',
        };
      case 'BACKEND_OFFLINE':
        return {
          container: 'border-red-500/50 bg-red-950/40 text-red-200',
          badge: 'bg-red-500/20 text-red-300 border-red-500/40',
          icon: '⚡',
          accent: 'text-red-400',
          button: 'bg-red-600 hover:bg-red-500 text-white',
        };
      case 'VALIDATION_ERROR':
        return {
          container: 'border-amber-500/50 bg-amber-950/40 text-amber-200',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: '📋',
          accent: 'text-amber-400',
          button: 'bg-amber-600 hover:bg-amber-500 text-white',
        };
      case 'POLICY_VIOLATION':
        return {
          container: 'border-rose-600/50 bg-rose-950/40 text-rose-200',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: '🛡️',
          accent: 'text-rose-400',
          button: 'bg-rose-700 hover:bg-rose-600 text-white',
        };
      default:
        return {
          container: 'border-zinc-700 bg-zinc-900 text-zinc-300',
          badge: 'bg-zinc-800 text-zinc-400 border-zinc-700',
          icon: '⚠️',
          accent: 'text-zinc-400',
          button: 'bg-zinc-800 hover:bg-zinc-700 text-white',
        };
    }
  };

  const theme = getTheme();

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-2.5 rounded-md border p-2.5 text-xs ${theme.container} ${className}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span>{theme.icon}</span>
          <div className="truncate">
            <strong className="font-semibold">{error.title}: </strong>
            <span>{error.message}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onRetry && (
            <button
              onClick={onRetry}
              className={`rounded px-2 py-0.5 text-xs font-medium transition ${theme.button}`}
            >
              {error.actionLabel || 'Retry'}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-zinc-400 hover:text-white px-1"
              title="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-4 shadow-xl backdrop-blur-sm transition-all ${theme.container} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-xl select-none">{theme.icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-zinc-100">{error.title}</h4>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border ${theme.badge}`}
              >
                {error.kind.replace('_', ' ')}
              </span>
              {error.statusCode && (
                <span className="text-[10px] font-mono text-zinc-400">
                  HTTP {error.statusCode}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs leading-relaxed text-zinc-300">{error.message}</p>

            {/* Action Hint */}
            {error.actionHint && (
              <div className="mt-2.5 rounded bg-black/40 p-2 border border-zinc-800 font-mono text-[11px] text-zinc-300">
                <span className={`font-bold mr-1 ${theme.accent}`}>Recommendation:</span>
                <code>{error.actionHint}</code>
              </div>
            )}

            {/* Pydantic Field Validation Errors List */}
            {error.fieldErrors && error.fieldErrors.length > 0 && (
              <div className="mt-2 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Validation details:
                </span>
                <ul className="list-disc list-inside text-xs space-y-0.5 text-zinc-300 font-mono">
                  {error.fieldErrors.map((fe, idx) => (
                    <li key={idx}>
                      <span className="text-amber-400 font-bold">{fe.field}</span>: {fe.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {onRetry && (
            <button
              onClick={onRetry}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold shadow transition ${theme.button}`}
            >
              {error.actionLabel || 'Retry'}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-zinc-400 hover:text-zinc-100 p-1 text-sm rounded hover:bg-white/5 transition"
              title="Dismiss alert"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Technical Details Collapsible */}
      {error.technicalDetails && (
        <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 underline transition"
          >
            {showTechnicalDetails ? '▼ Hide technical details' : '▶ Show technical details'}
          </button>
          {showTechnicalDetails && (
            <pre className="mt-2 p-2 bg-black/60 rounded text-[10px] font-mono text-zinc-400 max-h-32 overflow-y-auto whitespace-pre-wrap border border-zinc-800">
              {error.technicalDetails}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
