import { StyleSheet } from "react-native";
import { useResponsive, type ResponsiveInfo } from "./useResponsive";
import Colors from "../theme/colors";
import { useMemo } from "react";

/**
 * useStyles — responsive StyleSheet hook.
 *
 * The factory receives:
 *   (spacing, typography, colors)
 *
 * where `spacing` and `typography` are already scaled for the current
 * screen size (phone / large-phone / tablet / desktop).
 *
 * Usage:
 *   const styleFactory = (spacing, typography, colors) =>
 *     StyleSheet.create({ ... });
 *
 *   const styles = useStyles(styleFactory);
 */
export function useStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  styleFactory: (
    spacing   : ResponsiveInfo["spacing"],
    typography: ResponsiveInfo["typography"],
    colors    : typeof Colors,
  ) => T,
): T {
  const responsive = useResponsive();
  return useMemo(
    () => StyleSheet.create(
      styleFactory(responsive.spacing, responsive.typography, Colors),
    ),
    [responsive],
  );
}

/**
 * createStyles — creates a memoised style factory that can be called
 * with a ResponsiveInfo object outside of a component.
 *
 * Kept for backwards compatibility.
 */
export function createStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  styleFactory: (
    spacing   : ResponsiveInfo["spacing"],
    typography: ResponsiveInfo["typography"],
    colors    : typeof Colors,
  ) => T,
): (responsive: ResponsiveInfo) => T {
  return (responsive: ResponsiveInfo) =>
    StyleSheet.create(styleFactory(responsive.spacing, responsive.typography, Colors));
}
