import { Stack } from "expo-router";
import { MilestoneModal } from "@/components/domain/MilestoneModal";
import { View } from "react-native";

export default function MainLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false, // Keep it false to not break existing screens
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <MilestoneModal />
    </>
  );
}
