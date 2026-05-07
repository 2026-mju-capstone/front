import { fonts } from "@/constants/typography";
import { CHAT_ROOMS_URL, CHAT_ROOM_URL } from "@/constants/url";
import { sendGetRequest } from "@/utils/api";
import { useRouter } from "expo-router";
import { Bell, MessageCircle, Package, User } from "lucide-react-native";
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

type ChatRoomRecord = {
  room_id: number;
  owner_nickname: string;
  finder_nickname: string;
  item_detail: string;
};

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
      await sendGetRequest(CHAT_ROOMS_URL, async (res) => {
        const result = await res.json();
        if (result.success && result.data?.chatRoomIds?.length > 0) {
          const ids: number[] = result.data.chatRoomIds;
          const rooms = await Promise.all(
            ids.map(async (id) => {
              return new Promise<ChatRoomRecord | null>(async (resolve) => {
                await sendGetRequest(`${CHAT_ROOM_URL}/${id}`, async (res) => {
                  const r = await res.json();
                  resolve(r.success && r.data ? r.data : null);
                });
              });
            }),
          );
          setChatRooms(rooms.filter(Boolean) as ChatRoomRecord[]);
        } else {
          setChatRooms([]);
        }
      });
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
            onPress={() => router.push("/notifications")}
          >
            <Bell size={20} color="#444" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
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
              onPress={() => router.push(`/chat-room?roomId=${item.room_id}`)}
              activeOpacity={0.6}
            >
              <View style={styles.chatThumb}>
                <Package size={22} color="#6366f1" />
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatNickname}>
                  {item.owner_nickname} · {item.finder_nickname}
                </Text>
                <Text style={styles.chatItemDetail} numberOfLines={1}>
                  {item.item_detail}
                </Text>
              </View>
              <MessageCircle size={16} color="#ccc" />
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
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100 },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  chatThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#6366f130",
  },
  chatInfo: { flex: 1, gap: 4 },
  chatNickname: { fontSize: 15, fontFamily: fonts.bold, color: "#111" },
  chatItemDetail: { fontSize: 13, fontFamily: fonts.regular, color: "#aaa" },
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
