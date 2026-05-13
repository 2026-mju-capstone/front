import { fonts } from "@/constants/typography";
import { useProfile } from "@/hooks/queries/useUserQueries";
import { useRouter } from "expo-router";
import { ChevronLeft, Info, ScanLine, Sparkles } from "lucide-react-native";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const QR_SIZE = Math.min(SCREEN_WIDTH - 80, 260);

export default function MyQRScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useProfile();

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

  // QR 데이터: 닉네임 기반 (백엔드 명세에 따라 추후 수정 가능)
  const qrValue = profile?.nickname
    ? `zoopick://owner/${profile.nickname}`
    : "zoopick://owner/unknown";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내 QR 코드</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 안내 배너 */}
      <View style={styles.intro}>
        <View style={styles.introIcon}>
          <Sparkles size={20} color="#6366f1" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.introTitle}>내 물건에 QR을 붙여보세요</Text>
          <Text style={styles.introDesc}>
            누군가 발견하면 바로 채팅으로 연락할 수 있어요
          </Text>
        </View>
      </View>

      {/* QR 카드 */}
      <View style={styles.qrCard}>
        <View style={styles.qrWrap}>
          <QRCode
            value={qrValue}
            size={QR_SIZE}
            color="#111"
            backgroundColor="#fff"
          />
        </View>

        <View style={styles.profileBox}>
          <Text style={styles.profileLabel}>소유자</Text>
          <Text style={styles.profileName}>
            {profile?.nickname ?? "사용자"}
          </Text>
          {profile?.department ? (
            <Text style={styles.profileDept}>{profile.department}</Text>
          ) : null}
        </View>
      </View>

      {/* 안내 사항 */}
      <View style={styles.tips}>
        <View style={styles.tipRow}>
          <ScanLine size={14} color="#888" />
          <Text style={styles.tipText}>QR을 인쇄해서 물건에 부착해주세요</Text>
        </View>
        <View style={styles.tipRow}>
          <Info size={14} color="#888" />
          <Text style={styles.tipText}>
            상대방이 스캔하기 쉽도록 화면을 밝게 해주세요
          </Text>
        </View>
      </View>
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
  intro: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  introIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  introTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: "#6366f1",
    marginBottom: 2,
  },
  introDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#6366f1",
    opacity: 0.8,
  },
  qrCard: {
    alignItems: "center",
    marginTop: 32,
    marginHorizontal: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#6366f1",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  qrWrap: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  profileBox: { alignItems: "center", marginTop: 24, gap: 4 },
  profileLabel: { fontSize: 11, fontFamily: fonts.regular, color: "#aaa" },
  profileName: { fontSize: 18, fontFamily: fonts.bold, color: "#111" },
  profileDept: { fontSize: 12, fontFamily: fonts.regular, color: "#888" },
  tips: {
    marginTop: 24,
    marginHorizontal: 20,
    gap: 8,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  tipText: { fontSize: 12, fontFamily: fonts.regular, color: "#888" },
});
