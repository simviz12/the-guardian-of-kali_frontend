/**
 * Policy and Risk domain types matching backend policy engine contracts.
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';

export type PolicyAction = 'AUTO_EXECUTE' | 'REQUIRE_CONFIRMATION' | 'BLOCK';

export interface PolicyDecision {
  action: PolicyAction;
  risk_level: RiskLevel;
  reason: string;
  command_text?: string;
  timestamp?: string;
}

export interface PolicyLogEntry {
  id?: number;
  command_id?: number;
  decision: PolicyAction;
  reason: string;
  risk_level?: RiskLevel;
  timestamp?: string;
}
