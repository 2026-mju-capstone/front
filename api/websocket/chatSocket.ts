import { BASE_URL } from "@/constants/url";
import { useAuthStore } from "@/store/authStore";

const WS_URL = BASE_URL.replace(/^http/, "ws") + "/ws/chat";

// 연결 상태
export type ConnectionStatus =
  | "DISCONNECTED" // 연결 안 됨
  | "CONNECTING" // 연결 중
  | "CONNECTED" // 연결됨
  | "RECONNECTING" // 재연결 중
  | "ERROR"; // 에러 발생

type IncomingMessage =
  | { type: "INFO"; payload: { message: string } }
  | { type: "ERROR"; payload: { reason: string; message: string } }
  | { type: "MESSAGE"; payload: { sender_nickname: string; message: string } }
  | { type: "READ"; payload: { reader_nickname: string } };

type MessageHandler = (msg: IncomingMessage) => void;
type StatusHandler = (status: ConnectionStatus) => void;
type ErrorHandler = (reason: string, message: string) => void;

class ChatSocketManager {
  private socket: WebSocket | null = null;
  private roomId: number | null = null;
  private messageHandler: MessageHandler | null = null;
  private statusHandler: StatusHandler | null = null;
  private errorHandler: ErrorHandler | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isManualClose = false;
  private status: ConnectionStatus = "DISCONNECTED";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.statusHandler?.(status);
  }

  connect(
    roomId: number,
    onMessage: MessageHandler,
    onStatus?: StatusHandler,
    onError?: ErrorHandler,
  ) {
    if (this.socket?.readyState === WebSocket.OPEN && this.roomId === roomId)
      return;

    this.disconnect();
    this.isManualClose = false;
    this.roomId = roomId;
    this.messageHandler = onMessage;
    this.statusHandler = onStatus ?? null;
    this.errorHandler = onError ?? null;

    const token = useAuthStore.getState().token;
    if (!token) {
      console.warn("[ChatSocket] 토큰 없음");
      this.setStatus("ERROR");
      return;
    }

    this.setStatus(this.reconnectAttempts > 0 ? "RECONNECTING" : "CONNECTING");

    this.socket = new WebSocket(`${WS_URL}?token=${token}`);

    this.socket.onopen = () => {
      console.log("[ChatSocket] 연결 성공");
      this.reconnectAttempts = 0;
      this.setStatus("CONNECTED");
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
          this.errorHandler?.(data.payload.reason, data.payload.message);
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
        // 최대 재연결 시도 횟수 초과
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.warn("[ChatSocket] 재연결 최대 시도 횟수 초과");
          this.setStatus("ERROR");
          return;
        }

        this.reconnectAttempts++;
        this.setStatus("RECONNECTING");

        const delay = Math.min(
          5000 * Math.pow(2, this.reconnectAttempts - 1),
          30000,
        ); // exponential backoff (5s, 10s, 20s, 30s, 30s)

        console.log(
          `[ChatSocket] ${delay}ms 후 재연결 시도 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
        );

        this.reconnectTimer = setTimeout(() => {
          if (this.roomId && this.messageHandler) {
            this.connect(
              this.roomId,
              this.messageHandler,
              this.statusHandler ?? undefined,
              this.errorHandler ?? undefined,
            );
          }
        }, delay);
      } else {
        this.setStatus("DISCONNECTED");
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

  // 수동 재연결 (사용자가 버튼 누를 때)
  manualReconnect() {
    if (!this.roomId || !this.messageHandler) return;
    this.reconnectAttempts = 0;
    this.connect(
      this.roomId,
      this.messageHandler,
      this.statusHandler ?? undefined,
      this.errorHandler ?? undefined,
    );
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
    this.statusHandler = null;
    this.errorHandler = null;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }
}

export const chatSocket = new ChatSocketManager();
