import React, { ComponentType } from "react";
import { View, TextInput, Text, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  icon?: ComponentType<{ color?: string; size?: number }>;
  containerClassName?: string;
  inputClassName?: string;
  rightAccessory?: React.ReactNode;
  error?: string;
  InputComponent?: any;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon: Icon,
  containerClassName = "",
  inputClassName = "",
  rightAccessory,
  error,
  InputComponent = TextInput,
  ...props
}) => {
  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Text className="mb-2 text-xs font-semibold uppercase tracking-[2px] text-slate-400">
          {label}
        </Text>
      )}
      <View 
        className={`flex-row items-center rounded-2xl px-4 h-14 border ${
          error ? "border-red-400 bg-red-50/30" : "border-slate-100 bg-slate-50"
        }`}
      >
        {Icon && (
          <View className="mr-3">
            <Icon color={error ? "#f87171" : "#64748b"} size={20} />
          </View>
        )}
        <InputComponent
          placeholderTextColor="#94a3b8"
          className={`flex-1 h-full py-0 text-base text-slate-900 ${inputClassName}`}
          style={{ paddingVertical: 0 }}
          {...props}
        />
        {rightAccessory}
      </View>
      {error ? (
        <Text className="text-red-500 text-xs mt-1.5 ml-2 font-medium">{error}</Text>
      ) : null}
    </View>
  );
};
