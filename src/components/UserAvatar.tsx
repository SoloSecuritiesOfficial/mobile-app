import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { BASE_URL } from "../config/api";
import Colors from "../theme/colors";

interface Props {
  username?: string;
  profileImage?: string;
  size?: number;
  onPress?: () => void;
}

/**
 * Shared avatar component used across Friends, Chat, Leaderboard, etc.
 * - Loads the profile image (relative or absolute URL)
 * - Falls back to coloured initials circle on error or no image
 */
export default function UserAvatar({ username, profileImage, size = 44, onPress }: Props) {
  const [imgError, setImgError] = useState(false);

  const initials = (username || "?").substring(0, 2).toUpperCase();

  let uri: string | null = null;
  if (profileImage && !imgError) {
    uri = profileImage.startsWith("http")
      ? profileImage
      : `${BASE_URL}${profileImage}`;
  }

  const circle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const content = uri ? (
    <Image
      source={{ uri }}
      style={[styles.image, circle]}
      onError={() => setImgError(true)}
    />
  ) : (
    <View style={[styles.placeholder, circle, { backgroundColor: Colors.primary }]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  image:       { resizeMode: "cover" },
  placeholder: { justifyContent: "center", alignItems: "center" },
  initials:    { color: "#FFF", fontWeight: "800" },
});
