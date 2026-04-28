import { useColorScheme } from "@/hooks/use-color-scheme";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Camera } from "expo-camera";
import { useFonts } from "expo-font";
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    "Pretendard-Regular": require("../assets/fonts/Pretendard-Regular.otf"),
    "Pretendard-Medium": require("../assets/fonts/Pretendard-Medium.otf"),
    "Pretendard-Bold": require("../assets/fonts/Pretendard-Bold.otf"),
  });

  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
      await Camera.requestCameraPermissionsAsync();

      if (fontsLoaded) {
        SplashScreen.hideAsync();
        checkToken();
      }
    })();
  }, [fontsLoaded]);

  const checkToken = async () => {
    try {
      // 개발 중 임시 - 항상 탭으로 이동
      router.replace("/(tabs)/map");
      return;

      // 아래는 나중에 다시 활성화
      // const token = await AsyncStorage.getItem("token");
      // if (token) {
      //   router.replace("/(tabs)");
      // } else {
      //   router.replace("/(auth)/login");
      // }
    } catch (e) {
      router.replace("/(auth)/login");
    }
  };

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="loading" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
              <Stack.Screen
                name="lost-item-detail"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="lost-item-register"
                options={{ headerShown: false }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
