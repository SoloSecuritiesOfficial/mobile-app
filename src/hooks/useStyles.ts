import { StyleSheet } from "react-native";
import { useResponsive, type ResponsiveInfo } from "./useResponsive";
import Colors from "../theme/colors";
import { useMemo } from "react";

export function useStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  styleFactory: (responsive: ResponsiveInfo, colors: typeof Colors) => T
): T {
  const responsive = useResponsive();
  return useMemo(() => StyleSheet.create(styleFactory(responsive, Colors)), [responsive]);
}

export function createStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  styleFactory: (spacing: ResponsiveInfo["spacing"], typography: ResponsiveInfo["typography"], colors: typeof Colors) => T
): (responsive: ResponsiveInfo) => T {
  return (responsive: ResponsiveInfo) => StyleSheet.create(
    styleFactory(responsive.spacing, responsive.typography, Colors)
  );
}