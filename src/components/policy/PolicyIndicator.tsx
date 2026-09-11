/**
 * PolicyIndicator component.
 *
 * Displays a traffic-light-style indicator (green/yellow/red) based on
 * RiskLevel and PolicyDecision, with an accessible, interactive tooltip
 * showing the exact triggering reason from policy_logs.
 */
import React, { useState } from 'react';
import { PolicyDecision, RiskLevel, PolicyAction } from '../../types/policy';

export interface PolicyIndicatorProps {
  decision?: PolicyDecision | null;
  riskLevel?: RiskLevel;
  action?: PolicyAction;
  reason?: string;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

type TrafficLightColor = 'green' | 'yellow' | 'red';

const determineTrafficLight = (
  risk?: RiskLevel,
  action?: PolicyAction
): TrafficLightColor => {
  // Red light: blocked or high risk
  if (action === 'BLOCK' || risk === 'BLOCKED' || risk === 'HIGH') {
    return 'red';
  }
  // Yellow light: requires manual confirmation or medium risk
  if (action === 'REQUIRE_CONFIRMATION' || risk === 'MEDIUM') {
    return 'yellow';
  }
  // Green light: safe, low risk or auto-execute
  return 'green';
};

export const PolicyIndicator: React.FC<PolicyIndicatorProps> = ({
  decision,
  riskLevel: explicitRisk,
  action: explicitAction,
  reason: explicitReason,
  className = '',
  showLabel = true,
  size = 'md',
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  // Extract values preferring the full decision object when present
  const effectiveRisk: RiskLevel = decision?.risk_level || explicitRisk || 'LOW';
  const effectiveAction: PolicyAction = decision?.action || explicitAction || 'AUTO_EXECUTE';
  const effectiveReason: string =
    decision?.reason ||
    explicitReason ||
    'Command passed standard policy validation checks.';

  const lightColor = determineTrafficLight(effectiveRisk, effectiveAction);

  // Styling maps based on the traffic light color
  const colorConfig: Record<
    TrafficLightColor,
    {
      label: string;
      activeGlow: string;
      dotBg: string;
      textBadge: string;
      badgeBorder: string;
      housingBorder: string;
    }
  > = {
    green: {
      label: 'Safe',
      activeGlow: 'bg-emerald-500 shadow-[0_0_10px_#10b981]',
      dotBg: 'bg-emerald-400',
      textBadge: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/30 bg-emerald-950/40',
      housingBorder: 'border-emerald-500/40',
    },
    yellow: {
      label: 'Caution',
      activeGlow: 'bg-amber-400 shadow-[0_0_10px_#f59e0b]',
      dotBg: 'bg-amber-400',
      textBadge: 'text-amber-400',
      badgeBorder: 'border-amber-500/30 bg-amber-950/40',
      housingBorder: 'border-amber-500/40',
    },
    red: {
      label: 'Blocked / High Risk',
      activeGlow: 'bg-rose-500 shadow-[0_0_10px_#f43f5e] animate-pulse',
      dotBg: 'bg-rose-400',
      textBadge: 'text-rose-400',
      badgeBorder: 'border-rose-500/30 bg-rose-950/40',
      housingBorder: 'border-rose-500/40',
    },
  };

  const current = colorConfig[lightColor];

  // Size configurations
  const sizeConfig = {
    sm: {
      orb: 'w-2 h-2',
      gap: 'gap-1',
      housing: 'px-1.5 py-0.5',
      text: 'text-[10px]',
    },
    md: {
      orb: 'w-2.5 h-2.5',
      gap: 'gap-1.5',
      housing: 'px-2 py-1',
      text: 'text-xs',
    },
    lg: {
      orb: 'w-3.5 h-3.5',
      gap: 'gap-2',
      housing: 'px-3 py-1.5',
      text: 'text-sm',
    },
  }[size];

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
      onFocus={() => setIsTooltipVisible(true)}
      onBlur={() => setIsTooltipVisible(false)}
      tabIndex={0}
      role="status"
      aria-label={`Policy Status: ${current.label}. ${effectiveReason}`}
    >
      {/* Traffic Light Housing */}
      <div
        className={`inline-flex items-center ${sizeConfig.gap} ${sizeConfig.housing} rounded-full border bg-zinc-900/90 backdrop-blur-sm cursor-help transition-all duration-200 hover:border-zinc-500 ${current.badgeBorder}`}
      >
        {/* Red Light */}
        <span
          className={`rounded-full transition-all duration-300 ${sizeConfig.orb} ${
            lightColor === 'red'
              ? current.activeGlow
              : 'bg-rose-950/60 opacity-30'
          }`}
        />
        {/* Yellow Light */}
        <span
          className={`rounded-full transition-all duration-300 ${sizeConfig.orb} ${
            lightColor === 'yellow'
              ? current.activeGlow
              : 'bg-amber-950/60 opacity-30'
          }`}
        />
        {/* Green Light */}
        <span
          className={`rounded-full transition-all duration-300 ${sizeConfig.orb} ${
            lightColor === 'green'
              ? current.activeGlow
              : 'bg-emerald-950/60 opacity-30'
          }`}
        />

        {/* Optional Status Label */}
        {showLabel && (
          <span
            className={`font-semibold tracking-wider uppercase ml-1 ${sizeConfig.text} ${current.textBadge}`}
          >
            {effectiveRisk}
          </span>
        )}
      </div>

      {/* Floating Tooltip displaying exact policy_logs reason */}
      {isTooltipVisible && (
        <div
          role="tooltip"
          className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-50 w-72 p-3 rounded-lg bg-zinc-950 border border-zinc-700 shadow-2xl text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${current.dotBg}`} />
              <span className="text-xs font-bold text-zinc-200 tracking-wide uppercase">
                Policy Reason
              </span>
            </div>
            <span
              className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border ${current.badgeBorder} ${current.textBadge}`}
            >
              {effectiveAction}
            </span>
          </div>

          {/* Triggering reason from policy_logs */}
          <p className="text-xs text-zinc-300 font-mono leading-relaxed break-words">
            {effectiveReason}
          </p>

          {/* Metadata Footer */}
          <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-sans">
            <span>Risk Level: <strong className="text-zinc-400 font-mono">{effectiveRisk}</strong></span>
            <span>Security Engine Gate</span>
          </div>

          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-zinc-700" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-4 border-transparent border-t-zinc-950" />
        </div>
      )}
    </div>
  );
};

export default PolicyIndicator;
