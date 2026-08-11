import { createNavigationContainerRef } from "@react-navigation/native";
import { RootStackParamList } from "./AppNavigator";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Navigate from outside React components (e.g. notification tap handler).
 * Waits until the navigator is ready before calling navigate.
 */
export function navigateTo<K extends keyof RootStackParamList>(
  screen: K,
  params?: RootStackParamList[K]
) {
  if (navigationRef.isReady()) {
    (navigationRef as any).navigate(screen, params);
  }
}
