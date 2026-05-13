import { fonts } from "@/constants/typography";
import { BASE_URL } from "@/constants/url";
import { useRouter } from "expo-router";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  Clock,
  MapPin,
  Sparkles,
  Video,
  XCircle,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type DetectionStatus = "CONFIRMED_SELF" | "REJECTED_SELF" | null;

type Detection = {
  detection_id: string;
  snapshot_url: string | null;
  detected_at: string;
  location: string;
  score: number;
  review_status: DetectionStatus;
};

type CctvResultState =
  | {
      ready: false;
      totalVideos: number;
      resolvedVideos: number;
      estimatedRemainingSeconds: number;
    }
  | { ready: true; matches: Detection[] };

// 더미 데이터 (백엔드 API 추가 시 교체)
const MOCK_PROGRESS: CctvResultState = {
  ready: false,
  totalVideos: 5,
  resolvedVideos: 2,
  estimatedRemainingSeconds: 180,
};

const MOCK_COMPLETE: CctvResultState = {
  ready: true,
  matches: [
    {
      detection_id: "det-1",
      snapshot_url: null,
      detected_at: "2026-05-11T14:30:00",
      location: "제1공학관 3층 복도",
      score: 0.87,
      review_status: null,
    },
    {
      detection_id: "det-2",
      snapshot_url: null,
      detected_at: "2026-05-11T15:12:00",
      location: "학생회관 1층 카페",
      score: 0.81,
      review_status: null,
    },
  ],
};

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  const h = d.getHours();
  const ampm = h < 12 ? "오전" : "오후";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${ampm} ${String(hh).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatRemaining(seconds: number) {
  const min = Math.floor(seconds / 60);
  if (min < 1) return "1분 이내";
  return `약 ${min}분`;
}

export default function CctvResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<CctvResultState>(MOCK_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(
    null,
  );
  const [modalType, setModalType] = useState<"confirm" | "reject" | null>(null);

  // TODO: 백엔드 API 추가 후 실제 호출로 교체
  // GET /api/cctv/analyze?itemId={id}
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // 더미: 5초 후 완료 상태로 전환 (테스트용)
      setTimeout(() => setData(MOCK_COMPLETE), 5000);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const openModal = (detection: Detection, type: "confirm" | "reject") => {
    setSelectedDetection(detection);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedDetection(null);
    setModalType(null);
  };

  // TODO: PUT /api/cctv/detections/{id}/review API 연결
  const handleReview = (status: "CONFIRMED_SELF" | "REJECTED_SELF") => {
    if (!selectedDetection) return;
    const updated = { ...selectedDetection, review_status: status };
    closeModal();

    // 임시 로컬 상태 업데이트
    if (data.ready) {
      setData({
        ...data,
        matches: data.matches.map((m) =>
          m.detection_id === updated.detection_id ? updated : m,
        ),
      });
    }

    Toast.show({
      type: "success",
      text1:
        status === "CONFIRMED_SELF"
          ? "내 물건으로 확정했어요"
          : "내 물건이 아닌 것으로 표시했어요",
      position: "bottom",
      visibilityTime: 2000,
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
        <Text style={styles.headerTitle}>CCTV 분석 결과</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* 진행 중 상태 */}
        {!data.ready ? (
          <View style={styles.progressBox}>
            <View style={styles.progressIconWrap}>
              <Video size={36} color="#6366f1" />
            </View>
            <Text style={styles.progressTitle}>분석 진행 중이에요</Text>
            <Text style={styles.progressDesc}>
              CCTV 영상을 분석해서 분실물을{"\n"}찾고 있어요. 잠시만
              기다려주세요!
            </Text>

            {/* 진행률 바 */}
            <View style={styles.progressBarWrap}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${(data.resolvedVideos / data.totalVideos) * 100}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressInfoText}>
                  {data.resolvedVideos} / {data.totalVideos} 영상 분석 완료
                </Text>
                <Text style={styles.progressInfoText}>
                  {formatRemaining(data.estimatedRemainingSeconds)}
                </Text>
              </View>
            </View>

            <View style={styles.progressTip}>
              <Clock size={14} color="#888" />
              <Text style={styles.progressTipText}>
                분석이 완료되면 푸시 알림으로 알려드릴게요
              </Text>
            </View>
          </View>
        ) : (
          // 완료 상태
          <>
            <View style={styles.intro}>
              <View style={styles.introIcon}>
                <Sparkles size={20} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.introTitle}>
                  CCTV에서 {data.matches.length}개 검출됐어요
                </Text>
                <Text style={styles.introDesc}>
                  스냅샷을 확인하고 내 물건이 맞는지 알려주세요
                </Text>
              </View>
            </View>

            {data.matches.length === 0 ? (
              <View style={styles.emptyBox}>
                <View style={styles.emptyIconWrap}>
                  <Camera size={36} color="#6366f1" />
                </View>
                <Text style={styles.emptyTitle}>검출된 결과가 없어요</Text>
                <Text style={styles.emptyDesc}>
                  분석한 영상에서 분실물과{"\n"}유사한 장면을 찾지 못했어요
                </Text>
              </View>
            ) : (
              data.matches.map((det) => {
                const scorePercent = Math.round(det.score * 100);
                const isReviewed = det.review_status !== null;
                const isConfirmed = det.review_status === "CONFIRMED_SELF";
                const isRejected = det.review_status === "REJECTED_SELF";

                return (
                  <View key={det.detection_id} style={styles.card}>
                    {/* 점수 배지 + 상태 */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.scoreBadge}>
                        <Sparkles size={12} color="#6366f1" />
                        <Text style={styles.scoreText}>
                          유사도 {scorePercent}%
                        </Text>
                      </View>
                      {isReviewed && (
                        <View
                          style={[
                            styles.statusBadge,
                            isConfirmed
                              ? styles.statusBadgeConfirmed
                              : styles.statusBadgeRejected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isConfirmed
                                ? styles.statusBadgeTextConfirmed
                                : styles.statusBadgeTextRejected,
                            ]}
                          >
                            {isConfirmed ? "내 물건 확정" : "내 거 아님"}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 스냅샷 */}
                    {det.snapshot_url ? (
                      <Image
                        source={{
                          uri: det.snapshot_url.startsWith("http")
                            ? det.snapshot_url
                            : `${BASE_URL}${det.snapshot_url}`,
                        }}
                        style={styles.snapshot}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.snapshotPlaceholder}>
                        <Video size={36} color="#6366f1" />
                        <Text style={styles.snapshotPlaceholderText}>
                          스냅샷 미리보기
                        </Text>
                      </View>
                    )}

                    {/* 정보 */}
                    <View style={styles.info}>
                      <View style={styles.infoRow}>
                        <MapPin size={14} color="#888" />
                        <Text style={styles.infoText}>{det.location}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Clock size={14} color="#888" />
                        <Text style={styles.infoText}>
                          {formatDateTime(det.detected_at)}
                        </Text>
                      </View>
                    </View>

                    {/* 3택 버튼 (미리뷰일 때만) */}
                    {!isReviewed && (
                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => openModal(det, "reject")}
                          activeOpacity={0.85}
                        >
                          <XCircle size={14} color="#888" />
                          <Text style={styles.rejectBtnText}>아니에요</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.confirmBtn}
                          onPress={() => openModal(det, "confirm")}
                          activeOpacity={0.85}
                        >
                          <CheckCircle2 size={14} color="#fff" />
                          <Text style={styles.confirmBtnText}>맞아요</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* 확인 모달 */}
      <Modal visible={modalType !== null} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={closeModal} />
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modalType === "confirm"
                ? "내 물건이 맞나요?"
                : "내 물건이 아닌가요?"}
            </Text>
            <Text style={styles.modalDesc}>
              {modalType === "confirm"
                ? "확정하면 회수 절차가 진행되며,\n취소할 수 없어요."
                : "거절한 검출은 다시 받을 수 없어요."}
            </Text>
            <TouchableOpacity
              style={[
                styles.modalBtn,
                modalType === "confirm"
                  ? styles.modalBtnPrimary
                  : styles.modalBtnDanger,
              ]}
              onPress={() =>
                handleReview(
                  modalType === "confirm" ? "CONFIRMED_SELF" : "REJECTED_SELF",
                )
              }
            >
              <Text style={styles.modalBtnText}>
                {modalType === "confirm" ? "확정하기" : "거절하기"}
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

  // 진행 중
  progressBox: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  progressIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  progressTitle: { fontSize: 18, fontFamily: fonts.bold, color: "#111" },
  progressDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  progressBarWrap: { width: "100%", gap: 8 },
  progressBarBg: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "#eef2ff",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressInfoText: { fontSize: 12, fontFamily: fonts.regular, color: "#888" },
  progressTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fafbff",
    borderRadius: 10,
  },
  progressTipText: { fontSize: 11, fontFamily: fonts.regular, color: "#888" },

  // 완료
  intro: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
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

  // 카드
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusBadgeConfirmed: { backgroundColor: "#dcfce7" },
  statusBadgeRejected: { backgroundColor: "#f5f6f8" },
  statusBadgeText: { fontSize: 11, fontFamily: fonts.bold },
  statusBadgeTextConfirmed: { color: "#16a34a" },
  statusBadgeTextRejected: { color: "#888" },

  snapshot: { width: "100%", height: 200, backgroundColor: "#f5f6f8" },
  snapshotPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  snapshotPlaceholderText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#6366f1",
  },

  info: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14, gap: 6 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 12, fontFamily: fonts.regular, color: "#555" },

  // 3택 버튼
  btnRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f5f6f8",
  },
  rejectBtnText: { fontSize: 12, fontFamily: fonts.bold, color: "#888" },
  confirmBtn: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnText: { fontSize: 12, fontFamily: fonts.bold, color: "#fff" },

  // 빈 상태
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
    lineHeight: 19,
  },

  // 모달
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
