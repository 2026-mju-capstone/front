import { fonts } from "@/constants/typography";
import { useRouter } from "expo-router";
import { Bell, MessageCircle, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {ROUTES} from "@/constants/url";

type ChatRoomRecord = {
    room_id: number;
    owner_nickname: string;
    finder_nickname: string;
    item_detail: string;
    last_message?: string;
    last_message_time?: string;
    unread_count?: number;
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "방금 전";
    if (min < 60) return `${min}분 전`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour}시간 전`;
    return "어제";
}

export default function ChatScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [chatRooms, setChatRooms] = useState<ChatRoomRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchChatRooms();
    }, []);

    const fetchChatRooms = async () => {
        setIsLoading(true);
        try {
            // TODO: 실제 API 연결 후 더미데이터 제거
            const dummyRooms: ChatRoomRecord[] = [
                {
                    room_id: 1,
                    owner_nickname: "이서연",
                    finder_nickname: "이성민",
                    item_detail: "에어팟 프로",
                    last_message: "에어팟 찾으셨나요? 제가 도서관에서 봤어요!",
                    last_message_time: new Date(Date.now() - 1000 * 30).toISOString(),
                    unread_count: 3,
                },
                {
                    room_id: 2,
                    owner_nickname: "박지호",
                    finder_nickname: "이성민",
                    item_detail: "파란색 우산",
                    last_message: "우산 학생회관 안내데스크에 맡겨뒀어요",
                    last_message_time: new Date(
                        Date.now() - 1000 * 60 * 10,
                    ).toISOString(),
                    unread_count: 1,
                },
                {
                    room_id: 3,
                    owner_nickname: "김민준",
                    finder_nickname: "이성민",
                    item_detail: "검정 지갑",
                    last_message: "감사합니다! 내일 찾으러 갈게요",
                    last_message_time: new Date(
                        Date.now() - 1000 * 60 * 60,
                    ).toISOString(),
                    unread_count: 0,
                },
                {
                    room_id: 4,
                    owner_nickname: "최유나",
                    finder_nickname: "이성민",
                    item_detail: "갤럭시 버즈",
                    last_message: "갤럭시 버즈 맞나요? 확인해보세요",
                    last_message_time: new Date(
                        Date.now() - 1000 * 60 * 60 * 3,
                    ).toISOString(),
                    unread_count: 0,
                },
                {
                    room_id: 5,
                    owner_nickname: "정현우",
                    finder_nickname: "이성민",
                    item_detail: "학생증",
                    last_message: "학생증 체육관 분실물함에 있어요",
                    last_message_time: new Date(
                        Date.now() - 1000 * 60 * 60 * 25,
                    ).toISOString(),
                    unread_count: 0,
                },
            ];
            setChatRooms(dummyRooms);
        } catch (e) {
            console.error("채팅방 목록 조회 실패", e);
            setChatRooms([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setIsRefreshing(true);
        await fetchChatRooms();
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>채팅</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => router.push(ROUTES.NOTIFICATION)}
                    >
                        <Bell size={20} color="#444" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => router.push(ROUTES.MYPAGE)}
                    >
                        <User size={20} color="#444" />
                    </TouchableOpacity>
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator color="#6366f1" />
                </View>
            ) : (
                <FlatList
                    data={chatRooms}
                    keyExtractor={(item) => String(item.room_id)}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            colors={["#6366f1"]}
                            tintColor="#6366f1"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <View style={styles.emptyIconWrap}>
                                <MessageCircle size={36} color="#6366f1" />
                            </View>
                            <Text style={styles.emptyTitle}>채팅이 없어요</Text>
                            <Text style={styles.emptyDesc}>
                                분실물 게시글에서 채팅으로 문의해보세요
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.chatCard}
                            onPress={() =>
                                router.push({
                                    pathname: "/chat-room",
                                    params: { roomId: item.room_id },
                                })
                            }
                            activeOpacity={0.6}
                        >
                            {/* 아바타 */}
                            <View style={styles.avatar}>
                                <User size={24} color="#aaa" />
                            </View>

                            {/* 채팅 정보 */}
                            <View style={styles.chatInfo}>
                                <View style={styles.chatTopRow}>
                                    <Text style={styles.chatNickname} numberOfLines={1}>
                                        {item.owner_nickname}
                                    </Text>
                                    <Text style={styles.chatTime}>
                                        {item.last_message_time
                                            ? timeAgo(item.last_message_time)
                                            : ""}
                                    </Text>
                                </View>
                                <Text style={styles.chatItemDetail} numberOfLines={1}>
                                    {item.item_detail}
                                </Text>
                                <View style={styles.chatBottomRow}>
                                    <Text style={styles.chatLastMessage} numberOfLines={1}>
                                        {item.last_message ?? ""}
                                    </Text>
                                    {item.unread_count != null && item.unread_count > 0 && (
                                        <View style={styles.unreadBadge}>
                                            <Text style={styles.unreadBadgeText}>
                                                {item.unread_count}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: "#fff",
    },
    headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: "#111" },
    headerIcons: { flexDirection: "row", gap: 6 },
    iconBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
    listContent: { paddingTop: 4, paddingBottom: 100 },
    chatCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: "#eef2ff",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "#6366f130",
    },
    chatInfo: { flex: 1, gap: 3 },
    chatTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    chatNickname: { fontSize: 15, fontFamily: fonts.bold, color: "#111" },
    chatTime: { fontSize: 12, fontFamily: fonts.regular, color: "#bbb" },
    chatItemDetail: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: "#6366f1",
    },
    chatBottomRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    chatLastMessage: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: "#888",
        flex: 1,
    },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#6366f1",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 6,
        marginLeft: 8,
    },
    unreadBadgeText: { fontSize: 11, fontFamily: fonts.bold, color: "#fff" },
    emptyBox: { alignItems: "center", paddingVertical: 80, gap: 12 },
    emptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#eef2ff",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    emptyTitle: { fontSize: 16, fontFamily: fonts.bold, color: "#333" },
    emptyDesc: { fontSize: 13, fontFamily: fonts.regular, color: "#aaa" },
});