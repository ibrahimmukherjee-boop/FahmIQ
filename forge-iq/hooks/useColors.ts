import { useTheme } from "../src/context/ThemeContext";

/**
 * Returns the active design tokens based on the user's dark/light preference.
 * Reads from ThemeContext which respects the in-app toggle rather than only
 * the device system setting.
 */
export function useColors() {
  const { colors } = useTheme();
  return colors;
}
