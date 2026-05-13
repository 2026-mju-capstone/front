import { ApiResponse, ListMessagesResult, MessageRecord } from "@/api/types";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { chatSocket } from "../api/websocket/chatSocket";
import { CHAT_QUERY_KEYS } from "./queries/useChatQueries";
import { useProfile } from "./queries/useUserQueries";

/**
 * 채팅방 WebSocket 훅
 * - 포커스 있을 때만 READ 전송
 * - 백그라운드/다른 화면이면 READ 전송 안 함
 */
export function useChatSocket(roomId: number, enabled: boolean = true) {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const isFocusedRef = useRef(false);
  const pendingReadRef = useRef(false);

  // 포커스 추적
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;

      // 포커스 복귀 시 밀린 READ 전송
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
      (msg) => {
        if (msg.type === "MESSAGE") {
          const { sender_nickname, message } = msg.payload;

          queryClient.setQueryData<ApiResponse<ListMessagesResult>>(
            CHAT_QUERY_KEYS.messages(roomId),
            (old) => {
              if (!old?.data) return old;

              const isMine = sender_nickname === profile?.nickname;
              if (isMine) return old; // 내 메시지는 Optimistic이 처리

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

          // 포커스 있으면 즉시 READ, 없으면 pending
          if (isFocusedRef.current) {
            chatSocket.sendRead(roomId);
          } else {
            pendingReadRef.current = true;
          }
        }

        if (msg.type === "READ") {
          // 상대방이 읽었을 때 → 메시지 read_at 업데이트
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
      (errorReason) => {
        console.error("[useChatSocket] 에러:", errorReason);
      },
    );

    return () => {
      chatSocket.disconnect();
    };
  }, [roomId, enabled]);

  return {
    sendMessage: (message: string) => chatSocket.sendMessage(roomId, message),
    sendRead: () => chatSocket.sendRead(roomId),
    isConnected: chatSocket.isConnected(),
  };
}
