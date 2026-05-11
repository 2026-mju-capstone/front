import { fonts } from "@/constants/typography";
import { useChatMutations } from "@/hooks/mutations/useChatMutations";
import { useChatQueries } from "@/hooks/queries/useChatQueries";
import { useProfile } from "@/hooks/queries/useUserQueries";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Package,
  Plus,
  Send,
  User,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  if (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
    return "오늘";
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function ChatRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const flatListRef = useRef<FlatList>(null);
  const roomIdNum = Number(roomId);

  const [inputText, setInputText] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isFocused, setIsFocused] = useState(true);

  // 화면 포커스 추적 (활성화 시에만 폴링)
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  // Hooks
  const { data: profile } = useProfile();
  const { data: roomData, isLoading: isRoomLoading } =
    useChatQueries.useChatRoom(roomIdNum);
  const { data: messagesData, isLoading: isMessagesLoading } =
    useChatQueries.useMessages(roomIdNum, isFocused);

  const sendMessageMutation = useChatMutations.useSendMessage(
    roomIdNum,
    profile?.nickname,
  );
  const closeChatRoomMutation = useChatMutations.useCloseChatRoom(roomIdNum);
  const reopenChatRoomMutation = useChatMutations.useReopenChatRoom(roomIdNum);

  const chatRoom = roomData?.success ? roomData.data : null;
  const messages = messagesData?.success ? messagesData.data.messages : [];
  const isClosed = chatRoom?.status !== "OPEN";
  const isLoading = isRoomLoading || isMessagesLoading;

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: false });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || sendMessageMutation.isPending) return;
    const text = inputText.trim();
    setInputText("");
    sendMessageMutation.mutate(text, {
      onError: () => {
        Toast.show({
          type: "error",
          text1: "메시지 전송 실패",
          text2: "잠시 후 다시 시도해주세요.",
          position: "bottom",
          visibilityTime: 2500,
        });
        setInputText(text);
      },
      onSuccess: () => {
        flatListRef.current?.scrollToEnd({ animated: true });
      },
    });
  };

  const handleClose = (reason: "RETURNED" | "ABANDONED") => {
    setShowCloseModal(false);
    closeChatRoomMutation.mutate(reason, {
      onSuccess: () => {
        Toast.show({
          type: "success",
          text1:
            reason === "RETURNED"
              ? "반환 완료 처리되었어요"
              : "거래가 종료되었어요",
          position: "bottom",
          visibilityTime: 2500,
        });
      },
      onError: () => {
        Toast.show({
          type: "error",
          text1: "거래 종료 실패",
          text2: "다시 시도해주세요.",
          position: "bottom",
          visibilityTime: 2500,
        });
      },
    });
  };

  const handleReopen = () => {
    reopenChatRoomMutation.mutate(undefined, {
      onSuccess: () => {
        Toast.show({
          type: "success",
          text1: "채팅방이 재개되었어요",
          position: "bottom",
          visibilityTime: 2500,
        });
      },
      onError: () => {
        Toast.show({
          type: "error",
          text1: "채팅방 재개 실패",
          text2: "다시 시도해주세요.",
          position: "bottom",
          visibilityTime: 2500,
        });
      },
    });
  };

  // 날짜 구분선 삽입
  type DateItem = { type: "date"; label: string; key: string };
  type MessageItem = (typeof messages)[0] | DateItem;

  const messagesWithDates: MessageItem[] = [];
  let lastDate = "";
  messages.forEach((msg) => {
    const dateLabel = formatDateLabel(msg.sent_at);
    if (dateLabel !== lastDate) {
      messagesWithDates.push({
        type: "date",
        label: dateLabel,
        key: `date-${msg.sent_at}`,
      });
      lastDate = dateLabel;
    }
    messagesWithDates.push(msg);
  });

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
        <View style={styles.avatarWrap}>
          <User size={20} color="#aaa" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chatRoom?.owner_nickname ?? "채팅"}
          </Text>
          {chatRoom?.item_name ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              {chatRoom.item_name}
            </Text>
          ) : null}
        </View>
        {!isClosed ? (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => setShowCloseModal(true)}
          >
            <Text style={styles.completeBtnText}>거래 완료</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.reopenBtn} onPress={handleReopen}>
            <Text style={styles.reopenBtnText}>재개</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.moreBtn}>
          <MoreVertical size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {/* 분실물 배너 */}
      {chatRoom && (
        <View style={styles.itemBanner}>
          <View style={styles.itemBannerIcon}>
            <Package size={16} color="#6366f1" />
          </View>
          <Text style={styles.itemBannerText} numberOfLines={1}>
            {chatRoom.item_name}
          </Text>
          <ChevronRight size={14} color="#aaa" />
        </View>
      )}

      {isClosed && (
        <View style={styles.closedBanner}>
          <Text style={styles.closedText}>
            {chatRoom?.status === "RESOLVED_RETURNED"
              ? "반환 완료된 거래입니다"
              : "종료된 거래입니다"}
          </Text>
        </View>
      )}

      {/* 메시지 목록 */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + 60}
      >
        <FlatList
          ref={flatListRef}
          data={messagesWithDates}
          keyExtractor={(item, i) => ("key" in item ? item.key : String(i))}
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
            if ("type" in item && item.type === "date") {
              return (
                <View style={styles.dateLabelWrap}>
                  <Text style={styles.dateLabel}>{item.label}</Text>
                </View>
              );
            }
            const msg = item as (typeof messages)[0];
            if (msg.sender_id === null) {
              return (
                <View style={styles.systemMsgWrap}>
                  <Text style={styles.systemMsg}>{msg.message}</Text>
                </View>
              );
            }
            const isMine = msg.sender_nickname === profile?.nickname;
            return (
              <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
                {!isMine && (
                  <View style={styles.msgAvatar}>
                    <User size={16} color="#aaa" />
                  </View>
                )}
                <View style={styles.msgCol}>
                  <View
                    style={[styles.msgBubble, isMine && styles.msgBubbleMine]}
                  >
                    <Text
                      style={[styles.msgText, isMine && styles.msgTextMine]}
                    >
                      {msg.message}
                    </Text>
                  </View>
                  <Text style={[styles.msgTime, isMine && styles.msgTimeMine]}>
                    {formatTime(msg.sent_at)}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* 입력창 */}
        <View style={[styles.inputWrap, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity style={styles.plusBtn}>
            <Plus size={22} color="#aaa" />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, isClosed && styles.inputDisabled]}
            placeholder={
              isClosed ? "종료된 거래입니다" : "메시지를 입력하세요..."
            }
            placeholderTextColor="#bbb"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isClosed}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || isClosed) && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isClosed}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 거래 완료 모달 */}
      <Modal visible={showCloseModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCloseModal(false)}
        />
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>거래 종료</Text>
            <Text style={styles.modalDesc}>거래를 어떻게 종료할까요?</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => handleClose("RETURNED")}
            >
              <Text style={styles.modalBtnText}>✅ 물건을 돌려받았어요</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnGray]}
              onPress={() => handleClose("ABANDONED")}
            >
              <Text style={[styles.modalBtnText, styles.modalBtnTextGray]}>
                거래를 포기할게요
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowCloseModal(false)}
            >
              <Text style={styles.cancelBtnText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    borderWidth: 1.5,
    borderColor: "#6366f130",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 15, fontFamily: fonts.bold, color: "#111" },
  headerSub: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#aaa",
    marginTop: 1,
  },
  completeBtn: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completeBtnText: { fontSize: 13, fontFamily: fonts.bold, color: "#6366f1" },
  reopenBtn: {
    backgroundColor: "#f5f6f8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reopenBtnText: { fontSize: 13, fontFamily: fonts.bold, color: "#888" },
  moreBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closedBanner: {
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#f5f6f8",
  },
  closedText: { fontSize: 13, fontFamily: fonts.bold, color: "#aaa" },
  messageList: { paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
  dateLabelWrap: { alignItems: "center", paddingVertical: 12 },
  dateLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: "#aaa",
    backgroundColor: "#f5f6f8",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  msgRowMine: { flexDirection: "row-reverse" },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    borderWidth: 1.5,
    borderColor: "#6366f130",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  msgCol: { maxWidth: "70%", gap: 3 },
  msgBubble: {
    backgroundColor: "#f3f4f6",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  msgBubbleMine: {
    backgroundColor: "#6366f1",
    borderBottomLeftRadius: 18,
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
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  plusBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#f5f6f8",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: "#111",
  },
  inputDisabled: { backgroundColor: "#f0f0f0", color: "#bbb" },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  itemBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fafbff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 8,
  },
  itemBannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  itemBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#555",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: { fontSize: 18, fontFamily: fonts.bold, color: "#111" },
  modalDesc: { fontSize: 14, fontFamily: fonts.regular, color: "#666" },
  modalBtn: {
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalBtnGray: { backgroundColor: "#f5f6f8" },
  modalBtnText: { fontSize: 14, fontFamily: fonts.bold, color: "#6366f1" },
  modalBtnTextGray: { color: "#888" },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontFamily: fonts.regular, color: "#aaa" },
});
