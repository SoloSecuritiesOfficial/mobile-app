import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { resolveAvatar } from "../utils/avatar";
import Colors from "../theme/colors";

interface Props {
  username?    : string;
  profileImage?: string;
  size?        : number;
  onPress?     : () => void;
}

/**
 * Shared avatar component — Friends, Chat, Leaderboard, FriendProfile, etc.
 * Resolves all image URL formats via the shared resolveAvatar utility.
 * Falls back to a coloured initials circle when the image is missing or fails.
 */
export default function UserAvatar({ username, profileImage, size = 44, onPress }: Props) {
  const [imgError, setImgError] = useState(false);

  const uri = !imgError ? resolveAvatar(profileImage) : null;

  const initials = (username || "?").substring(0, 2).toUpperCase();
  const circle   = { width: size, height: size, borderRadius: size / 2 };

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
