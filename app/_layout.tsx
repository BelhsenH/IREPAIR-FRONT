import { DarkTheme,DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { LanguageProvider } from "../contexts/LanguageContext";
import { AuthProvider } from "../contexts/AuthContext";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";

export const unstable_settings ={
  initialRouteName: "(auth)/splash",
};
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  if (!loaded) {
    return null; // Avoid rendering before fonts are ready
  }
  return(
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
        <Stack>
          <Stack.Screen
            name="(auth)/splash"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(auth)/intro"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(auth)/Login"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="(auth)/signup" options={{headerShown:false}}/>
          <Stack.Screen
            name="(auth)/forgotPassword"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(auth)/resetPassword"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(auth)/verify"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(home)/dashboard"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(home)/edit-profile"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(home)/service-management"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(home)/my-services"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(home)/appointments-calendar"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(home)/parts-requests"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(home)/conversations"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(home)/conversation/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(home)/notifications"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(home)/profile"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(home)/settings"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(home)/parts-marketplace"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(home)/analytics"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(home)/create-parts-request"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="(home)/maintenance-dashboard/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="(home)/maintenance-car-state/[carId]/[maintenanceRequestId]" options={{ headerShown: false }} />
          <Stack.Screen name="(home)/messages" options={{ headerShown: false }} />
          <Stack.Screen name="(home)/(conversation-details)/[conversationId]" options={{ headerShown: false }} />
          <Stack.Screen name="(home)/conversation-detail" options={{ headerShown: false }} />
        </Stack>

        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}