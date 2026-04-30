import { fonts } from "@/constants/typography";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Book,
  ChevronLeft,
  CreditCard,
  Headphones,
  MapPin,
  MessageCircle,
  Package,
  Share2,
  Shirt,
  X,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const KAKAO_API_KEY = "7488059674373cdf0eb9299fef1ec2ec";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CATEGORY_MAP: Record<string, string> = {
  BOOK: "도서",
  ELECTRONICS: "전자기기",
  CLOTHING: "소지품",
  WALLET: "지갑/카드",
  ID_CARD: "지갑/카드",
  OTHER: "기타",
};

const categoryIconMap: Record<string, any> = {
  도서: Book,
  전자기기: Headphones,
  소지품: Shirt,
  "지갑/카드": CreditCard,
  기타: Package,
};

const statusLabel: Record<string, string> = {
  LOST: "찾는중",
  FOUND: "발견됨",
};

const statusColor: Record<string, { bg: string; text: string }> = {
  LOST: { bg: "#fff7ed", text: "#f97316" },
  FOUND: { bg: "#dcfce7", text: "#16a34a" },
};

const DUMMY_DETAIL = {
  id: 1,
  type: "FOUND",
  status: "FOUND",
  category: "ELECTRONICS",
  color: "검정",
  title: "삼성 갤럭시 버즈",
  description:
    "검정색 갤럭시 버즈 케이스입니다. 케이스에 스티커가 붙어있어요. 3층 강의실 책상 위에 놓여있었습니다.",
  image_url:
    "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800",
  location_name: "제1공학관 · 3층 강의실",
  reported_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  lat: 37.222690087856,
  lng: 127.18742790765737,
};

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? "오전" : "오후";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${month}월 ${day}일 ${ampm} ${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function LostItemDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [showImageModal, setShowImageModal] = useState(false);

  // TODO: id로 API 호출해서 실제 데이터 받아오기
  const item = DUMMY_DETAIL;

  const korCategory = CATEGORY_MAP[item.category] ?? "기타";
  const IconComponent = categoryIconMap[korCategory] ?? Package;
  const statusStyle = statusColor[item.type] ?? { bg: "#f3f4f6", text: "#888" };
  const locationParts = item.location_name?.split(" · ") ?? [];
  const buildingName = locationParts[0] ?? item.location_name;
  const detailLocation = locationParts[1] ?? "";

  const handleShare = async () => {
    try {
      await Share.share({
        message: `[줍픽] ${item.title} - ${item.location_name}`,
      });
    } catch (e) {
      Alert.alert("공유 실패");
    }
  };

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}&autoload=true"></script>
      <script>
        var map = new kakao.maps.Map(document.getElementById('map'), {
          center: new kakao.maps.LatLng(${item.lat}, ${item.lng}),
          level: 3
        });
        var marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(${item.lat}, ${item.lng}),
          map: map
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* 히어로 영역 */}
        <View style={styles.heroArea}>
          {item.image_url ? (
            // 이미지 있을 때 - 탭하면 풀스크린
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setShowImageModal(true)}
            >
              <Image
                source={{ uri: item.image_url }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            // 이미지 없을 때 - 앱 배경색 + 카테고리 아이콘
            <View style={styles.heroNoImage}>
              <View style={styles.heroIconWrap}>
                <IconComponent size={52} color="#6366f1" />
              </View>
            </View>
          )}

          {/* 뒤로가기 버튼 */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 12 }]}
            onPress={() => router.back()}
          >
            <ChevronLeft size={22} color={item.image_url ? "#fff" : "#333"} />
          </TouchableOpacity>
        </View>

        {/* 메인 카드 */}
        <View style={styles.mainCard}>
          {/* 뱃지 행 */}
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{korCategory}</Text>
            </View>
            <View
              style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
            >
              <Text
                style={[styles.statusBadgeText, { color: statusStyle.text }]}
              >
                {statusLabel[item.type]}
              </Text>
            </View>
          </View>

          {/* 제목 */}
          <Text style={styles.title}>{item.title}</Text>

          {/* 위치 카드 */}
          <View style={styles.locationCard}>
            <View style={styles.locationIconWrap}>
              <MapPin size={18} color="#6366f1" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationBuilding}>{buildingName}</Text>
              {detailLocation ? (
                <Text style={styles.locationDetail}>{detailLocation}</Text>
              ) : null}
            </View>
            <View style={styles.locationTimeWrap}>
              <Text style={styles.locationTimeLabel}>
                {item.type === "FOUND" ? "습득" : "분실"}
              </Text>
              <Text style={styles.locationTime}>
                {formatDateTime(item.reported_at)}
              </Text>
            </View>
          </View>

          {/* 상세 설명 */}
          {item.description ? (
            <View style={styles.descSection}>
              <Text style={styles.sectionLabel}>상세 설명</Text>
              <Text style={styles.descText}>{item.description}</Text>
            </View>
          ) : null}

          {/* 카카오맵 */}
          <Text style={styles.sectionLabel}>위치</Text>
          <View style={styles.mapWrap}>
            <WebView
              source={{ html: mapHTML }}
              style={styles.map}
              javaScriptEnabled
              domStorageEnabled
              scrollEnabled={false}
            />
          </View>

          {/* 채팅 안내 배너 */}
          <View style={styles.chatBanner}>
            <View style={styles.chatBannerIcon}>
              <MessageCircle size={18} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.chatBannerTitle}>채팅으로 문의하기</Text>
              <Text style={styles.chatBannerDesc}>
                분실물을 발견하셨거나 본인 소유물이라면 채팅으로 연락해 주세요.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => router.push("/(tabs)/chat")}
          activeOpacity={0.85}
        >
          <MessageCircle size={18} color="#fff" />
          <Text style={styles.chatBtnText}>채팅으로 문의하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Share2 size={18} color="#888" />
        </TouchableOpacity>
      </View>

      {/* 풀스크린 이미지 모달 */}
      <Modal visible={showImageModal} transparent animationType="fade">
        <View style={styles.imageModal}>
          <TouchableOpacity
            style={[styles.imageModalClose, { top: insets.top + 12 }]}
            onPress={() => setShowImageModal(false)}
          >
            <X size={22} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: item.image_url }}
            style={styles.imageModalImg}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // 히어로
  heroArea: { width: "100%", height: 380, position: "relative" },
  heroImage: { width: "100%", height: 380 },
  heroNoImage: {
    width: "100%",
    height: 380,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  heroIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // 메인 카드
  mainCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },

  // 뱃지
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  categoryBadge: {
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryBadgeText: { fontSize: 11, fontFamily: fonts.bold, color: "#888" },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontFamily: fonts.bold },

  // 제목
  title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: "#111",
    marginBottom: 16,
    lineHeight: 30,
  },

  // 위치 카드
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8fa",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: { flex: 1 },
  locationBuilding: { fontSize: 15, fontFamily: fonts.bold, color: "#111" },
  locationDetail: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#aaa",
    marginTop: 2,
  },
  locationTimeWrap: { alignItems: "flex-end" },
  locationTimeLabel: { fontSize: 10, fontFamily: fonts.regular, color: "#aaa" },
  locationTime: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: "#555",
    marginTop: 2,
  },

  // 상세 설명
  descSection: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#aaa",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  descText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: "#444",
    lineHeight: 22,
  },

  // 지도
  mapWrap: {
    height: 180,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
  },
  map: { flex: 1 },

  // 채팅 배너
  chatBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#eef2ff",
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  chatBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(99,102,241,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatBannerTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: "#6366f1",
    marginBottom: 2,
  },
  chatBannerDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#6366f1",
    opacity: 0.8,
    lineHeight: 16,
  },

  // 하단 버튼
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  chatBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#6366f1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  chatBtnText: { fontSize: 15, fontFamily: fonts.bold, color: "#fff" },
  shareBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#f5f6f8",
    alignItems: "center",
    justifyContent: "center",
  },

  // 풀스크린 이미지 모달
  imageModal: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  imageModalClose: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageModalImg: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 },
});
