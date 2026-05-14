import { ApiResponse, ListMessagesResult, MessageRecord } from "@/api/types";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";
import { chatSocket, ConnectionStatus } from "../api/websocket/chatSocket";
import { CHAT_QUERY_KEYS } from "./queries/useChatQueries";
import { useProfile } from "./queries/useUserQueries";

// WebSocket ERROR 타입의 reason → 사용자 친화적 메시지 매핑
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

/**
 * 채팅방 WebSocket 훅
 *
 * 핵심 설계 원칙:
 * "소켓 연결 상태 ≠ 화면을 보고 있는 상태"
 *
 * 읽음 처리 전략:
 * - 채팅방 화면 포커스 O → 메시지 수신 시 즉시 READ 전송
 * - 채팅방 화면 포커스 X (백그라운드, 다른 화면) → READ 보류
 * - 포커스 복귀 시 → 밀린 READ 전송
 *
 * @param roomId 참여할 채팅방 ID
 * @param enabled WebSocket 활성화 여부 (기본 true)
 */
export function useChatSocket(roomId: number, enabled: boolean = true) {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  // 화면 포커스 상태 추적 (ref = 리렌더링 없이 최신값 유지)
  const isFocusedRef = useRef(false);
  // 포커스 없을 때 수신된 메시지의 READ 보류 여부
  const pendingReadRef = useRef(false);
  // 연결 상태 (UI 배너 표시용)
  const [status, setStatus] = useState<ConnectionStatus>("DISCONNECTED");

  /**
   * 화면 포커스 감지
   * - 포커스 복귀 시 밀린 READ 전송
   * - 화면 떠날 때 isFocusedRef 초기화
   */
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
      // ── onMessage: 서버로부터 메시지 수신 ──
      (msg) => {
        if (msg.type === "MESSAGE") {
          const { sender_nickname, message } = msg.payload;

          // React Query 캐시에 새 메시지 추가 (리렌더링 트리거)
          queryClient.setQueryData<ApiResponse<ListMessagesResult>>(
            CHAT_QUERY_KEYS.messages(roomId),
            (old) => {
              if (!old?.data) return old;

              // 내 메시지는 Optimistic Update가 이미 처리했으므로 중복 방지
              const isMine = sender_nickname === profile?.nickname;
              if (isMine) return old;

              const newMessage: MessageRecord = {
                message,
                sender_id: -1, // WebSocket 응답에 sender_id 없음
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

          // 포커스 있으면 즉시 READ, 없으면 pending 표시
          if (isFocusedRef.current) {
            chatSocket.sendRead(roomId);
          } else {
            pendingReadRef.current = true;
          }
        }

        // 상대방이 읽었을 때 → 내 메시지의 read_at 업데이트 (읽음 "1" 제거)
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
      // ── onStatus: 연결 상태 변화 → UI 배너 업데이트 ──
      (newStatus) => {
        setStatus(newStatus);
      },
      // ── onError: 서버 에러 → 토스트 표시 ──
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

    // 화면 언마운트 시 WebSocket 연결 해제
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
