import {
  calculateNextWateringAt,
  getDaysSince,
  getWateringCountdownDetail,
  mapWateringLevelToDays,
} from "@/utils/dateUtils";

jest.mock("@/i18n", () => ({
  __esModule: true,
  default: {
    language: "en",
    t: (key: string, opts?: Record<string, unknown>) =>
      opts?.count !== undefined ? `${key}:${opts.count}` : key,
  },
}));

describe("mapWateringLevelToDays", () => {
  it("maps levels to the expected day intervals", () => {
    expect(mapWateringLevelToDays(1)).toBe(10);
    expect(mapWateringLevelToDays(2)).toBe(5);
    expect(mapWateringLevelToDays(3)).toBe(2);
  });
});

describe("calculateNextWateringAt", () => {
  it("adds the frequency in days to the last watered date", () => {
    const next = calculateNextWateringAt("2026-01-01T10:00:00.000Z", 7);
    expect(new Date(next).getUTCDate()).toBe(8);
  });

  it("handles month boundaries", () => {
    const next = calculateNextWateringAt("2026-01-28T10:00:00.000Z", 10);
    expect(new Date(next).getUTCMonth()).toBe(1); // February
  });
});

describe("getWateringCountdownDetail", () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  it("is overdue when the date has passed", () => {
    jest.setSystemTime(new Date(2026, 0, 10, 12, 0, 0));
    const detail = getWateringCountdownDetail(
      new Date(2026, 0, 8, 9, 0, 0).toISOString()
    );
    expect(detail.isOverdue).toBe(true);
    expect(detail.diffDays).toBe(-2);
  });

  it("is today when the date matches", () => {
    jest.setSystemTime(new Date(2026, 0, 10, 12, 0, 0));
    const detail = getWateringCountdownDetail(
      new Date(2026, 0, 10, 9, 0, 0).toISOString()
    );
    expect(detail.isToday).toBe(true);
    expect(detail.diffDays).toBe(0);
  });

  it("is upcoming with a positive day count", () => {
    jest.setSystemTime(new Date(2026, 0, 10, 12, 0, 0));
    const detail = getWateringCountdownDetail(
      new Date(2026, 0, 13, 9, 0, 0).toISOString()
    );
    expect(detail.isOverdue).toBe(false);
    expect(detail.isToday).toBe(false);
    expect(detail.diffDays).toBe(3);
  });
});

describe("getDaysSince", () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  it("returns the whole number of days since a date", () => {
    jest.setSystemTime(new Date(2026, 0, 10, 12, 0, 0));
    expect(getDaysSince(new Date(2026, 0, 5, 9, 0, 0).toISOString())).toBe(5);
  });

  it("clamps negative values to zero (future date)", () => {
    jest.setSystemTime(new Date(2026, 0, 10, 12, 0, 0));
    expect(getDaysSince(new Date(2026, 0, 15, 9, 0, 0).toISOString())).toBe(0);
  });
});
