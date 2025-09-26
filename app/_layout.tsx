import { useColorScheme } from "@/hooks/useColorScheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import "react-native-reanimated";
import { AuthProvider } from "../contexts/AuthContext";
import { LanguageProvider } from "../contexts/LanguageContext";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  
  if (!loaded) {
    return null;
  }
  
  return(
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)/splash" />
          <Stack.Screen name="(auth)/intro" />
          <Stack.Screen name="(auth)/Login" />
          <Stack.Screen name="(auth)/signup" />
          <Stack.Screen name="(auth)/forgotPassword" />
          <Stack.Screen name="(auth)/resetPassword" />
          <Stack.Screen name="(auth)/verify" />
          <Stack.Screen name="(home)/dashboard" />
          <Stack.Screen name="(home)/edit-profile" />
          <Stack.Screen name="(home)/service-management" />
          <Stack.Screen name="(home)/my-services" />
          <Stack.Screen name="(home)/appointments-calendar" />
          <Stack.Screen name="(home)/parts-requests" />
          <Stack.Screen name="(home)/conversations" />
          <Stack.Screen name="(home)/conversation/[id]" />
          <Stack.Screen name="(home)/notifications" />
          <Stack.Screen name="(home)/profile" />
          <Stack.Screen name="(home)/settings" />
          <Stack.Screen name="(home)/parts-marketplace" />
          <Stack.Screen name="(home)/analytics" />
          <Stack.Screen name="(home)/create-parts-request" />
          <Stack.Screen name="(home)/maintenance-dashboard/[id]" />
          <Stack.Screen name="(home)/maintenance-car-state/[carId]/[maintenanceRequestId]" />
          <Stack.Screen name="(home)/messages" />
          <Stack.Screen name="(home)/(conversation-details)/[conversationId]" />
          <Stack.Screen name="(home)/conversation-detail" />
        </Stack>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}