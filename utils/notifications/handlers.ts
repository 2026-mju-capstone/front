import { Event, EventType, EventDetail } from '@notifee/react-native';
import { chatService } from "@/api/services/chat";
import { NotificationData } from './types';
import { handleNotificationRouting } from './routing';

const readChatMessages = (data: NotificationData) => {
    const roomId: number = Number(data?.room_id);
    chatService.readChatRoom(roomId);
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

export async function notificationEventHandler(observer: Event) {
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
            if (action) {
                action(data, input);
            }
            break;
    }
}
