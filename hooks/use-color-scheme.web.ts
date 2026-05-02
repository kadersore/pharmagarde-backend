import { useThemeContext } from "@/lib/theme-provider";

/**
 * Web must follow the app-level persisted theme, not the browser or device color scheme.
 */
export function useColorScheme() {
  return useThemeContext().colorScheme;
}
