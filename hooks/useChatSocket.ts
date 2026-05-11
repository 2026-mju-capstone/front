import { ApiResponse, ListMessagesResult, MessageRecord } from "@/api/types";
import { stompClient } from "@/api/websocket/stompClient";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { CHAT_QUERY_KEYS } from "./queries/useChatQueries";

/**
 * 채팅방 WebSocket 구독 훅
 *
 * ⚠️ 백엔드 WebSocket 미구현으로 현재 비활성화 상태.
 * 백엔드 준비 후 enabled=true 로 활성화하면 됨.
 *
 * @param roomId 채팅방 ID
 * @param enabled WebSocket 활성화 여부 (기본 false - 폴링 사용)
 */
export function useChatSocket(roomId: number, enabled: boolean = false) {
  const queryClient = useQueryClient();
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !roomId) return;

    // 연결 시도
    stompClient.connect(
      () => {
        // 연결 성공 후 채팅방 구독
        stompClient.subscribeToRoom(roomId, (newMessage: MessageRecord) => {
          // 새 메시지 수신 시 React Query 캐시 업데이트
          queryClient.setQueryData<ApiResponse<ListMessagesResult>>(
            CHAT_QUERY_KEYS.messages(roomId),
            (old) => {
              if (!old?.data) return old;
              // 중복 메시지 방지 (같은 sent_at + sender_id 체크)
              const exists = old.data.messages.some(
                (m) =>
                  m.sent_at === newMessage.sent_at &&
                  m.sender_id === newMessage.sender_id,
              );
              if (exists) return old;
              return {
                ...old,
                data: {
                  ...old.data,
                  messages: [...old.data.messages, newMessage],
                },
              };
            },
          );
        });
        isSubscribedRef.current = true;
      },
      (err) => {
        console.error("[useChatSocket] 연결 실패", err);
      },
    );

    return () => {
      if (isSubscribedRef.current) {
        stompClient.unsubscribeFromRoom(roomId);
        isSubscribedRef.current = false;
      }
    };
  }, [roomId, enabled, queryClient]);

  return {
    sendMessage: (message: string) => stompClient.sendMessage(roomId, message),
    isConnected: stompClient.isConnected(),
  };
}
