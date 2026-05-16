import { authService } from "@/api/services/auth";
import messaging, { RemoteMessage } from "@react-native-firebase/messaging";
import { useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { Href, router } from 'expo-router';
import { ROUTES } from "@/constants/url";
import notifee, { EventType, Event, EventDetail, AndroidAction, AndroidImportance } from '@notifee/react-native';
import { chatService } from "@/api/services/chat";

export interface NotificationData {
    type?: string;
    [key: string]: any;
}

export type ZoopickRemoteMessage = Omit<RemoteMessage, 'data'> & {
    data?: NotificationData;
};

export type TokenCallback = (token: string) => void;

export type OpenNotificationAction = (remoteMessage: ZoopickRemoteMessage) => void;


const createNotification = async (message: ZoopickRemoteMessage, actions: AndroidAction[] = []) => {
    const data = message?.data;
    const title = data?.title;
    const body = data?.body;
    const channelId = await notifee.createChannel({
        id: 'zoopick_default',
        name: 'Default Zooipck Channel',
        importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
        title,
        body,
        data: data as Notification['data'],
        android: {
            channelId,
            actions,
            pressAction: {
                id: 'openPage',
                launchActivity: 'default'
            }
        }
    })
}

const createSimpleNotification = async (message: ZoopickRemoteMessage) => {
    createNotification(message);
}

const createChatNotification = async (message: ZoopickRemoteMessage) => {
    createNotification(message, [
        {
            title: '읽음',
            pressAction: { id: 'read' }
        },
        {
            title: '답장',
            pressAction: { id: 'reply' },
            input: true
        }
    ]);
}


const NOTIFICATION_DISPLAY_REGISTRY: Record<string, (message: ZoopickRemoteMessage) => void> = {
    CHAT_MESSAGE: createChatNotification,
    ITEM_RETURNED: createSimpleNotification,
    MATCH_FOUND: createSimpleNotification,
    THEFT_SUSPECTED: createSimpleNotification,
    LOCKER_READY: createSimpleNotification
}

/**
 * FCM에서 data의 모든 value는 string으로 변환되어 들어옵니다.
 * 숫자나 다른 타입을 사용한다면 파싱이 필요합니다.
 */
const ROUTING_REGISTRY: Record<string, (data: NotificationData) => Href> = {
    CHAT_MESSAGE: (data) => ({
        pathname: ROUTES.CHAT_ROOM,
        params: { roomId: Number(data.room_id) }
    }),
    ITEM_RETURNED: (data) => ({
        pathname: ROUTES.LOST_ITEM_DETAIL,
        params: { id: Number(data.item_post_id) }
    }),
    MATCH_FOUND: () => ({
        pathname: ROUTES.MATCHES,
        params: {}
    }),
    THEFT_SUSPECTED: () => ({
        pathname: ROUTES.CCTV_RESULT,
        paramas: {}
    }),
    LOCKER_READY: () => ({
        pathname: ROUTES.MYPAGE,
        params: {}
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

export const displayNotification = async (message: ZoopickRemoteMessage) => {
    const data: NotificationData | undefined = message?.data;
    if (!data) return;
    const type: string | undefined = data?.type;
    if (!type) return;
    const displayer = NOTIFICATION_DISPLAY_REGISTRY[type];
    displayer(message);
}

export function useNotifications() {
    messaging().setBackgroundMessageHandler(displayNotification);
    useEffect(() => {
        messaging().registerDeviceForRemoteMessages();

        if (!requestNotificationPermission())
            console.log("Notification permission denied");

        messaging().onMessage(displayNotification);
        const unsubscribeTokenRefresh = messaging().onTokenRefresh(sendTokenToServer);
        const unsubscribeForegroundEvent = notifee.onForegroundEvent(notificationEventHandler);
        notifee.onBackgroundEvent(notificationEventHandler);

        return () => {
            unsubscribeTokenRefresh();
            unsubscribeForegroundEvent();
        };
    }, []);
}

export const handleNotificationRouting = (data: NotificationData) => {
    const type = data.type;
    if (!type) {
        console.warn("This notification does not have type");
        return;
    }

    const getHref = ROUTING_REGISTRY[type];
    if (!getHref) {
        console.warn(`Unsupported notification type : ${type}`);
        return;
    }

    const href = getHref(data);
    router.navigate(href);
}

const readChatMessages = (data: NotificationData) => {
    const roomId: number = Number(data?.room_id);
    // Not implemented
}

const sendChatMessage = (data: NotificationData, input: string | undefined) => {
    const roomId: number = Number(data?.room_id);
    if (input)
        chatService.sendMessage(roomId, input);
}

const PRESS_ACTION_REGISTRY: Record<string, (data: NotificationData, input: string | undefined) => void> = {
    openPage: handleNotificationRouting,
    read: readChatMessages,
    reply: sendChatMessage
};

async function notificationEventHandler(observer: Event) {
    const type: EventType = observer.type;
    const detail: EventDetail = observer.detail;

    const { notification, pressAction, input } = detail;
    if (!notification)
        return;

    const data: NotificationData = notification.data as NotificationData;
    switch (type) {
        case EventType.ACTION_PRESS:
        case EventType.PRESS:
            if (!pressAction) break;
            const action = PRESS_ACTION_REGISTRY[pressAction.id];
            action(data, input);
            break;
    }
}


