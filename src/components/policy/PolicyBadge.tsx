/**
 * Policy safety indicator badge component (Safe, Risky, Blocked).
 */
import React from 'react';

export type PolicyStatus = 'safe' | 'risky' | 'blocked';

interface PolicyBadgeProps {
  status: PolicyStatus;
}

export const PolicyBadge: React.FC<PolicyBadgeProps> = ({ status }) => {
  const colors = {
    safe: 'bg-emerald-600 text-white',
    risky: 'bg-amber-600 text-white',
    blocked: 'bg-rose-600 text-white',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${colors[status]}`}>
      Policy: {status}
    </span>
  );
};
