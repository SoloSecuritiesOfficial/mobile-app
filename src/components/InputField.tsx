import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface InputFieldProps extends TextInputProps {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  error?: string;
  password?: boolean;
}

export default function InputField({
  label,
  icon,
  error,
  password = false,
  ...props
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [secure, setSecure] = useState(password);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedContainer,
          error ? styles.errorContainer : null,
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={isFocused ? "#E53935" : "#777"}
        />

        <TextInput
          style={styles.input}
          placeholderTextColor="#999"
          secureTextEntry={secure}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {password && (
          <TouchableOpacity onPress={() => setSecure(!secure)}>
            <MaterialCommunityIcons
              name={secure ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#777"
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: 18,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderWidth: 1.5,
    borderColor: "#E2E2E2",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 58,
  },

  focusedContainer: {
    borderColor: "#E53935",
    backgroundColor: "#FFFFFF",
  },

  errorContainer: {
    borderColor: "#D32F2F",
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#111",
    marginLeft: 12,
  },

  error: {
    color: "#D32F2F",
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
});