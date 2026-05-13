import { fonts } from "@/constants/typography";
import { BASE_URL, ROUTES } from "@/constants/url";
import { useMatchMutations } from "@/hooks/mutations/useMatchMutations";
import { useMatchQueries } from "@/hooks/queries/useMatchQueries";
import { useRouter } from "expo-router";
import {
  Award,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Sparkles,
  XCircle,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function MatchesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"confirm" | "reject" | null>(null);

  const { data, isLoading, refetch } = useMatchQueries.useMyMatches();
  const confirmMutation = useMatchMutations.useConfirmMatch();
  const rejectMutation = useMatchMutations.useRejectMatch();

  const matches = data?.success ? data.data : [];
  // CANDIDATE / NOTIFIED 만 노출 (이미 처리한 건 제외)
  const pendingMatches = matches.filter(
    (m) => m.status === "CANDIDATE" || m.status === "NOTIFIED",
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const openModal = (matchId: string, type: "confirm" | "reject") => {
    setSelectedMatchId(matchId);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedMatchId(null);
    setModalType(null);
  };

  const handleConfirm = () => {
    if (!selectedMatchId) return;
    const id = Number(selectedMatchId);
    closeModal();
    confirmMutation.mutate(id, {
      onSuccess: () => {
        Toast.show({
          type: "success",
          text1: "매칭이 성사되었어요!",
          text2: "회수 절차를 진행해주세요.",
          position: "bottom",
          visibilityTime: 2500,
        });
      },
      onError: () => {
        Toast.show({
          type: "error",
          text1: "매칭 수락 실패",
          text2: "다시 시도해주세요.",
          position: "bottom",
          visibilityTime: 2500,
        });
      },
    });
  };

  const handleReject = () => {
    if (!selectedMatchId) return;
    const id = Number(selectedMatchId);
    closeModal();
    rejectMutation.mutate(id, {
      onSuccess: () => {
        Toast.show({
          type: "success",
          text1: "매칭을 거절했어요",
          position: "bottom",
          visibilityTime: 2000,
        });
      },
      onError: () => {
        Toast.show({
          type: "error",
          text1: "매칭 거절 실패",
          position: "bottom",
          visibilityTime: 2000,
        });
      },
    });
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
        <Text style={styles.headerTitle}>매칭 후보</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={pendingMatches}
        keyExtractor={(item) => item.match_id}
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
        ListHeaderComponent={
          pendingMatches.length > 0 ? (
            <View style={styles.intro}>
              <View style={styles.introIcon}>
                <Sparkles size={20} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.introTitle}>
                  분실물과 유사한 습득물을 발견했어요
                </Text>
                <Text style={styles.introDesc}>
                  확인하고 내 물건이 맞다면 수락해주세요
                </Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Sparkles size={36} color="#6366f1" />
            </View>
            <Text style={styles.emptyTitle}>매칭 후보가 없어요</Text>
            <Text style={styles.emptyDesc}>
              새로운 매칭이 생기면 알림으로 알려드릴게요
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const imageUrl = item.found_image_url
            ? item.found_image_url.startsWith("http")
              ? item.found_image_url
              : `${BASE_URL}${item.found_image_url}`
            : null;
          const scorePercent = Math.round(item.score * 100);

          return (
            <View style={styles.card}>
              {/* 상단 점수 배지 */}
              <View style={styles.scoreRow}>
                <View style={styles.scoreBadge}>
                  <Award size={12} color="#6366f1" />
                  <Text style={styles.scoreText}>유사도 {scorePercent}%</Text>
                </View>
              </View>

              {/* 이미지 */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: ROUTES.LOST_ITEM_DETAIL,
                    params: { id: item.found_post_id },
                  })
                }
              >
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Sparkles size={32} color="#6366f1" />
                  </View>
                )}
              </TouchableOpacity>

              {/* 정보 */}
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.found_post_title}
                </Text>
                {item.locationName ? (
                  <View style={styles.locationRow}>
                    <Building2 size={13} color="#888" />
                    <Text style={styles.location} numberOfLines={1}>
                      {item.locationName}
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.finder}>
                  습득자: {item.found_nickname}
                  {item.found_department ? ` · ${item.found_department}` : ""}
                </Text>
              </View>

              {/* 버튼 */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => openModal(item.match_id, "reject")}
                  activeOpacity={0.85}
                >
                  <XCircle size={16} color="#888" />
                  <Text style={styles.rejectBtnText}>내 거 아니에요</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => openModal(item.match_id, "confirm")}
                  activeOpacity={0.85}
                >
                  <CheckCircle2 size={16} color="#fff" />
                  <Text style={styles.confirmBtnText}>내 물건이에요</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* 확인 모달 */}
      <Modal visible={modalType !== null} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={closeModal} />
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modalType === "confirm"
                ? "매칭을 수락하시겠어요?"
                : "매칭을 거절하시겠어요?"}
            </Text>
            <Text style={styles.modalDesc}>
              {modalType === "confirm"
                ? "수락하면 회수 절차가 진행되며,\n취소할 수 없어요."
                : "거절한 매칭은 다시 받을 수 없어요."}
            </Text>
            <TouchableOpacity
              style={[
                styles.modalBtn,
                modalType === "confirm"
                  ? styles.modalBtnPrimary
                  : styles.modalBtnDanger,
              ]}
              onPress={modalType === "confirm" ? handleConfirm : handleReject}
            >
              <Text style={styles.modalBtnText}>
                {modalType === "confirm" ? "수락하기" : "거절하기"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
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
  listContent: { padding: 16, paddingBottom: 40, gap: 16 },
  intro: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 4,
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  scoreText: { fontSize: 11, fontFamily: fonts.bold, color: "#6366f1" },
  image: { width: "100%", height: 200, backgroundColor: "#f5f6f8" },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  info: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14, gap: 4 },
  title: { fontSize: 16, fontFamily: fonts.bold, color: "#111" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { fontSize: 12, fontFamily: fonts.regular, color: "#888" },
  finder: { fontSize: 12, fontFamily: fonts.regular, color: "#aaa" },
  btnRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f5f6f8",
  },
  rejectBtnText: { fontSize: 13, fontFamily: fonts.bold, color: "#888" },
  confirmBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnText: { fontSize: 13, fontFamily: fonts.bold, color: "#fff" },
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
  emptyDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#aaa",
    textAlign: "center",
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
  modalTitle: { fontSize: 17, fontFamily: fonts.bold, color: "#111" },
  modalDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#666",
    lineHeight: 19,
  },
  modalBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  modalBtnPrimary: { backgroundColor: "#6366f1" },
  modalBtnDanger: { backgroundColor: "#f87171" },
  modalBtnText: { fontSize: 15, fontFamily: fonts.bold, color: "#fff" },
  cancelBtn: { paddingVertical: 10, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontFamily: fonts.regular, color: "#aaa" },
});
