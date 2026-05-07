import { authService } from "@/api/services/auth";
import ProfileEditModal from "@/components/ProfileEditModal";
import { fonts } from "@/constants/typography";
import { useProfile } from "@/hooks/queries/useUserQueries";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  ClipboardList,
  Lock,
  LogOut,
  MessageCircle,
  Package,
  Pencil,
  ShieldCheck,
  User,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MyPageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useProfile();
  const { clearToken } = useAuthStore();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [chatOnlyMode, setChatOnlyMode] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const handleLogout = async () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "확인",
        onPress: async () => {
          try {
            await authService.logout();
            await clearToken();
          } catch {
            await clearToken();
          }
        },
      },
    ]);
  };

  const activityMenus = [
    {
      label: "내가 등록한 분실물",
      icon: ClipboardList,
      desc: "내가 등록한 분실물 목록",
      action: () => router.push("/(tabs)/lost-item"),
    },
    {
      label: "내가 습득한 물품",
      icon: Package,
      desc: "내가 습득해서 등록한 목록",
      action: () => router.push("/(tabs)/lost-item"),
    },
    {
      label: "채팅 목록",
      icon: MessageCircle,
      desc: "진행 중인 채팅방",
      action: () => router.push("/(tabs)/chat"),
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 정보</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/notifications")}
        >
          <Bell size={22} color="#444" />
          {profile && profile.unreadCount > 0 && (
            <View style={styles.bellDot} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <User size={32} color="#6366f1" />
              </View>
              <TouchableOpacity
                style={styles.editAvatarBtn}
                onPress={() => setIsEditModalVisible(true)}
              >
                <Pencil size={12} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.nickname ?? "사용자"}
              </Text>
              <Text style={styles.profileDept}>
                {profile?.department ?? "학과 정보 없음"}
              </Text>
              <Text style={styles.profileUniv}>명지대학교 자연캠퍼스</Text>
            </View>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setIsEditModalVisible(true)}
            >
              <Text style={styles.editBtnText}>프로필 수정</Text>
              <ChevronRight size={12} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 통계 섹션 */}
        <View style={styles.statsRow}>
          {[
            { label: "등록한 분실물", value: profile?.postCount ?? 0 },
            { label: "습득한 물품", value: profile?.chatRoomCount ?? 0 },
          ].map((stat, idx) => (
            <View
              key={stat.label}
              style={[styles.statItem, idx === 0 && styles.statItemBorder]}
            >
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* 활동 내역 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>활동 내역</Text>
          {activityMenus.map((menu, idx) => (
            <TouchableOpacity
              key={menu.label}
              style={[styles.menuItem, idx > 0 && styles.menuItemBorder]}
              onPress={menu.action}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <menu.icon size={18} color="#6366f1" />
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuLabel}>{menu.label}</Text>
                  <Text style={styles.menuDesc}>{menu.desc}</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>

        {/* 설정 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>설정</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View
                style={[styles.settingIcon, { backgroundColor: "#eef2ff" }]}
              >
                <Bell size={18} color="#6366f1" />
              </View>
              <Text style={styles.settingText}>푸시 알림 설정</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: "#e5e7eb", true: "#c7d2fe" }}
              thumbColor={pushEnabled ? "#6366f1" : "#f9fafb"}
            />
          </View>

          <View style={[styles.settingItem, styles.settingItemBorder]}>
            <View style={styles.settingLeft}>
              <View
                style={[styles.settingIcon, { backgroundColor: "#eef2ff" }]}
              >
                <MessageCircle size={18} color="#6366f1" />
              </View>
              <Text style={styles.settingText}>매칭 채팅만 받기</Text>
            </View>
            <Switch
              value={chatOnlyMode}
              onValueChange={setChatOnlyMode}
              trackColor={{ false: "#e5e7eb", true: "#c7d2fe" }}
              thumbColor={chatOnlyMode ? "#6366f1" : "#f9fafb"}
            />
          </View>

          <TouchableOpacity
            style={[styles.settingItem, styles.settingItemBorder]}
          >
            <View style={styles.settingLeft}>
              <View
                style={[styles.settingIcon, { backgroundColor: "#eef2ff" }]}
              >
                <ShieldCheck size={18} color="#6366f1" />
              </View>
              <Text style={styles.settingText}>개인정보 처리방침</Text>
            </View>
            <ChevronRight size={18} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        {/* 계정 */}
        <View style={[styles.card, { marginBottom: 40 }]}>
          <Text style={styles.cardTitle}>계정</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View
                style={[styles.settingIcon, { backgroundColor: "#f5f6f8" }]}
              >
                <Lock size={18} color="#888" />
              </View>
              <Text style={styles.settingText}>비밀번호 변경</Text>
            </View>
            <ChevronRight size={18} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, styles.settingItemBorder]}
            onPress={handleLogout}
          >
            <View style={styles.settingLeft}>
              <View
                style={[styles.settingIcon, { backgroundColor: "#fef2f2" }]}
              >
                <LogOut size={18} color="#f87171" />
              </View>
              <Text style={[styles.settingText, { color: "#f87171" }]}>
                로그아웃
              </Text>
            </View>
            <ChevronRight size={18} color="#fecaca" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ProfileEditModal
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        profile={profile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6f8" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: "#111" },
  iconBtn: { position: "relative", padding: 4 },
  bellDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f87171",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  profileSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 1,
  },
  profileRow: { flexDirection: "row", alignItems: "center" },
  avatarWrap: { position: "relative", marginRight: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#6366f130",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 18, fontFamily: fonts.bold, color: "#111" },
  profileDept: { fontSize: 13, fontFamily: fonts.medium, color: "#6366f1" },
  profileUniv: { fontSize: 11, fontFamily: fonts.regular, color: "#aaa" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 2,
  },
  editBtnText: { fontSize: 11, fontFamily: fonts.bold, color: "#6366f1" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  statItemBorder: {
    borderRightWidth: 1,
    borderRightColor: "#f3f4f6",
  },
  statValue: { fontSize: 20, fontFamily: fonts.bold, color: "#111" },
  statLabel: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#aaa",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: "#111",
    marginBottom: 14,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  menuInfo: { gap: 2 },
  menuLabel: { fontSize: 14, fontFamily: fonts.bold, color: "#111" },
  menuDesc: { fontSize: 12, fontFamily: fonts.regular, color: "#aaa" },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingText: { fontSize: 14, fontFamily: fonts.medium, color: "#333" },
});
