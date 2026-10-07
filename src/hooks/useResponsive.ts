import { useWindowDimensions, ScaledSize } from "react-native";
import { useMemo } from "react";

export type DeviceType = "phone" | "tablet" | "desktop";

export interface ResponsiveInfo {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
  isLandscape: boolean;
  deviceType: DeviceType;
  isSmallPhone: boolean;
  isLargePhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    section: number;
    screen: number;
    cardPadding: number;
    buttonPadding: number;
    inputPadding: number;
    horizontal: number;
    vertical: number;
    radiusSmall: number;
    radiusMedium: number;
    radiusLarge: number;
    radiusXL: number;
    iconSmall: number;
    iconMedium: number;
    iconLarge: number;
    iconXL: number;
    avatarSmall: number;
    avatarMedium: number;
    avatarLarge: number;
    headerHeight: number;
    bottomTabHeight: number;
  };
  typography: {
    displayLarge: { fontSize: number; lineHeight: number; fontWeight: "800" };
    displayMedium: { fontSize: number; lineHeight: number; fontWeight: "700" };
    h1: { fontSize: number; lineHeight: number; fontWeight: "700" };
    h2: { fontSize: number; lineHeight: number; fontWeight: "700" };
    h3: { fontSize: number; lineHeight: number; fontWeight: "700" };
    h4: { fontSize: number; lineHeight: number; fontWeight: "600" };
    bodyLarge: { fontSize: number; lineHeight: number; fontWeight: "400" };
    bodyMedium: { fontSize: number; lineHeight: number; fontWeight: "400" };
    bodySmall: { fontSize: number; lineHeight: number; fontWeight: "400" };
    labelLarge: { fontSize: number; lineHeight: number; fontWeight: "600" };
    labelMedium: { fontSize: number; lineHeight: number; fontWeight: "600" };
    labelSmall: { fontSize: number; lineHeight: number; fontWeight: "600" };
    button: { fontSize: number; lineHeight: number; fontWeight: "700" };
    score: { fontSize: number; lineHeight: number; fontWeight: "800" };
    cardTitle: { fontSize: number; lineHeight: number; fontWeight: "700" };
    cardDescription: { fontSize: number; lineHeight: number; fontWeight: "400" };
    caption: { fontSize: number; lineHeight: number; fontWeight: "400" };
  };
}

const BREAKPOINTS = {
  phone: { maxWidth: 480 },
  largePhone: { maxWidth: 640 },
  tablet: { maxWidth: 1024 },
  desktop: { minWidth: 1025 },
};

const BASE_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 32,
  screen: 40,
  cardPadding: 20,
  buttonPadding: 16,
  inputPadding: 14,
  horizontal: 24,
  vertical: 20,
  radiusSmall: 8,
  radiusMedium: 12,
  radiusLarge: 16,
  radiusXL: 24,
  iconSmall: 16,
  iconMedium: 24,
  iconLarge: 32,
  iconXL: 48,
  avatarSmall: 32,
  avatarMedium: 48,
  avatarLarge: 64,
  headerHeight: 60,
  bottomTabHeight: 70,
};

const BASE_TYPOGRAPHY = {
  displayLarge: { fontSize: 36, lineHeight: 44, fontWeight: "800" as const },
  displayMedium: { fontSize: 30, lineHeight: 38, fontWeight: "700" as const },
  h1: { fontSize: 28, lineHeight: 36, fontWeight: "700" as const },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: "700" as const },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: "700" as const },
  h4: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  bodyMedium: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  labelLarge: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const },
  labelMedium: { fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
  labelSmall: { fontSize: 12, lineHeight: 16, fontWeight: "600" as const },
  button: { fontSize: 16, lineHeight: 22, fontWeight: "700" as const },
  score: { fontSize: 48, lineHeight: 56, fontWeight: "800" as const },
  cardTitle: { fontSize: 18, lineHeight: 24, fontWeight: "700" as const },
  cardDescription: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
};

function getDeviceType(width: number): DeviceType {
  if (width >= BREAKPOINTS.desktop.minWidth) return "desktop";
  if (width >= BREAKPOINTS.tablet.maxWidth) return "tablet";
  return "phone";
}

function getScaleFactor(width: number, deviceType: DeviceType): number {
  switch (deviceType) {
    case "desktop":
      return 1.2;
    case "tablet":
      return 1.15;
    case "phone":
    default:
      if (width <= BREAKPOINTS.phone.maxWidth) return 0.95;
      if (width <= BREAKPOINTS.largePhone.maxWidth) return 1;
      return 1.05;
  }
}

function scaleValue(base: number, scale: number): number {
  return Math.round(base * scale);
}

function scaleSpacing(base: typeof BASE_SPACING, scale: number): ResponsiveInfo["spacing"] {
  const scaled: any = {};
  for (const [key, value] of Object.entries(base)) {
    scaled[key] = scaleValue(value, scale);
  }
  return scaled;
}

function scaleTypography(base: typeof BASE_TYPOGRAPHY, scale: number): ResponsiveInfo["typography"] {
  const scaled: any = {};
  for (const [key, value] of Object.entries(base)) {
    scaled[key] = {
      fontSize: scaleValue(value.fontSize, scale),
      lineHeight: scaleValue(value.lineHeight, scale),
      fontWeight: value.fontWeight,
    };
  }
  return scaled;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height, scale, fontScale } = useWindowDimensions();

  return useMemo(() => {
    const isLandscape = width > height;
    const deviceType = getDeviceType(isLandscape ? height : width);
    const scaleFactor = getScaleFactor(isLandscape ? height : width, deviceType);

    const spacing = scaleSpacing(BASE_SPACING, scaleFactor);
    const typography = scaleTypography(BASE_TYPOGRAPHY, scaleFactor);

    return {
      width,
      height,
      scale,
      fontScale,
      isLandscape,
      deviceType,
      isSmallPhone: width <= BREAKPOINTS.phone.maxWidth && !isLandscape,
      isLargePhone: width > BREAKPOINTS.phone.maxWidth && width <= BREAKPOINTS.largePhone.maxWidth && !isLandscape,
      isTablet: deviceType === "tablet",
      isDesktop: deviceType === "desktop",
      spacing,
      typography,
    };
  }, [width, height, scale, fontScale]);
}

export function useResponsiveValue<T>(values: {
  phone?: T;
  largePhone?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T {
  const { deviceType, isLargePhone } = useResponsive();

  switch (deviceType) {
    case "desktop":
      return values.desktop ?? values.tablet ?? values.default;
    case "tablet":
      return values.tablet ?? values.largePhone ?? values.default;
    case "phone":
      return isLargePhone
        ? values.largePhone ?? values.default
        : values.phone ?? values.default;
    default:
      return values.default;
  }
}

export function useResponsiveDimension(
  phoneValue: number,
  tabletValue?: number,
  desktopValue?: number
): number {
  const { deviceType, isLargePhone } = useResponsive();

  switch (deviceType) {
    case "desktop":
      return desktopValue ?? tabletValue ?? phoneValue;
    case "tablet":
      return tabletValue ?? phoneValue;
    case "phone":
      return isLargePhone && tabletValue ? tabletValue : phoneValue;
    default:
      return phoneValue;
  }
}

export { BASE_SPACING, BASE_TYPOGRAPHY };