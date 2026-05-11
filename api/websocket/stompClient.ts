import { BASE_URL } from "@/constants/url";
import { useAuthStore } from "@/store/authStore";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";

// WebSocket URL (HTTP → WS 변환)
const WS_URL = BASE_URL.replace(/^http/, "ws") + "/ws";

class StompClientManager {
  private client: Client | null = null;
  private subscriptions = new Map<string, StompSubscription>();
  private isConnecting = false;

  /**
   * STOMP 연결 시작
   * 백엔드 준비 후 실제 사용 시 호출
   */
  connect(onConnect?: () => void, onError?: (err: any) => void) {
    if (this.client?.connected || this.isConnecting) return;

    const token = useAuthStore.getState().token;
    if (!token) {
      console.warn("[STOMP] 토큰 없음 - 연결 중단");
      return;
    }

    this.isConnecting = true;

    this.client = new Client({
      brokerURL: WS_URL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000, // 자동 재연결
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (msg) => {
        if (__DEV__) console.log("[STOMP]", msg);
      },
      onConnect: () => {
        console.log("[STOMP] 연결 성공");
        this.isConnecting = false;
        onConnect?.();
      },
      onStompError: (frame) => {
        console.error("[STOMP] 에러", frame);
        this.isConnecting = false;
        onError?.(frame);
      },
      onWebSocketError: (err) => {
        console.error("[STOMP] WebSocket 에러", err);
        this.isConnecting = false;
        onError?.(err);
      },
      onDisconnect: () => {
        console.log("[STOMP] 연결 종료");
      },
    });

    this.client.activate();
  }

  /**
   * 채팅방 구독
   * 백엔드 STOMP 토픽 예: /topic/chat-rooms/{roomId}
   */
  subscribeToRoom(roomId: number, onMessage: (msg: any) => void) {
    if (!this.client?.connected) {
      console.warn("[STOMP] 연결 안 됨 - 구독 실패");
      return;
    }

    const destination = `/topic/chat-rooms/${roomId}`;

    // 이미 구독 중이면 무시
    if (this.subscriptions.has(destination)) {
      return;
    }

    const sub = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const body = JSON.parse(message.body);
        onMessage(body);
      } catch (e) {
        console.error("[STOMP] 메시지 파싱 실패", e);
      }
    });

    this.subscriptions.set(destination, sub);
  }

  /**
   * 채팅방 구독 해제
   */
  unsubscribeFromRoom(roomId: number) {
    const destination = `/topic/chat-rooms/${roomId}`;
    const sub = this.subscriptions.get(destination);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  /**
   * 메시지 전송
   * 백엔드 STOMP 목적지 예: /app/chat-rooms/{roomId}/send
   */
  sendMessage(roomId: number, message: string) {
    if (!this.client?.connected) {
      console.warn("[STOMP] 연결 안 됨 - 전송 실패");
      return false;
    }

    this.client.publish({
      destination: `/app/chat-rooms/${roomId}/send`,
      body: JSON.stringify({ message }),
    });

    return true;
  }

  /**
   * 연결 종료
   */
  disconnect() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    this.client?.deactivate();
    this.client = null;
  }

  isConnected() {
    return this.client?.connected ?? false;
  }
}

export const stompClient = new StompClientManager();
