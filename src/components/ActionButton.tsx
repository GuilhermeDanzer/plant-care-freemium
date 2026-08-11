import { type ComponentType } from "react";
import { Plus } from "lucide-react-native";
import { TouchableOpacity } from "react-native";

const PlusIcon = Plus as unknown as ComponentType<{ color?: string; size?: number }>;

export interface ActionButtonProps {
  disabled?: boolean;
  onPress: () => void;
}

export function ActionButton({ disabled = false, onPress }: ActionButtonProps) {
  return (
    <TouchableOpacity
      className={`absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full ${
        disabled ? "bg-slate-300" : "bg-emerald-600"
      }`}
      onPress={onPress}
      testID="add-button"
    >
      <PlusIcon color="#ffffff" size={28} />
    </TouchableOpacity>
  );
}
