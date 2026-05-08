import {ROUTES} from "@/constants/url";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useNotifications} from "@/hooks/use-notifications";
import {useAuthStore} from "@/store/authStore";
import {useProfile} from "@/hooks/queries/useUserQueries";
import {BottomSheetModalProvider} from "@gorhom/bottom-sheet";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {useFonts} from "expo-font";
import {Stack, useRouter, useSegments} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {StatusBar} from "expo-status-bar";
import {useEffect} from "react";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import "react-native-reanimated";
import {SafeAreaProvider} from "react-native-safe-area-context";
import "../global.css";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
    useNotifications();
    const router = useRouter();
    const segments = useSegments();
    const {token, isInitialized} = useAuthStore();

    // 폰트 로딩
    const [fontsLoaded] = useFonts({
        "Pretendard-Regular": require("../assets/fonts/Pretendard-Regular.otf"),
        "Pretendard-Medium": require("../assets/fonts/Pretendard-Medium.otf"),
        "Pretendard-Bold": require("../assets/fonts/Pretendard-Bold.otf"),
    });

    // 토큰이 있을 경우에만 서버 검증 수행
    const { data: profile, isError, isLoading: isProfileLoading } = useProfile({
        enabled: isInitialized && !!token,
        retry: false, // 유효성 검사 실패 시 바로 로그인으로 보내기 위해 재시도 끔
    });

    // 앱 준비 완료 조건: 
    // 1. 초기화 완료 AND 2. 폰트 로딩 완료 
    // AND (3. 토큰이 없거나 OR 4. 토큰 검증이 끝났거나(로딩 종료))
    const isAppReady = isInitialized && fontsLoaded && (!token || !isProfileLoading);

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
            // 토큰이 있고 검증도 성공했다면 메인으로 (로그인/회원가입 페이지에 있을 경우만)
            if (inAuthGroup) {
                router.replace(ROUTES.MAP);
            }
        } else if (isError) {
            // 토큰은 있지만 검증에 실패한 경우 (401 등)
            // 인터셉터에서 이미 토큰을 지웠을 수 있지만, 안전하게 한 번 더 체크하여 로그인으로 유도
            if (!inAuthGroup) {
                router.replace(ROUTES.LOGIN);
            }
        }
    }, [token, isAppReady, segments, profile, isError]);

    // 초기화 중이면 스플래시 화면 유지
    if (!isAppReady) {
        return null;
    }

    // 로딩 완료 시 스플래시 숨기기
    SplashScreen.hideAsync();

    return (
        <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
            <Stack>
                <Stack.Screen name="index" options={{headerShown: false}}/>
                <Stack.Screen name="(auth)" options={{headerShown: false}}/>
                <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                <Stack.Screen name="loading" options={{headerShown: false}}/>
                <Stack.Screen
                    name="modal"
                    options={{presentation: "modal", title: "Modal"}}
                />
                <Stack.Screen
                    name="lost-item-detail"
                    options={{headerShown: false}}
                />
                <Stack.Screen
                    name="lost-item-register"
                    options={{headerShown: false}}
                />
                <Stack.Screen
                    name="chat-room"
                    options={{headerShown: false}}
                />
            </Stack>
            <StatusBar style="auto"/>
        </ThemeProvider>
    );
}

export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{flex: 1}}>
                <BottomSheetModalProvider>
                    <SafeAreaProvider>
                        <RootLayoutNav />
                    </SafeAreaProvider>
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </QueryClientProvider>
    );
}