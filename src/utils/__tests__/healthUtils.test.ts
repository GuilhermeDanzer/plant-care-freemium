import { interpretResponse } from "@/utils/healthUtils";
import type { HealthAssessmentResponse } from "@/types/plant";

const base = (
  overrides: Partial<HealthAssessmentResponse["result"]> = {}
): HealthAssessmentResponse => ({
  result: {
    is_healthy: { binary: true, probability: 0.98 },
    disease: { suggestions: [] },
    is_plant: { binary: true, probability: 1 },
    ...overrides,
  },
  status: "completed",
});

describe("interpretResponse", () => {
  it("returns 'perfect' when healthy, high score and no relevant suggestions", () => {
    const result = interpretResponse(base());
    expect(result.state).toBe("perfect");
    expect(result.score).toBe(98);
    expect(result.relevantSuggestions).toHaveLength(0);
  });

  it("returns 'critical' when the binary health flag is false", () => {
    const result = interpretResponse(
      base({ is_healthy: { binary: false, probability: 0.1 } })
    );
    expect(result.state).toBe("critical");
    expect(result.score).toBe(10);
  });

  it("returns 'optimization' when score is below the perfect threshold", () => {
    const result = interpretResponse(
      base({ is_healthy: { binary: true, probability: 0.85 } })
    );
    expect(result.state).toBe("optimization");
    expect(result.score).toBe(85);
  });

  it("keeps only display-relevant suggestions (probability > 5%)", () => {
    const result = interpretResponse(
      base({
        is_healthy: { binary: true, probability: 0.85 },
        disease: {
          suggestions: [
            { id: "a", name: "Strong", probability: 0.5, details: {} },
            { id: "b", name: "Weak", probability: 0.02, details: {} },
          ],
        },
      })
    );
    expect(result.relevantSuggestions).toHaveLength(1);
    expect(result.relevantSuggestions[0].id).toBe("a");
  });

  it("sorts suggestions by probability descending", () => {
    const result = interpretResponse(
      base({
        is_healthy: { binary: true, probability: 0.85 },
        disease: {
          suggestions: [
            { id: "low", name: "Low", probability: 0.2, details: {} },
            { id: "high", name: "High", probability: 0.9, details: {} },
          ],
        },
      })
    );
    expect(result.relevantSuggestions[0].id).toBe("high");
    expect(result.relevantSuggestions[1].id).toBe("low");
  });

  it("flags hadSuggestions even when none are relevant enough to display", () => {
    const result = interpretResponse(
      base({
        disease: {
          suggestions: [{ id: "x", name: "Negligible", probability: 0.01, details: {} }],
        },
      })
    );
    expect(result.hadSuggestions).toBe(true);
    expect(result.relevantSuggestions).toHaveLength(0);
  });
});
