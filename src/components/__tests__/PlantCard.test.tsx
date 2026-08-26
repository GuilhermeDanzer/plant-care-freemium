import { render, fireEvent } from "@testing-library/react-native";
import { PlantCard } from "@/components/PlantCard";
import type { PlantRecord } from "@/types/plant";

jest.mock("@/i18n", () => ({
  __esModule: true,
  default: {
    language: "en",
    t: (key: string, opts?: Record<string, unknown>) =>
      opts?.count !== undefined ? `${key}:${opts.count}` : key,
  },
}));

const plant: PlantRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  nickname: null,
  original_name: "Monstera",
  scientific_name: "Monstera deliciosa",
  watering_freq_days: 7,
  last_watered_at: "2026-01-01T10:00:00.000Z",
  next_watering_at: "2026-01-08T10:00:00.000Z",
  image_uri: null,
  last_health_check_at: null,
  health_data: null,
  created_at: "2026-01-01T10:00:00.000Z",
  updated_at: "2026-01-01T10:00:00.000Z",
  deleted_at: null,
};

describe("PlantCard", () => {
  it("renders the display name (falls back to original name)", () => {
    const { getByText } = render(
      <PlantCard plant={plant} isEditing={false} onDelete={jest.fn()} onPress={jest.fn()} />
    );
    expect(getByText("Monstera")).toBeTruthy();
  });

  it("renders the scientific name", () => {
    const { getByText } = render(
      <PlantCard plant={plant} isEditing={false} onDelete={jest.fn()} onPress={jest.fn()} />
    );
    expect(getByText("Monstera deliciosa")).toBeTruthy();
  });

  it("calls onPress with the plant id when tapped in normal mode", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PlantCard plant={plant} isEditing={false} onDelete={jest.fn()} onPress={onPress} />
    );
    fireEvent.press(getByText("Monstera"));
    expect(onPress).toHaveBeenCalledWith(plant.id);
  });
});
