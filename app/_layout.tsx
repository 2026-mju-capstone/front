import GlobalLoading from "@/app/global-loading";
import LoadingScreen from "@/app/loading";
import {ROUTES} from "@/constants/url";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useNotifications} from "@/hooks/use-notifications";
import {useAuthStore} from "@/store/authStore";
import {BottomSheetModalProvider} from "@gorhom/bottom-sheet";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import {QueryClient} from "@tanstack/react-query";
import {PersistQueryClientProvider} from "@tanstack/react-query-persist-client";
import {createAsyncStoragePersister} from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

export default function RootLayout() {
    useNotifications();
    const router = useRouter();
    const segments = useSegments();
    const {token, isInitialized} = useAuthStore();

    const colorScheme = useColorScheme();
    const [fontsLoaded] = useFonts({
        "Pretendard-Regular": require("../assets/fonts/Pretendard-Regular.otf"),
        "Pretendard-Medium": require("../assets/fonts/Pretendard-Medium.otf"),
        "Pretendard-Bold": require("../assets/fonts/Pretendard-Bold.otf"),
    });

    // 인증 상태에 따른 리다이렉트 처리 (중앙 집중화)
    useEffect(() => {
        if (!isInitialized || !fontsLoaded) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (!token && !inAuthGroup) {
            // 토큰이 없는데 인증이 필요한 페이지에 있다면 로그인으로 이동
            router.replace(ROUTES.LOGIN);
        } else if (token && inAuthGroup) {
            // 토큰이 있는데 로그인/회원가입 페이지에 있다면 메인으로 이동
            router.replace(ROUTES.MAP);
        }
    }, [token, isInitialized, segments, fontsLoaded]);

    // 초기화 중이거나 폰트 로딩 중이면 스플래시 화면 유지 대신 커스텀 로딩 화면 표시
    if (!isInitialized || !fontsLoaded) {
        return <LoadingScreen />;
    }

    // 로딩 완료 시 스플래시 숨기기
    SplashScreen.hideAsync();

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{persister: asyncStoragePersister}}
        >
            <GestureHandlerRootView style={{flex: 1}}>
                <BottomSheetModalProvider>
                    <SafeAreaProvider>
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
                            <GlobalLoading />
                            <StatusBar style="auto"/>
                        </ThemeProvider>
                    </SafeAreaProvider>
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </PersistQueryClientProvider>
    );
}