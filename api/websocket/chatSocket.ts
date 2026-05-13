import { BASE_URL } from "@/constants/url";
import { useAuthStore } from "@/store/authStore";

const WS_URL = BASE_URL.replace(/^http/, "ws") + "/ws/chat";

type IncomingMessage =
  | { type: "INFO"; payload: { message: string } }
  | { type: "ERROR"; payload: { reason: string; message: string } }
  | { type: "MESSAGE"; payload: { sender_nickname: string; message: string } }
  | { type: "READ"; payload: { reader_nickname: string } };

type MessageHandler = (msg: IncomingMessage) => void;

class ChatSocketManager {
  private socket: WebSocket | null = null;
  private roomId: number | null = null;
  private messageHandler: MessageHandler | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isManualClose = false;

  connect(
    roomId: number,
    onMessage: MessageHandler,
    onError?: (reason: string) => void,
  ) {
    if (this.socket?.readyState === WebSocket.OPEN && this.roomId === roomId)
      return;

    this.disconnect();
    this.isManualClose = false;
    this.roomId = roomId;
    this.messageHandler = onMessage;

    const token = useAuthStore.getState().token;
    if (!token) {
      console.warn("[ChatSocket] 토큰 없음");
      return;
    }

    this.socket = new WebSocket(`${WS_URL}?token=${token}`);

    this.socket.onopen = () => {
      console.log("[ChatSocket] 연결 성공");
      this.send({ type: "JOIN", room_id: roomId });
    };

    this.socket.onmessage = (event) => {
      try {
        const data: IncomingMessage = JSON.parse(event.data);
        if (__DEV__) console.log("[ChatSocket] 수신:", data);

        if (data.type === "ERROR") {
          console.error(
            "[ChatSocket] 에러:",
            data.payload.reason,
            data.payload.message,
          );
          onError?.(data.payload.reason);
          return;
        }

        this.messageHandler?.(data);
      } catch (e) {
        console.error("[ChatSocket] 파싱 실패", e);
      }
    };

    this.socket.onclose = (event) => {
      console.log("[ChatSocket] 연결 종료", event.code);
      if (!this.isManualClose) {
        this.reconnectTimer = setTimeout(() => {
          console.log("[ChatSocket] 재연결 시도...");
          if (this.roomId && this.messageHandler) {
            this.connect(this.roomId, this.messageHandler, onError);
          }
        }, 5000);
      }
    };

    this.socket.onerror = (error) => {
      console.error("[ChatSocket] WebSocket 에러", error);
    };
  }

  sendMessage(roomId: number, message: string): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      console.warn("[ChatSocket] 연결 안 됨 - 전송 실패");
      return false;
    }
    this.send({ type: "MESSAGE", room_id: roomId, message });
    return true;
  }

  sendRead(roomId: number): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;
    this.send({ type: "READ", room_id: roomId });
    return true;
  }

  private send(data: object) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.isManualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.roomId = null;
    this.messageHandler = null;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const chatSocket = new ChatSocketManager();
