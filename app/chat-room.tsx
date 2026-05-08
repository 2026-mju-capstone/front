import {fonts} from "@/constants/typography";
import {CHAT_ROOM_URL, ROUTES} from "@/constants/url";
import {useLocalSearchParams, useRouter} from "expo-router";
import {
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Package,
    Plus,
    Send,
    User,
} from "lucide-react-native";
import {useEffect, useRef, useState} from "react";
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
import {useSafeAreaInsets} from "react-native-safe-area-context";
import axiosInstance from "@/api/client";

type Message = {
    message: string | null;
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
    item_id?: number;
};

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const h = d.getHours();
    const hh = String(h).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
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
    const {roomId} = useLocalSearchParams<{ roomId: string }>();
    const flatListRef = useRef<FlatList>(null);

    const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isClosed, setIsClosed] = useState(false);

    useEffect(() => {
        fetchChatRoom();
        fetchMessages();
        // const interval = setInterval(fetchMessages, 5000);
        // return () => clearInterval(interval);
    }, [roomId]);

    const fetchChatRoom = async () => {
        // TODO: 실제 API 연결 후 더미데이터 제거
        setChatRoom({
            room_id: 1,
            owner_nickname: "박지호",
            finder_nickname: "이성민",
            item_detail: "파란색 우산",
            item_id: 1,
        });
    };

    const fetchMessages = async () => {
        try {
            // TODO: 실제 API 연결 후 더미데이터 제거
            const dummyMessages: Message[] = [
                {
                    message: "파란색 우산 잃어버리셨나요?",
                    sender_id: 2,
                    sender_nickname: "박지호",
                    sent_at: new Date().toISOString().replace(/T.*/, "T13:00:00"),
                    read_at: new Date().toISOString(),
                },
                {
                    message: "네 맞아요! 어디서 보셨어요?",
                    sender_id: 1,
                    sender_nickname: "이성민",
                    sent_at: new Date().toISOString().replace(/T.*/, "T13:05:00"),
                    read_at: new Date().toISOString(),
                },
                {
                    message: "학생회관 1층 우산꽂이 옆에 있더라고요",
                    sender_id: 2,
                    sender_nickname: "박지호",
                    sent_at: new Date().toISOString().replace(/T.*/, "T13:06:00"),
                    read_at: new Date().toISOString(),
                },
                {
                    message: "우산 학생회관 안내데스크에 맡겨뒀어요",
                    sender_id: 2,
                    sender_nickname: "박지호",
                    sent_at: new Date().toISOString().replace(/T.*/, "T13:10:00"),
                    read_at: new Date().toISOString(),
                },
            ];
            setMessages(dummyMessages);
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
            const response = await axiosInstance.post(
                `${CHAT_ROOM_URL}/${roomId}/messages/send`,
                {message: text},
            );

            if (response.data.success) {
                await fetchMessages();
                flatListRef.current?.scrollToEnd({animated: true});
            } else {
                Alert.alert("전송 실패", "메시지를 전송하지 못했어요.");
                setInputText(text);
            }
        } catch (error) {
            console.error("메시지 전송 에러:", error);
            Alert.alert("오류", "네트워크 오류가 발생했어요.");
            setInputText(text);
        } finally {
            setIsSending(false);
        }
    };

    const handleComplete = () => {
        Alert.alert(
            "회수 완료",
            "정말 회수가 완료되셨나요?\n종료 후에는 복구할 수 없습니다.",
            [
                {text: "취소", style: "cancel"},
                {text: "완료", onPress: () => setIsClosed(true)},
            ],
        );
    };

    // 날짜 구분선 삽입을 위한 데이터 가공
    type MessageItem = Message | { type: "date"; label: string; key: string };

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
                    {alignItems: "center", justifyContent: "center"},
                ]}
            >
                <ActivityIndicator color="#6366f1" size="large"/>
            </View>
        );
    }

    return (
        <View style={[styles.container, {paddingTop: insets.top}]}>
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={22} color="#333"/>
                </TouchableOpacity>
                <View style={styles.avatarWrap}>
                    <User size={20} color="#aaa"/>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {chatRoom?.owner_nickname ?? "채팅"}
                    </Text>
                    {chatRoom?.item_detail ? (
                        <Text style={styles.headerSub} numberOfLines={1}>
                            {chatRoom.item_detail}
                        </Text>
                    ) : null}
                </View>
                {!isClosed && (
                    <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
                        <Text style={styles.completeBtnText}>회수 완료</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.moreBtn}>
                    <MoreVertical size={20} color="#555"/>
                </TouchableOpacity>
            </View>

            {/* 분실물 배너 */}
            {chatRoom && (
                <TouchableOpacity
                    style={styles.itemBanner}
                    onPress={() => {
                        if (chatRoom.item_id) {
                            router.push({
                                pathname: ROUTES.LOST_ITEM_DETAIL,
                                params: {id: chatRoom.item_id},
                            });
                        }
                    }}
                    activeOpacity={0.7}
                >
                    <View style={styles.itemBannerIcon}>
                        <Package size={16} color="#6366f1"/>
                    </View>
                    <Text style={styles.itemBannerText} numberOfLines={1}>
                        {chatRoom.item_detail}
                    </Text>
                    <ChevronRight size={14} color="#aaa"/>
                </TouchableOpacity>
            )}

            {isClosed && (
                <View style={styles.closedBanner}>
                    <Text style={styles.closedText}>종료된 거래입니다</Text>
                </View>
            )}

            {/* 메시지 목록 */}
            <KeyboardAvoidingView
                style={{flex: 1}}
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
                        flatListRef.current?.scrollToEnd({animated: false})
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>첫 메시지를 보내보세요!</Text>
                        </View>
                    }
                    renderItem={({item}) => {
                        // 날짜 구분선
                        if ("type" in item && item.type === "date") {
                            return (
                                <View style={styles.dateLabelWrap}>
                                    <Text style={styles.dateLabel}>{item.label}</Text>
                                </View>
                            );
                        }

                        const msg = item as Message;

                        // 시스템 메시지
                        if (msg.sender_id === null) {
                            return (
                                <View style={styles.systemMsgWrap}>
                                    <Text style={styles.systemMsg}>{msg.message}</Text>
                                </View>
                            );
                        }

                        const isMine = msg.sender_nickname === chatRoom?.finder_nickname;

                        return (
                            <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
                                {!isMine && (
                                    <View style={styles.msgAvatar}>
                                        <User size={16} color="#aaa"/>
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
                <View style={[styles.inputWrap, {paddingBottom: insets.bottom + 8}]}>
                    <TouchableOpacity style={styles.plusBtn}>
                        <Plus size={22} color="#aaa"/>
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
                        disabled={!inputText.trim() || isClosed || isSending}
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color="#fff"/>
                        ) : (
                            <Send size={18} color="#fff"/>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: "#fff"},
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
    headerInfo: {flex: 1},
    headerTitle: {fontSize: 15, fontFamily: fonts.bold, color: "#111"},
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
    completeBtnText: {fontSize: 13, fontFamily: fonts.bold, color: "#6366f1"},
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
    closedText: {fontSize: 13, fontFamily: fonts.bold, color: "#aaa"},
    messageList: {paddingHorizontal: 16, paddingVertical: 16, gap: 8},
    dateLabelWrap: {alignItems: "center", paddingVertical: 12},
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
    msgRowMine: {flexDirection: "row-reverse"},
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
    msgCol: {maxWidth: "70%", gap: 3},
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
    msgTextMine: {color: "#fff"},
    msgTime: {
        fontSize: 10,
        fontFamily: fonts.regular,
        color: "#bbb",
        marginLeft: 4,
    },
    msgTimeMine: {textAlign: "right", marginRight: 4},
    systemMsgWrap: {alignItems: "center", paddingVertical: 4},
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
    inputDisabled: {backgroundColor: "#f0f0f0", color: "#bbb"},
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
    sendBtnDisabled: {backgroundColor: "#d1d5db", shadowOpacity: 0},
    emptyBox: {alignItems: "center", paddingVertical: 40},
    emptyText: {fontSize: 14, color: "#aaa", fontFamily: fonts.regular},
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
});
