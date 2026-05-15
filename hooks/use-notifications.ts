import { authService } from "@/api/services/auth";
import messaging, { RemoteMessage } from "@react-native-firebase/messaging";
import { useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { Href, router } from 'expo-router';
import { ROUTES } from "@/constants/url";

export interface NotificationData {
    type?: string;
    [key: string]: any;
}

export type ZoopickRemoteMessage = Omit<RemoteMessage, 'data'> & {
    data?: NotificationData;
};

export type TokenCallback = (token: string) => void;

export type OpenNotificationAction = (remoteMessage: ZoopickRemoteMessage) => void;

/**
 * FCM에서 data의 모든 value는 string으로 변환되어 들어옵니다.
 * 숫자나 다른 타입을 사용한다면 파싱이 필요합니다.
 */
const ROUTE_MAP: Record<string, (data: any) => Href> = {
    CHAT_MESSAGE: (data) => ({
        pathname: ROUTES.CHAT_ROOM,
        params: { roomId: Number(data.room_id) }
    }),
    ITEM_RETURNED: (data) => ({
        pathname: ROUTES.LOST_ITEM_DETAIL,
        params: { id: Number(data.item_post_id) }
    }),
    MATCH_FOUND: (data) => ({
        pathname: ROUTES.MATCHES,
        params: { }
    }),
    THEFT_SUSPECTED: (data) => ({
        pathname: ROUTES.CCTV_RESULT,
        paramas: { }
    }),
    LOCKER_READY: (data) => ({
        pathname: ROUTES.MYPAGE,
        params: { }
    })
}

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
        const result = await authService.registerDeviceToken({ token });
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
    openNotificationAction: OpenNotificationAction | null = handleNotificationRouting,
) {
    useEffect(() => {
        if (!requestNotificationPermission())
            console.log("Notification permission denied");

        const unsubscribeTokenRefresh =
            messaging().onTokenRefresh(sendTokenToServer);

        // 포그라운드 메시지 핸들러
        const unsubscribeMessage = messaging().onMessage(
            (remoteMessage: ZoopickRemoteMessage) => {
            },
        );

        // 알림 클릭 핸들러 (백그라운드에서 열렸을 때)
        const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(
            (remoteMessage: ZoopickRemoteMessage) => {
                if (openNotificationAction) openNotificationAction(remoteMessage);
            },
        );

        // 앱이 완전히 종료된 상태에서 알림을 클릭해 열렸을 때
        messaging()
            .getInitialNotification()
            .then((remoteMessage: ZoopickRemoteMessage | null) => {
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



export const handleNotificationRouting = (remoteMessage: ZoopickRemoteMessage) => {
    const type = remoteMessage?.data?.type;
    if (!type) {
        console.warn("This notification does not have type");
        return;
    }

    const getHref = ROUTE_MAP[type];
    if (!getHref) {
        console.warn(`Unsupported notification type : ${type}`);
        return;
    }

    const href = getHref(remoteMessage.data);
    router.navigate(href);
}
