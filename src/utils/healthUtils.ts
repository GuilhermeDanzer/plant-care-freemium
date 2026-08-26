/**
 * @file src/utils/healthUtils.ts
 * Pure business logic for interpreting plant health assessment API responses.
 * No React dependencies — fully unit-testable in isolation.
 */
import type { HealthAssessmentResponse } from "@/types/plant";
import type { InterpretedHealth } from "@/types/health";

export type { HealthState, InterpretedHealth } from "@/types/health";

// Threshold used to DECIDE state (perfect vs optimization).
export const DECISION_THRESHOLD = 0.15;
// Threshold used to DISPLAY cards (more permissive — even weak suggestions
// are useful for a Premium user aiming for 100%).
export const DISPLAY_THRESHOLD = 0.05;
export const PERFECT_SCORE_THRESHOLD = 90;

/**
 * Pure function. Derives the health display state from a raw API response.
 * Has no side effects and no React dependencies.
 */
export const interpretResponse = (
  response: HealthAssessmentResponse
): InterpretedHealth => {
  const result = response.result;
  const isHealthyBinary = Boolean(result.is_healthy.binary);
  const score = Math.round(Number(result.is_healthy.probability ?? 0) * 100);

  const suggestions = result.disease?.suggestions ?? [];
  const hadSuggestions = suggestions.length > 0;
  const sorted = [...suggestions].sort(
    (a, b) => Number(b.probability ?? 0) - Number(a.probability ?? 0)
  );

  const decisionRelevant = sorted.filter(
    (s) => Number(s.probability ?? 0) > DECISION_THRESHOLD
  );
  const displayRelevant = sorted
    .filter((s) => Number(s.probability ?? 0) > DISPLAY_THRESHOLD)
    .slice(0, 4);

  if (!isHealthyBinary) {
    return {
      state: "critical",
      score,
      relevantSuggestions: displayRelevant,
      hadSuggestions,
    };
  }

  if (score > PERFECT_SCORE_THRESHOLD && decisionRelevant.length === 0) {
    return {
      state: "perfect",
      score,
      relevantSuggestions: [],
      hadSuggestions,
    };
  }

  return {
    state: "optimization",
    score,
    relevantSuggestions: displayRelevant,
    hadSuggestions,
  };
};
