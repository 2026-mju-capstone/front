import GlobalLoading from "@/app/global-loading";
import LoadingScreen from "@/app/loading";
import { ROUTES } from "@/constants/url";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuthStore } from "@/store/authStore";
import { useProfile } from "@/hooks/queries/useUserQueries";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

// Connect React Query's online manager to NetInfo for proper RN network detection
onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
        setOnline(!!state.isConnected);
    });
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24시간 캐시 유지
            staleTime: 1000 * 60 * 5, // 5분간 최신으로 간주
        },
    },
});

const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
});

function RootLayoutNav() {
    useNotifications();
    const router = useRouter();
    const segments = useSegments();
    const { token, isInitialized } = useAuthStore();

    // 폰트 로딩
    const [fontsLoaded] = useFonts({
        "Pretendard-Regular": require("../assets/fonts/Pretendard-Regular.otf"),
        "Pretendard-Medium": require("../assets/fonts/Pretendard-Medium.otf"),
        "Pretendard-Bold": require("../assets/fonts/Pretendard-Bold.otf"),
    });

    // 토큰이 있을 경우에만 서버 검증 수행
    const {
        data: profile,
        isError,
        isLoading: isProfileLoading,
    } = useProfile({
        enabled: isInitialized && !!token,
        retry: false, // 유효성 검사 실패 시 바로 로그인으로 보내기 위해 재시도 끔
    });

    // 앱 준비 완료 조건:
    // 1. 초기화 완료 AND 2. 폰트 로딩 완료
    // AND (3. 토큰이 없거나 OR 4. 토큰 검증이 끝났거나(로딩 종료))
    const isAppReady =
        isInitialized && fontsLoaded && (!token || !isProfileLoading);

    const colorScheme = useColorScheme();

    // 인증 상태 및 검증 결과에 따른 리다이렉트 처리
    useEffect(() => {
        if (!isAppReady) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (!token) {
            // 토큰이 없는데 인증이 필요한 페이지에 있다면 로그인으로 이동
            if (!inAuthGroup) {
                router.replace(ROUTES.LOGIN);
            }
        } else if (profile) {
            // 프로필 로드 성공 시 로그인/회원가입 페이지에 있다면 메인으로 이동
            if (inAuthGroup) {
                router.replace(ROUTES.MAP);
            }
        } else if (isError) {
            // 토큰은 있지만 검증에 실패한 경우 (401 등)
            if (!inAuthGroup) {
                router.replace(ROUTES.LOGIN);
            }
        }
    }, [token, isAppReady, segments, profile, isError]);

    if (!isAppReady) {
        return <LoadingScreen />;
    }

    SplashScreen.hideAsync();

    return (
        <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
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
                <Stack.Screen
                    name="chat-room"
                    options={{ headerShown: false }}
                />
            </Stack>
            <GlobalLoading />
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}

export default function RootLayout() {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister: asyncStoragePersister,
                dehydrateOptions: {
                    // 강의 검색/시간표 데이터는 항상 서버 기준 — 캐시 저장 안 함
                    shouldDehydrateQuery: (query) =>
                        query.queryKey[0] !== "courses" &&
                        query.queryKey[0] !== "timetables",
                },
            }}
        >
            <GestureHandlerRootView style={{ flex: 1 }}>
                <BottomSheetModalProvider>
                    <SafeAreaProvider>
                        <RootLayoutNav />
                    </SafeAreaProvider>
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </PersistQueryClientProvider>
    );
}
