import { calculateNextWateringDate } from "@/utils/calculateNextWateringDate";
import type { WeatherPlant } from "@/types/weather";

const plant = (overrides: Partial<WeatherPlant> = {}): WeatherPlant => ({
  id: "p1",
  baseWateringIntervalDays: 10,
  isOutdoors: false,
  lastWateredDate: new Date(2026, 0, 1),
  ...overrides,
});

describe("calculateNextWateringDate", () => {
  it("keeps the base interval under mild conditions", () => {
    const result = calculateNextWateringDate(
      plant(),
      new Date(2026, 0, 1),
      { temperatureC: 22, hasRainedOver5mm: false }
    );
    expect(result.getDate()).toBe(11); // 1 + 10 days
  });

  it("stretches the interval by 1.5x when it is cold (< 15°C)", () => {
    const result = calculateNextWateringDate(
      plant(),
      new Date(2026, 0, 1),
      { temperatureC: 10, hasRainedOver5mm: false }
    );
    expect(result.getDate()).toBe(16); // 1 + round(10 * 1.5) = 16
  });

  it("adds 3 days for outdoor plants after heavy rain (> 5mm)", () => {
    const result = calculateNextWateringDate(
      plant({ isOutdoors: true }),
      new Date(2026, 0, 1),
      { temperatureC: 22, hasRainedOver5mm: true }
    );
    expect(result.getDate()).toBe(14); // 1 + 10 + 3
  });

  it("combines cold and rain adjustments for outdoor plants", () => {
    const result = calculateNextWateringDate(
      plant({ isOutdoors: true }),
      new Date(2026, 0, 1),
      { temperatureC: 8, hasRainedOver5mm: true }
    );
    // round(10 * 1.5) = 15, + 3 = 18 → Jan 19
    expect(result.getDate()).toBe(19);
  });

  it("does not apply the rain rule to indoor plants", () => {
    const result = calculateNextWateringDate(
      plant({ isOutdoors: false }),
      new Date(2026, 0, 1),
      { temperatureC: 22, hasRainedOver5mm: true }
    );
    expect(result.getDate()).toBe(11);
  });
});
