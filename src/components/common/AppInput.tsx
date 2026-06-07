// src/components/common/AppInput.tsx
import React, { useState } from "react";
import {
  View, TextInput, Text, TouchableOpacity,
  ViewStyle, TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { Typography, Spacing, Radius } from "../../constants/theme";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  /** Accepte un nom d'icône Ionicons (string) ou un ReactNode */
  leftIcon?: React.ReactNode | string;
  rightIcon?: React.ReactNode | string;
  containerStyle?: ViewStyle;
  onRightIconPress?: () => void;
  required?: boolean;
}

function renderIcon(icon: React.ReactNode | string | undefined, color: string, size = 18): React.ReactNode | null {
  if (!icon) return null;
  if (typeof icon === "string") {
    return <Ionicons name={icon as any} size={size} color={color} />;
  }
  return icon as React.ReactNode;
}

export default function AppInput({
  label, error, hint, leftIcon, rightIcon,
  containerStyle, onRightIconPress, required, ...props
}: Props) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const C = theme.colors;

  const borderColor = error
    ? C.error
    : focused
    ? C.primary
    : C.border;

  const iconColor = focused ? C.primary : C.textSecondary;

  return (
    <View style={[{ marginBottom: Spacing[3] }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: Typography.sizes.sm,
            fontWeight: Typography.weights.semibold as any,
            color: C.textSecondary,
            marginBottom: 6,
          }}
        >
          {label}
          {required && <Text style={{ color: C.error }}> *</Text>}
        </Text>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: C.surface,
          borderWidth: 1.5,
          borderColor,
          borderRadius: Radius.md,
          minHeight: 52,
          paddingHorizontal: Spacing[3],
        }}
      >
        {leftIcon !== undefined && (
          <View style={{ marginRight: 10 }}>
            {renderIcon(leftIcon, iconColor)}
          </View>
        )}

        <TextInput
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          placeholderTextColor={C.textSecondary}
          style={[
            {
              flex: 1,
              fontSize: Typography.sizes.base,
              color: C.text,
              paddingVertical: Spacing[3],
            },
            props.style,
          ]}
        />

        {rightIcon !== undefined && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={{ marginLeft: 10 }}
            disabled={!onRightIconPress}
          >
            {renderIcon(rightIcon, iconColor)}
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text
          style={{
            color: C.error,
            fontSize: Typography.sizes.xs,
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text
          style={{
            color: C.textSecondary,
            fontSize: Typography.sizes.xs,
            marginTop: 4,
          }}
        >
          {hint}
        </Text>
      )}
    </View>
  );
}