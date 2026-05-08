import {authService} from "@/api/services/auth";
import messaging, {RemoteMessage} from "@react-native-firebase/messaging";
import {useEffect} from "react";
import {PermissionsAndroid, Platform} from "react-native";

export type TokenCallback = (token: string) => void;

export type OpenNotificationAction = (remoteMessage: RemoteMessage) => void;

// 로그인 성공 시 호출
export const getFCMToken = async (callback: TokenCallback) => {
    try {
        const token: string = await messaging().getToken();
        if (token) {
            console.log("FCM Token:", token);
            callback(token);
        }
    } catch (error) {
        console.error("Failed to get FCM Token");
    }
};

export const sendTokenToServer: TokenCallback = async (token: string) => {
    try {
        const result = await authService.registerDeviceToken({token});
        if (!result.success) {
            console.error(`Failed to register token: ${result.error}`);
        }
    } catch (error) {
        console.error("Error sending token to server:", error);
    }
};

const requestNotificationPermission = async () => {
    if (Platform.OS === "ios") {
        const authStatus = await messaging().requestPermission();
        return (
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
    } else if (Platform.OS === "android") {
        if (Platform.Version >= 33) {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    }
    return false;
};

export function useNotifications(
    openNotificationAction: OpenNotificationAction | null = null,
) {
    useEffect(() => {
        if (!requestNotificationPermission())
            console.log("Notification permission denied");

        const unsubscribeTokenRefresh =
            messaging().onTokenRefresh(sendTokenToServer);

        // 포그라운드 메시지 핸들러
        const unsubscribeMessage = messaging().onMessage(
            (remoteMessage: RemoteMessage) => {
            },
        );

        // 알림 클릭 핸들러 (백그라운드에서 열렸을 때)
        const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(
            (remoteMessage: RemoteMessage) => {
                if (openNotificationAction) openNotificationAction(remoteMessage);
            },
        );

        // 앱이 완전히 종료된 상태에서 알림을 클릭해 열렸을 때
        messaging()
            .getInitialNotification()
            .then((remoteMessage: RemoteMessage | null) => {
                if (remoteMessage && openNotificationAction)
                    openNotificationAction(remoteMessage);
            });

        return () => {
            unsubscribeTokenRefresh();
            unsubscribeMessage();
            unsubscribeNotificationOpened();
        };
    }, []);
}
