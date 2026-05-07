import { fonts } from "@/constants/typography";
import { CHAT_ROOM_URL } from "@/constants/url";
import { sendAccessRequest, sendGetRequest } from "@/utils/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Send } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Message = {
  message: string;
  sender_id: number | null;
  sender_nickname: string | null;
  sent_at: string;
  read_at: string | null;
};

type ChatRoom = {
  room_id: number;
  owner_nickname: string;
  finder_nickname: string;
  item_detail: string;
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const h = d.getHours();
  const ampm = h < 12 ? "오전" : "오후";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${String(hh).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ChatRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const flatListRef = useRef<FlatList>(null);

  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [myNickname, setMyNickname] = useState<string | null>(null);

  useEffect(() => {
    fetchChatRoom();
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  const fetchChatRoom = async () => {
    try {
      await sendGetRequest(`${CHAT_ROOM_URL}/${roomId}`, async (res) => {
        const result = await res.json();
        if (result.success && result.data) setChatRoom(result.data);
      });
    } catch (e) {
      console.error("채팅방 조회 실패", e);
    }
  };

  const fetchMessages = async () => {
    try {
      await sendAccessRequest(
        `${CHAT_ROOM_URL}/${roomId}/messages`,
        JSON.stringify({}),
        async (res) => {
          const result = await res.json();
          if (result.success && result.data?.messages) {
            setMessages(result.data.messages);
            if (!myNickname && result.data.chat_room) {
              // 추후 내 닉네임 판별용 (마이페이지 API 연결 후 교체)
            }
          }
        },
      );
    } catch (e) {
      console.error("메시지 조회 실패", e);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    setIsSending(true);
    const text = inputText.trim();
    setInputText("");
    try {
      await sendAccessRequest(
        `${CHAT_ROOM_URL}/${roomId}/messages/send`,
        JSON.stringify({ message: text }),
        async (res) => {
          const result = await res.json();
          if (result.success) {
            await fetchMessages();
            flatListRef.current?.scrollToEnd({ animated: true });
          } else {
            Alert.alert("전송 실패", "메시지를 전송하지 못했어요.");
            setInputText(text);
          }
        },
      );
    } catch {
      Alert.alert("오류", "네트워크 오류가 발생했어요.");
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = (type: "complete" | "abandon") => {
    const title = type === "complete" ? "거래 완료" : "거래 종료";
    const message =
      type === "complete"
        ? "정말 회수가 완료되셨나요?\n종료 후에는 복구할 수 없습니다."
        : "정말 거래를 종료하시겠어요?\n종료 후에는 복구할 수 없습니다.";
    Alert.alert(title, message, [
      { text: "취소", style: "cancel" },
      {
        text: "완료",
        onPress: () => {
          // TODO: 채팅방 종료 API 연결 후 구현
          setIsClosed(true);
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chatRoom
              ? `${chatRoom.owner_nickname} · ${chatRoom.finder_nickname}`
              : "채팅"}
          </Text>
          {chatRoom?.item_detail ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              {chatRoom.item_detail}
            </Text>
          ) : null}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* 액션바 */}
      {!isClosed && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnComplete]}
            onPress={() => handleClose("complete")}
          >
            <Text style={styles.actionBtnCompleteText}>✅ 거래 완료</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnAbandon]}
            onPress={() => handleClose("abandon")}
          >
            <Text style={styles.actionBtnAbandonText}>❌ 거래 종료</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 메시지 목록 */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + 100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>첫 메시지를 보내보세요!</Text>
            </View>
          }
          renderItem={({ item }) => {
            // 시스템 메시지
            if (item.sender_id === null) {
              return (
                <View style={styles.systemMsgWrap}>
                  <Text style={styles.systemMsg}>{item.message}</Text>
                </View>
              );
            }

            // TODO: 마이페이지 API 연결 후 내 sender_id로 판별
            // 임시로 owner_nickname 기준으로 판별
            const isMine = item.sender_nickname === chatRoom?.owner_nickname;

            return (
              <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
                {!isMine && (
                  <View style={styles.msgAvatar}>
                    <Text style={styles.msgAvatarText}>
                      {item.sender_nickname?.[0] ?? "?"}
                    </Text>
                  </View>
                )}
                <View style={styles.msgCol}>
                  {!isMine && (
                    <Text style={styles.msgNickname}>
                      {item.sender_nickname}
                    </Text>
                  )}
                  <View
                    style={[styles.msgBubble, isMine && styles.msgBubbleMine]}
                  >
                    <Text
                      style={[styles.msgText, isMine && styles.msgTextMine]}
                    >
                      {item.message}
                    </Text>
                  </View>
                  <Text style={[styles.msgTime, isMine && styles.msgTimeMine]}>
                    {formatTime(item.sent_at)}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* 종료된 채팅방 */}
        {isClosed && (
          <View style={styles.closedBanner}>
            <Text style={styles.closedText}>종료된 거래입니다</Text>
          </View>
        )}

        {/* 입력창 */}
        <View style={[styles.inputWrap, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={[styles.input, isClosed && styles.inputDisabled]}
            placeholder={isClosed ? "종료된 거래입니다" : "메시지를 입력하세요"}
            placeholderTextColor="#bbb"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isClosed}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || isClosed) && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isClosed || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 15, fontFamily: fonts.bold, color: "#111" },
  headerSub: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#aaa",
    marginTop: 2,
  },
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnComplete: { backgroundColor: "#eef2ff" },
  actionBtnAbandon: { backgroundColor: "#fff5f5" },
  actionBtnCompleteText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: "#6366f1",
  },
  actionBtnAbandonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: "#f87171",
  },
  messageList: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowMine: { flexDirection: "row-reverse" },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  msgAvatarText: { fontSize: 13, fontFamily: fonts.bold, color: "#6366f1" },
  msgCol: { maxWidth: "70%", gap: 3 },
  msgNickname: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#aaa",
    marginLeft: 4,
  },
  msgBubble: {
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  msgBubbleMine: {
    backgroundColor: "#6366f1",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: "#111",
    lineHeight: 20,
  },
  msgTextMine: { color: "#fff" },
  msgTime: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: "#bbb",
    marginLeft: 4,
  },
  msgTimeMine: { textAlign: "right", marginRight: 4 },
  systemMsgWrap: { alignItems: "center", paddingVertical: 4 },
  systemMsg: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: "#aaa",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  closedBanner: {
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  closedText: { fontSize: 13, fontFamily: fonts.bold, color: "#aaa" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: "#f5f6f8",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: "#111",
  },
  inputDisabled: { backgroundColor: "#f0f0f0", color: "#bbb" },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnDisabled: { backgroundColor: "#d1d5db", shadowOpacity: 0 },
  emptyBox: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: "#aaa", fontFamily: fonts.regular },
});
