import { useQuery } from "@tanstack/react-query";
import { chatService } from "../../api/services/chat";

export const CHAT_QUERY_KEYS = {
  rooms: ["chatRooms"] as const,
  room: (roomId: number) => ["chatRoom", roomId] as const,
  messages: (roomId: number) => ["chatMessages", roomId] as const,
};

export const useChatQueries = {
  // 채팅방 ID 목록
  useChatRooms: () =>
    useQuery({
      queryKey: CHAT_QUERY_KEYS.rooms,
      queryFn: () => chatService.getChatRooms(),
      staleTime: 1000 * 30, // 30초
    }),

  // 채팅방 상세
  useChatRoom: (roomId: number, pollWhileOpen: boolean = false) =>
    useQuery({
      queryKey: CHAT_QUERY_KEYS.room(roomId),
      queryFn: () => chatService.getChatRoom(roomId),
      enabled: !!roomId,
      refetchInterval: pollWhileOpen ? 3000 : false,
    }),

  // 메시지 목록 (포커스 있을 때만 폴링)
  useMessages: (roomId: number, isActive: boolean = true) =>
    useQuery({
      queryKey: CHAT_QUERY_KEYS.messages(roomId),
      queryFn: () => chatService.getMessages(roomId),
      enabled: !!roomId,
      refetchInterval: isActive ? 5000 : false, // 화면 활성화 시만 5초 폴링
      refetchIntervalInBackground: false, // 백그라운드에서는 폴링 X
      staleTime: 0,
    }),
};
