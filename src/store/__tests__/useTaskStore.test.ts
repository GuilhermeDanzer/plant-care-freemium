import { useTaskStore } from "@/store/useTaskStore";
import { usePlantStore } from "@/store/usePlantStore";

jest.mock("@/store/usePlantStore", () => ({
  usePlantStore: {
    getState: jest.fn(),
  },
}));

const mockPlantStore = usePlantStore as unknown as {
  getState: jest.Mock;
};

const resetTaskState = (overrides: Partial<ReturnType<typeof useTaskStore.getState>> = {}) => {
  useTaskStore.setState({
    careStreak: 0,
    lastActionDate: null,
    showMilestoneModal: false,
    milestonePlantId: null,
    milestoneValue: null,
    ...overrides,
  });
};

const plant = (nextWateringAt: Date) => ({
  id: "p1",
  next_watering_at: nextWateringAt.toISOString(),
});

describe("useTaskStore.completeTask streak rules", () => {
  const now = new Date(2026, 0, 10, 12, 0, 0);

  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  beforeEach(() => {
    jest.setSystemTime(now);
    jest.clearAllMocks();
    mockPlantStore.getState.mockReturnValue({
      plants: [plant(new Date(2026, 0, 8))], // needs watering by default
      waterPlant: jest.fn().mockResolvedValue(undefined),
      snoozePlant: jest.fn().mockResolvedValue(undefined),
    });
  });

  it("increments to 1 on the very first action", async () => {
    resetTaskState();
    await useTaskStore.getState().completeTask("p1", "REGAR", "WATERED");
    expect(useTaskStore.getState().careStreak).toBe(1);
  });

  it("increments the streak when acting on consecutive days and the plant needs water", async () => {
    resetTaskState({ careStreak: 3, lastActionDate: new Date(2026, 0, 9, 9, 0, 0).toISOString() });
    await useTaskStore.getState().completeTask("p1", "REGAR", "WATERED");
    expect(useTaskStore.getState().careStreak).toBe(4);
  });

  it("keeps the streak flat on premature watering (plant not due)", async () => {
    mockPlantStore.getState.mockReturnValue({
      plants: [plant(new Date(2026, 0, 15))],
      waterPlant: jest.fn().mockResolvedValue(undefined),
      snoozePlant: jest.fn().mockResolvedValue(undefined),
    });
    resetTaskState({ careStreak: 3, lastActionDate: new Date(2026, 0, 9, 9, 0, 0).toISOString() });
    await useTaskStore.getState().completeTask("p1", "REGAR", "WATERED");
    expect(useTaskStore.getState().careStreak).toBe(3);
  });

  it("resets the streak to 1 after a missed day", async () => {
    resetTaskState({ careStreak: 5, lastActionDate: new Date(2026, 0, 8, 9, 0, 0).toISOString() });
    await useTaskStore.getState().completeTask("p1", "REGAR", "WATERED");
    expect(useTaskStore.getState().careStreak).toBe(1);
  });

  it("keeps the streak unchanged when acting twice the same day", async () => {
    resetTaskState({ careStreak: 2, lastActionDate: now.toISOString() });
    await useTaskStore.getState().completeTask("p1", "REGAR", "WATERED");
    expect(useTaskStore.getState().careStreak).toBe(2);
  });

  it("triggers a milestone modal at 14 days", async () => {
    resetTaskState({ careStreak: 13, lastActionDate: new Date(2026, 0, 9, 9, 0, 0).toISOString() });
    await useTaskStore.getState().completeTask("p1", "REGAR", "WATERED");
    const s = useTaskStore.getState();
    expect(s.careStreak).toBe(14);
    expect(s.showMilestoneModal).toBe(true);
    expect(s.milestoneValue).toBe(14);
  });

  it("calls snoozePlant for SOIL_WET instead of waterPlant", async () => {
    resetTaskState();
    await useTaskStore.getState().completeTask("p1", "REGAR", "SOIL_WET");
    const plantState = mockPlantStore.getState();
    expect(plantState.snoozePlant).toHaveBeenCalledWith("p1");
    expect(plantState.waterPlant).not.toHaveBeenCalled();
  });
});
