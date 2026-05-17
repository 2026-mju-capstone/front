import { RemoteMessage } from "@react-native-firebase/messaging";

export interface NotificationData {
    type?: string;
    [key: string]: any;
}

export type ZoopickRemoteMessage = Omit<RemoteMessage, 'data'> & {
    data?: NotificationData;
};

export type TokenCallback = (token: string) => void;
export type OpenNotificationAction = (remoteMessage: ZoopickRemoteMessage) => void;
