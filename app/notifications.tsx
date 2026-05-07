import { fonts } from "@/constants/typography";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  BellOff,
  CheckCircle,
  ChevronLeft,
  MessageCircle,
  Package,
  Sparkles,
} from "lucide-react-native";
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

type NotificationRecord = {
  id: number;
  type:
    | "MATCH_FOUND"
    | "CHAT_MESSAGE"
    | "ITEM_RETURNED"
    | "THEFT_SUSPECTED"
    | "LOCKER_READY";
  payload: Record<string, any>;
  read_at: string | null;
  created_at: string;
};

const NOTIFICATION_CONFIG = {
  MATCH_FOUND: {
    icon: Sparkles,
    label: "매칭 완료",
    message: "분실물과 매칭되었어요! 확인해보세요.",
  },
  CHAT_MESSAGE: {
    icon: MessageCircle,
    label: "새 메시지",
    message: "새로운 채팅 메시지가 있어요.",
  },
  ITEM_RETURNED: {
    icon: CheckCircle,
    label: "반환 완료",
    message: "물건이 성공적으로 반환되었어요.",
  },
  THEFT_SUSPECTED: {
    icon: AlertTriangle,
    label: "도난 의심",
    message: "물건에 도난 의심 정황이 감지되었어요.",
  },
  LOCKER_READY: {
    icon: Package,
    label: "보관함 준비",
    message: "사물함이 준비되었어요. QR을 스캔해 물건을 꺼내세요.",
  },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      // TODO: 실제 API 연결 후 아래 더미데이터 제거
      const dummyData: NotificationRecord[] = [
        {
          id: 1,
          type: "MATCH_FOUND",
          payload: {},
          read_at: null,
          created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        },
        {
          id: 2,
          type: "CHAT_MESSAGE",
          payload: {},
          read_at: null,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: 3,
          type: "LOCKER_READY",
          payload: {},
          read_at: new Date().toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: 4,
          type: "ITEM_RETURNED",
          payload: {},
          read_at: new Date().toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          id: 5,
          type: "THEFT_SUSPECTED",
          payload: {},
          read_at: new Date().toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
        },
      ];
      setNotifications(dummyData);
    } catch (e) {
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    // TODO: PATCH /api/notifications/mark-as-read 연결
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: new Date().toISOString() })),
    );
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.listHeaderLeft}>
        <Text style={styles.listHeaderTitle}>알림 목록</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>새 알림 {unreadCount}개</Text>
          </View>
        )}
      </View>
      {unreadCount > 0 && (
        <TouchableOpacity onPress={handleMarkAllRead} style={styles.readAllBtn}>
          <Text style={styles.readAllText}>모두 읽음</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<ListHeader />}
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
                <BellOff size={32} color="#6366f1" />
              </View>
              <Text style={styles.emptyTitle}>알림이 없어요</Text>
              <Text style={styles.emptyDesc}>
                새로운 알림이 오면 여기에 표시돼요
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const config = NOTIFICATION_CONFIG[item.type];
            const IconComponent = config.icon;
            const isUnread = !item.read_at;

            return (
              <TouchableOpacity
                style={[styles.notifCard, isUnread && styles.notifCardUnread]}
                activeOpacity={0.7}
                onPress={() => {
                  // TODO: 알림 타입별 화면 이동
                }}
              >
                <View
                  style={[
                    styles.iconWrap,
                    isUnread ? styles.iconWrapUnread : styles.iconWrapRead,
                  ]}
                >
                  <IconComponent
                    size={22}
                    color={isUnread ? "#6366f1" : "#bbb"}
                  />
                </View>
                <View style={styles.notifInfo}>
                  <View style={styles.notifTopRow}>
                    <Text
                      style={[
                        styles.notifLabel,
                        !isUnread && styles.notifLabelRead,
                      ]}
                    >
                      {config.label}
                    </Text>
                    <Text style={styles.notifTime}>
                      {timeAgo(item.created_at)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.notifMessage,
                      !isUnread && styles.notifMessageRead,
                    ]}
                    numberOfLines={2}
                  >
                    {config.message}
                  </Text>
                </View>
                {isUnread && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontFamily: fonts.bold, color: "#111" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 40 },
  listContentEmpty: { flex: 1 },

  // 목록 상단 섹션
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  listHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listHeaderTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: "#111",
  },
  unreadBadge: {
    backgroundColor: "#eef2ff",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#6366f1",
  },
  readAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f5f6f8",
  },
  readAllText: { fontSize: 12, fontFamily: fonts.bold, color: "#555" },

  // 알림 카드
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  notifCardUnread: { backgroundColor: "#fafbff" },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapUnread: { backgroundColor: "#eef2ff" },
  iconWrapRead: { backgroundColor: "#f5f6f8" },
  notifInfo: { flex: 1, gap: 4 },
  notifTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notifLabel: { fontSize: 13, fontFamily: fonts.bold, color: "#111" },
  notifLabelRead: { color: "#aaa" },
  notifTime: { fontSize: 11, fontFamily: fonts.regular, color: "#bbb" },
  notifMessage: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#555",
    lineHeight: 18,
  },
  notifMessageRead: { color: "#bbb" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366f1",
  },

  // 빈 상태
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
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
