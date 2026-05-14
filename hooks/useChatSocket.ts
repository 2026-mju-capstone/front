import { ApiResponse, ListMessagesResult, MessageRecord } from "@/api/types";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";
import { chatSocket, ConnectionStatus } from "../api/websocket/chatSocket";
import { CHAT_QUERY_KEYS } from "./queries/useChatQueries";
import { useProfile } from "./queries/useUserQueries";

// 에러 reason → 사용자 친화적 메시지
const ERROR_MESSAGES: Record<string, { title: string; subtitle: string }> = {
  NOT_FOUND: {
    title: "채팅방을 찾을 수 없어요",
    subtitle: "삭제되었거나 권한이 없을 수 있어요.",
  },
  NOT_PERMITTED: {
    title: "권한이 없어요",
    subtitle: "이 채팅방에 참여할 수 없어요.",
  },
  BAD_REQUEST: {
    title: "잘못된 요청이에요",
    subtitle: "잠시 후 다시 시도해주세요.",
  },
  INTERNAL_SERVER_ERROR: {
    title: "서버 오류가 발생했어요",
    subtitle: "잠시 후 다시 시도해주세요.",
  },
};

export function useChatSocket(roomId: number, enabled: boolean = true) {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const isFocusedRef = useRef(false);
  const pendingReadRef = useRef(false);
  const [status, setStatus] = useState<ConnectionStatus>("DISCONNECTED");

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;

      if (pendingReadRef.current && chatSocket.isConnected()) {
        chatSocket.sendRead(roomId);
        pendingReadRef.current = false;
      }

      return () => {
        isFocusedRef.current = false;
      };
    }, [roomId]),
  );

  useEffect(() => {
    if (!enabled || !roomId) return;

    chatSocket.connect(
      roomId,
      // onMessage
      (msg) => {
        if (msg.type === "MESSAGE") {
          const { sender_nickname, message } = msg.payload;

          queryClient.setQueryData<ApiResponse<ListMessagesResult>>(
            CHAT_QUERY_KEYS.messages(roomId),
            (old) => {
              if (!old?.data) return old;

              const isMine = sender_nickname === profile?.nickname;
              if (isMine) return old;

              const newMessage: MessageRecord = {
                message,
                sender_id: -1,
                sender_nickname,
                sent_at: new Date().toISOString(),
                read_at: null,
              };

              return {
                ...old,
                data: {
                  ...old.data,
                  messages: [...old.data.messages, newMessage],
                },
              };
            },
          );

          if (isFocusedRef.current) {
            chatSocket.sendRead(roomId);
          } else {
            pendingReadRef.current = true;
          }
        }

        if (msg.type === "READ") {
          queryClient.setQueryData<ApiResponse<ListMessagesResult>>(
            CHAT_QUERY_KEYS.messages(roomId),
            (old) => {
              if (!old?.data) return old;
              return {
                ...old,
                data: {
                  ...old.data,
                  messages: old.data.messages.map((m) =>
                    m.read_at ? m : { ...m, read_at: new Date().toISOString() },
                  ),
                },
              };
            },
          );
        }
      },
      // onStatus
      (newStatus) => {
        setStatus(newStatus);
      },
      // onError
      (reason, message) => {
        const errorInfo = ERROR_MESSAGES[reason] ?? {
          title: "오류가 발생했어요",
          subtitle: message,
        };
        Toast.show({
          type: "error",
          text1: errorInfo.title,
          text2: errorInfo.subtitle,
          position: "bottom",
          visibilityTime: 3000,
        });
      },
    );

    return () => {
      chatSocket.disconnect();
    };
  }, [roomId, enabled]);

  return {
    sendMessage: (message: string) => chatSocket.sendMessage(roomId, message),
    sendRead: () => chatSocket.sendRead(roomId),
    reconnect: () => chatSocket.manualReconnect(),
    isConnected: chatSocket.isConnected(),
    status,
  };
}
