import { BASE_URL, ROUTES } from "@/constants/url";
import { useCctvMutations } from "@/hooks/mutations/useCctvMutations";
import { useCctvQueries } from "@/hooks/queries/useCctvQueries";
import { fonts } from "@/constants/typography";
import { CctvDetection, CctvReviewStatus } from "@/api/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera, CheckCircle2, ChevronLeft, Clock, HelpCircle, MapPin, Video, XCircle } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator, Dimensions, Image, Modal, Pressable,
    ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const { width: screenWidth } = Dimensions.get("window");
const SNAPSHOT_WIDTH = (screenWidth - 32) / 2;

function formatDateTime(dateStr: string) {
    const d = new Date(dateStr);
    const h = d.getHours();
    const ampm = h < 12 ? "오전" : "오후";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${ampm} ${String(hh).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function CctvResultScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { itemId } = useLocalSearchParams<{ itemId: string }>();
    const parsedItemId = Number(itemId);

    const [selectedDetection, setSelectedDetection] = useState<CctvDetection | null>(null);
    const [modalType, setModalType] = useState<"confirm" | "reject" | null>(null);
    const [localReviewed, setLocalReviewed] = useState<Record<number, CctvReviewStatus>>({});

    const { data, isLoading, refetch } = useCctvQueries.useItemDetections(parsedItemId);
    const reviewMutation = useCctvMutations.useReviewDetection(parsedItemId);
    const responseData = data?.data?.data;

    const openModal = (detection: CctvDetection, type: "confirm" | "reject") => {
        setSelectedDetection(detection);
        setModalType(type);
    };
    const closeModal = () => { setSelectedDetection(null); setModalType(null); };

    const handleReview = (status: CctvReviewStatus) => {
        if (!selectedDetection) return;
        closeModal();
        reviewMutation.mutate(
            { detectionId: selectedDetection.detection_id, body: { review_status: status } },
            {
                onSuccess: () => {
                    setLocalReviewed((prev) => ({ ...prev, [selectedDetection.detection_id]: status }));
                    if (status === "CONFIRMED_SELF") {
                        Toast.show({ type: "success", text1: "내 물건으로 확인했어요", position: "bottom", visibilityTime: 2000 });
                        router.push(ROUTES.MATCHES);
                    } else if (status === "REJECTED_SELF") {
                        Toast.show({ type: "success", text1: "도난 의심 신고가 접수됐어요", position: "bottom", visibilityTime: 2500 });
                    } else {
                        Toast.show({ type: "info", text1: "나중에 다시 확인할게요", position: "bottom", visibilityTime: 2000 });
                    }
                },
                onError: () => {
                    Toast.show({ type: "error", text1: "처리 실패", text2: "다시 시도해주세요.", position: "bottom", visibilityTime: 2500 });
                },
            }
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
                <ActivityIndicator color="#ef4444" size="large" />
            </View>
        );
    }

    const detections = responseData?.detections ?? [];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>CCTV 분석 결과</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {detections.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <View style={styles.emptyIconWrap}><Camera size={36} color="#ef4444" /></View>
                        <Text style={styles.emptyTitle}>검출된 결과가 없어요</Text>
                        <Text style={styles.emptyDesc}>분석한 영상에서 분실물과{"\n"}유사한 장면을 찾지 못했어요</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.intro}>
                            <Text style={styles.introTitle}>CCTV에서 {detections.length}개 검출됐어요</Text>
                            <Text style={styles.introDesc}>스냅샷을 확인하고 내 물건이 맞는지 알려주세요</Text>
                        </View>

                        {detections.map((det) => {
                            const reviewed = localReviewed[det.detection_id];
                            const isReviewed = reviewed !== undefined;
                            const scorePercent = Math.round(det.score * 100);
                            const itemSnapshotUri = det.item_snapshot_url
                                ? det.item_snapshot_url.startsWith("http") ? det.item_snapshot_url : `${BASE_URL}${det.item_snapshot_url}`
                                : null;
                            const momentSnapshotUri = det.moment_snapshot_url
                                ? det.moment_snapshot_url.startsWith("http") ? det.moment_snapshot_url : `${BASE_URL}${det.moment_snapshot_url}`
                                : null;

                            return (
                                <View key={det.detection_id} style={styles.card}>
                                    <View style={styles.cardTopRow}>
                                        <View style={styles.scoreBadge}>
                                            <Text style={styles.scoreText}>유사도 {scorePercent}%</Text>
                                        </View>
                                        {isReviewed && (
                                            <View style={[styles.statusBadge,
                                                reviewed === "CONFIRMED_SELF" ? styles.statusConfirmed
                                                    : reviewed === "REJECTED_SELF" ? styles.statusRejected
                                                        : styles.statusUncertain]}>
                                                <Text style={styles.statusBadgeText}>
                                                    {reviewed === "CONFIRMED_SELF" ? "내 물건 확정" : reviewed === "REJECTED_SELF" ? "내 거 아님" : "미확인"}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* 듀얼 스냅샷 */}
                                    <View style={styles.snapshotRow}>
                                        <View style={[styles.snapshotWrap, { width: SNAPSHOT_WIDTH }]}>
                                            <Text style={styles.snapshotLabel}>내 물건</Text>
                                            {itemSnapshotUri ? (
                                                <Image source={{ uri: itemSnapshotUri }} style={[styles.snapshot, { width: SNAPSHOT_WIDTH }]} resizeMode="cover" />
                                            ) : (
                                                <View style={[styles.snapshotPlaceholder, { width: SNAPSHOT_WIDTH }]}><Video size={24} color="#ef4444" /></View>
                                            )}
                                        </View>
                                        <View style={[styles.snapshotWrap, { width: SNAPSHOT_WIDTH }]}>
                                            <Text style={styles.snapshotLabel}>발견 순간</Text>
                                            {momentSnapshotUri ? (
                                                <Image source={{ uri: momentSnapshotUri }} style={[styles.snapshot, { width: SNAPSHOT_WIDTH }]} resizeMode="cover" />
                                            ) : (
                                                <View style={[styles.snapshotPlaceholder, { width: SNAPSHOT_WIDTH }]}><Camera size={24} color="#ef4444" /></View>
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.info}>
                                        <View style={styles.infoRow}><MapPin size={14} color="#888" /><Text style={styles.infoText}>{det.building_name} {det.room_name}</Text></View>
                                        <View style={styles.infoRow}><Clock size={14} color="#888" /><Text style={styles.infoText}>{formatDateTime(det.detected_at)}</Text></View>
                                    </View>

                                    {!isReviewed && (
                                        <View style={styles.btnRow}>
                                            <TouchableOpacity style={styles.rejectBtn} onPress={() => openModal(det, "reject")} activeOpacity={0.85}>
                                                <XCircle size={14} color="#888" />
                                                <Text style={styles.rejectBtnText}>아니에요</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.confirmBtn} onPress={() => openModal(det, "confirm")} activeOpacity={0.85}>
                                                <CheckCircle2 size={14} color="#fff" />
                                                <Text style={styles.confirmBtnText}>맞아요</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </>
                )}
            </ScrollView>

            <Modal visible={modalType !== null} transparent animationType="fade">
                <Pressable style={styles.modalOverlay} onPress={closeModal} />
                <View style={styles.modalWrap}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>
                            {modalType === "confirm" ? "내 물건이 맞나요?" : "내 물건이 아닌가요?"}
                        </Text>
                        <Text style={styles.modalDesc}>
                            {modalType === "confirm" ? "확정하면 매칭 절차가 진행되며,\n취소할 수 없어요."
                                : "아닌 것으로 표시하면 도난 의심 신고가\n자동 접수돼요."}
                        </Text>
                        <TouchableOpacity
                            style={[styles.modalBtn, modalType === "confirm" ? styles.modalBtnPrimary : styles.modalBtnDanger]}
                            onPress={() => handleReview(modalType === "confirm" ? "CONFIRMED_SELF" : "REJECTED_SELF")}
                        >
                            <Text style={styles.modalBtnText}>
                                {modalType === "confirm" ? "확정하기" : "신고하기"}
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
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#f0f0f0" },
    backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 16, fontFamily: fonts.bold, color: "#111" },
    progressBox: { alignItems: "center", padding: 32, gap: 16 },
    progressIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center" },
    progressTitle: { fontSize: 18, fontFamily: fonts.bold, color: "#111" },
    progressDesc: { fontSize: 14, fontFamily: fonts.regular, color: "#666", textAlign: "center", lineHeight: 22 },
    progressBarWrap: { width: "100%", gap: 8 },
    progressBarBg: { height: 8, backgroundColor: "#f5f6f8", borderRadius: 4, overflow: "hidden" },
    progressBarFill: { height: 8, backgroundColor: "#ef4444", borderRadius: 4 },
    progressInfoText: { fontSize: 12, fontFamily: fonts.regular, color: "#888", textAlign: "right" },
    progressTip: { flexDirection: "row", alignItems: "center", gap: 6 },
    progressTipText: { fontSize: 12, fontFamily: fonts.regular, color: "#888" },
    emptyBox: { alignItems: "center", paddingVertical: 80, gap: 12 },
    emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center", marginBottom: 4 },
    emptyTitle: { fontSize: 16, fontFamily: fonts.bold, color: "#333" },
    emptyDesc: { fontSize: 13, fontFamily: fonts.regular, color: "#aaa", textAlign: "center" },
    intro: { padding: 16, gap: 4 },
    introTitle: { fontSize: 16, fontFamily: fonts.bold, color: "#111" },
    introDesc: { fontSize: 13, fontFamily: fonts.regular, color: "#888" },
    card: { marginHorizontal: 16, marginBottom: 16, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, paddingBottom: 8 },
    scoreBadge: { backgroundColor: "#fef2f2", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
    scoreText: { fontSize: 11, fontFamily: fonts.bold, color: "#ef4444" },
    statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
    statusConfirmed: { backgroundColor: "#dcfce7" },
    statusRejected: { backgroundColor: "#fee2e2" },
    statusUncertain: { backgroundColor: "#fef9c3" },
    statusBadgeText: { fontSize: 11, fontFamily: fonts.bold, color: "#333" },
    snapshotRow: { flexDirection: "row" },
    snapshotWrap: { gap: 4, padding: 8 },
    snapshotLabel: { fontSize: 11, fontFamily: fonts.bold, color: "#888", paddingHorizontal: 4 },
    snapshot: { height: 140, borderRadius: 8, backgroundColor: "#f5f6f8" },
    snapshotPlaceholder: { height: 140, borderRadius: 8, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center" },
    info: { paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
    infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    infoText: { fontSize: 13, fontFamily: fonts.regular, color: "#555" },
    btnRow: { flexDirection: "row", gap: 6, padding: 14, paddingTop: 6 },
    rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderRadius: 10, backgroundColor: "#f5f6f8" },
    rejectBtnText: { fontSize: 12, fontFamily: fonts.bold, color: "#888" },
    confirmBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderRadius: 10, backgroundColor: "#ef4444" },
    confirmBtnText: { fontSize: 12, fontFamily: fonts.bold, color: "#fff" },
    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
    modalWrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
    modalCard: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 24, gap: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
    modalTitle: { fontSize: 17, fontFamily: fonts.bold, color: "#111" },
    modalDesc: { fontSize: 13, fontFamily: fonts.regular, color: "#666", lineHeight: 19 },
    modalBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
    modalBtnPrimary: { backgroundColor: "#ef4444" },
    modalBtnDanger: { backgroundColor: "#f87171" },
    modalBtnWarning: { backgroundColor: "#f59e0b" },
    modalBtnText: { fontSize: 15, fontFamily: fonts.bold, color: "#fff" },
    cancelBtn: { paddingVertical: 10, alignItems: "center" },
    cancelBtnText: { fontSize: 14, fontFamily: fonts.regular, color: "#aaa" },
});