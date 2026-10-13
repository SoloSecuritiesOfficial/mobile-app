import { useResponsive, type ResponsiveInfo } from "../hooks";

export function useResponsiveTheme(): ResponsiveInfo {
  return useResponsive();
}

export function createResponsiveStyles<
  T extends Record<string, any>
>(styleFactory: (responsive: ResponsiveInfo) => T): T {
  const responsive = useResponsive();
  return styleFactory(responsive);
}

export function getResponsiveValue<T>(
  responsive: ResponsiveInfo,
  values: {
    phone?: T;
    largePhone?: T;
    tablet?: T;
    desktop?: T;
    default: T;
  }
): T {
  const { deviceType, isLargePhone } = responsive;

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

export function getResponsiveDimension(
  responsive: ResponsiveInfo,
  phoneValue: number,
  tabletValue?: number,
  desktopValue?: number
): number {
  const { deviceType, isLargePhone } = responsive;

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