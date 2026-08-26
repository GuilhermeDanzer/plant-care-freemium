import React, { forwardRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";

export interface MilestoneCardProps {
  plantName: string;
  imageUri: string | null;
  milestoneText: string;
}

export const MilestoneCard = forwardRef<ViewShot, MilestoneCardProps>(
  ({ plantName, imageUri, milestoneText }, ref) => {
    // Fallback to a default plant image if none provided
    const source = imageUri
      ? { uri: imageUri }
      : require("../../../assets/icon.png"); 

    return (
      <ViewShot
        ref={ref}
        options={{ format: "png", quality: 0.9 }}
        style={{ width: "100%", aspectRatio: 9 / 16, overflow: "hidden", borderRadius: 24 }}
      >
        {/* Blurred Background */}
        <Image
          source={source}
          style={StyleSheet.absoluteFillObject}
          blurRadius={15}
          resizeMode="cover"
        />

        {/* Dark Overlay for readability */}
        <View style={StyleSheet.absoluteFillObject} className="bg-black/40" />

        {/* Content Container */}
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center text-3xl font-extrabold text-white mb-8 shadow-sm">
            {milestoneText}
          </Text>

          <View className="w-64 h-64 rounded-full overflow-hidden border-4 border-white/80 shadow-lg mb-6">
            <Image
              source={source}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          </View>

          <Text className="text-center text-xl font-bold text-emerald-100 shadow-sm">
            {plantName}
          </Text>
        </View>

        {/* Footer Watermark */}
        <View className="absolute bottom-6 w-full items-center">
          <Text className="text-white/60 font-medium text-sm">
            Acompanhado com o PlantHelper 🌿
          </Text>
        </View>
      </ViewShot>
    );
  }
);
