import axiosInstance from "@/api/client";
import { fonts } from "@/constants/typography";
import { ROUTES } from "@/constants/url";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Archive,
  Bell,
  Image as ImageIcon,
  MessageCircle,
  QrCode,
  ScanLine,
  User,
  X,
} from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ModalType = "owner" | "locker_success" | "locker_fail" | null;

type OwnerInfo = {
  nickname: string;
  department: string;
  itemName: string;
  itemId?: number;
};

export default function QRScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);
  const [lockerId, setLockerId] = useState<number | null>(null);
  const isProcessing = useRef(false);

  const handleScanStart = async () => {
    if (!permission?.granted) {
      const { granted, canAskAgain } = await requestPermission();
      if (!granted) {
        if (!canAskAgain) {
          Alert.alert(
            "카메라 권한 필요",
            "설정에서 카메라 권한을 허용해주세요.",
            [
              { text: "취소", style: "cancel" },
              { text: "설정으로 이동", onPress: () => Linking.openSettings() },
            ],
          );
        }
        return;
      }
    }
    setIsScanning(true);
  };

  const handleQRScanned = async ({ data }: { data: string }) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setIsScanning(false);

    try {
      // 사물함 QR: {baseUrl}/scan/lockers/{id}/unlock
      const lockerMatch = data.match(/\/lockers\/(\d+)\/unlock/);
      if (lockerMatch) {
        const id = Number(lockerMatch[1]);
        setLockerId(id);
        console.log("[QR] 사물함 URL QR 감지 lockerId:", id);
        try {
          await axiosInstance.post(`/api/lockers/${id}/unlock`);
          setModalType("locker_success");
        } catch (e: any) {
          console.error("[QR] 사물함 열기 실패", e.response?.status, e.message);
          if (e.response?.status === 403) {
            setModalType("locker_fail");
          } else {
            Alert.alert("오류", "사물함 열기에 실패했어요.");
          }
        }
        return;
      }

      const parsed = JSON.parse(data);

      // 사물함 QR
      // TODO: 백엔드 QR 데이터 형태 확인 후 조건 수정
      if (parsed.type === "locker" && parsed.lockerId) {
        setLockerId(parsed.lockerId);
        try {
          await axiosInstance.post(`/api/lockers/${parsed.lockerId}/unlock`, {
            itemId: parsed.itemId ?? null,
          });
          setModalType("locker_success");
        } catch (e: any) {
          if (e.response?.status === 403) {
            setModalType("locker_fail");
          } else {
            Alert.alert("오류", "사물함 열기에 실패했어요.");
          }
        }
      }
      // 물건 QR (ownerQR)
      // TODO: 백엔드 QR 데이터 형태 확인 후 조건 수정
      else if (parsed.type === "item") {
        setOwnerInfo({
          nickname: parsed.nickname ?? "알 수 없음",
          department: parsed.department ?? "",
          itemName: parsed.itemName ?? "물건",
          itemId: parsed.itemId,
        });
        setModalType("owner");
      } else {
        Alert.alert("알 수 없는 QR", "인식할 수 없는 QR 코드예요.");
      }
    } catch {
      Alert.alert("인식 실패", "QR 코드를 읽을 수 없어요.");
    } finally {
      isProcessing.current = false;
    }
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("갤러리 권한 필요", "설정에서 갤러리 권한을 허용해주세요.");
      return;
    }
    Alert.alert("준비중", "갤러리 QR 인식은 준비중이에요.");
  };

  const handleTestModal = () => {
    Alert.alert("테스트", "어떤 모달 볼까요?", [
      {
        text: "ownerQR",
        onPress: () => {
          setOwnerInfo({
            nickname: "김민준",
            department: "컴퓨터공학과",
            itemName: "학생증",
          });
          setModalType("owner");
        },
      },
      {
        text: "보관완료",
        onPress: () => {
          setLockerId(1);
          setModalType("locker_success");
        },
      },
      { text: "권한없음", onPress: () => setModalType("locker_fail") },
      { text: "취소", style: "cancel" },
    ]);
  };

  const handleChat = () => {
    setModalType(null);
    if (ownerInfo?.itemId) {
      router.push({
        pathname: ROUTES.CHAT_ROOM,
        params: { itemId: ownerInfo.itemId },
      } as any);
    } else {
      router.push(ROUTES.CHAT as any);
    }
  };

  const handleLockerClose = async () => {
    if (lockerId) {
      try {
        await axiosInstance.post(`/api/lockers/${lockerId}/lock`);
      } catch (e) {
        console.error("사물함 닫기 실패", e);
      }
    }
    setModalType(null);
    setLockerId(null);
  };

  // 카메라 스캔 화면
  if (isScanning) {
    return (
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleQRScanned}
        />
        {/* 스캔 오버레이 */}
        <View style={[styles.scanOverlay, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setIsScanning(false)}
          >
            <X size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.scanGuideText}>
            QR 코드를 프레임 안에 맞춰주세요
          </Text>
        </View>
        {/* 스캔 프레임 */}
        <View style={styles.scanFrameWrap}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>QR 스캔</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push(ROUTES.NOTIFICATION)}
          >
            <Bell size={20} color="#444" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/(tabs)/mypage" as any)}
          >
            <User size={20} color="#444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 바디 */}
      <View style={styles.body}>
        <Text style={styles.guideText}>
          사물함 QR을 스캔하여 물건을 회수하세요
        </Text>
        <View style={styles.frameWrap}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <View style={styles.qrIconWrap}>
              <QrCode size={64} color="#d1d5db" />
            </View>
          </View>
        </View>
        <Text style={styles.frameGuide}>QR 코드를 프레임 안에 맞춰주세요</Text>
      </View>

      {/* 하단 버튼 */}
      <View style={[styles.btnArea, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={handleScanStart}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#6366f1", "#818cf8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scanBtnGradient}
          >
            <ScanLine size={20} color="#fff" />
            <Text style={styles.scanBtnText}>QR 스캔 시작</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.galleryBtn}
          onPress={handleGallery}
          activeOpacity={0.85}
        >
          <ImageIcon size={18} color="#555" />
          <Text style={styles.galleryBtnText}>갤러리에서 QR 불러오기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testBtn}
          onPress={handleTestModal}
          activeOpacity={0.85}
        >
          <Text style={styles.testBtnText}>🧪 모달 테스트</Text>
        </TouchableOpacity>
      </View>

      {/* ownerQR 모달 */}
      <Modal visible={modalType === "owner"} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalType(null)}
        />
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.ownerAvatar}>
              <User size={32} color="#aaa" />
            </View>
            <Text style={styles.ownerName}>{ownerInfo?.nickname}</Text>
            <Text style={styles.ownerDept}>{ownerInfo?.department}</Text>
            <Text style={styles.ownerDesc}>
              {ownerInfo?.nickname}님의 잃어버린 물건{" "}
              <Text style={styles.ownerItem}>
                &ldquo;{ownerInfo?.itemName}&rdquo;
              </Text>{" "}
              을(를) 찾으셨나요?
            </Text>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={handleChat}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#6366f1", "#818cf8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.chatBtnGradient}
              >
                <MessageCircle size={18} color="#fff" />
                <Text style={styles.chatBtnText}>채팅하기</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeTextBtn}
              onPress={() => setModalType(null)}
            >
              <Text style={styles.closeTextBtnText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 보관완료 모달 */}
      <Modal
        visible={modalType === "locker_success"}
        transparent
        animationType="fade"
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalType(null)}
        />
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.successIconWrap}>
              <Archive size={32} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>보관 완료!</Text>
            <Text style={styles.modalDesc}>
              물건이 사물함에 안전하게 보관되었어요.
            </Text>
            <TouchableOpacity
              style={styles.lockerCloseBtn}
              onPress={handleLockerClose}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#6366f1", "#818cf8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.lockerCloseBtnGradient}
              >
                <Text style={styles.lockerCloseBtnText}>사물함 닫기</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 권한없음 모달 */}
      <Modal
        visible={modalType === "locker_fail"}
        transparent
        animationType="fade"
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalType(null)}
        />
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.failIconWrap}>
              <X size={32} color="#f87171" />
            </View>
            <Text style={styles.modalTitle}>권한이 없습니다</Text>
            <Text style={styles.modalDesc}>
              이 사물함을 열 수 있는 권한이 없어요.{"\n"}
              물품 소유자 또는 습득자만 접근할 수 있습니다.
            </Text>
            <TouchableOpacity
              style={styles.closeTextBtn}
              onPress={() => setModalType(null)}
            >
              <Text style={styles.closeTextBtnText}>닫기</Text>
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
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  guideText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: "#555",
    marginBottom: 40,
    textAlign: "center",
  },
  frameWrap: { marginBottom: 20 },
  frame: {
    width: 240,
    height: 240,
    backgroundColor: "#f5f6f8",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#6366f1",
    borderWidth: 3,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  qrIconWrap: { opacity: 0.5 },
  frameGuide: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#aaa",
    marginTop: 16,
  },
  btnArea: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  scanBtn: { borderRadius: 14, overflow: "hidden" },
  scanBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    gap: 8,
  },
  scanBtnText: { fontSize: 16, fontFamily: fonts.bold, color: "#fff" },
  galleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 8,
  },
  galleryBtnText: { fontSize: 15, fontFamily: fonts.regular, color: "#555" },
  // 카메라 스캔 오버레이
  scanOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  cancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  scanGuideText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scanFrameWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: "relative",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
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
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  ownerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  ownerName: { fontSize: 18, fontFamily: fonts.bold, color: "#111" },
  ownerDept: { fontSize: 13, fontFamily: fonts.regular, color: "#6366f1" },
  ownerDesc: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 4,
  },
  ownerItem: { fontFamily: fonts.bold, color: "#111" },
  chatBtn: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
  },
  chatBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    gap: 8,
  },
  chatBtnText: { fontSize: 15, fontFamily: fonts.bold, color: "#fff" },
  successIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  modalTitle: { fontSize: 20, fontFamily: fonts.bold, color: "#111" },
  modalDesc: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: "#777",
    textAlign: "center",
    lineHeight: 22,
  },
  lockerCloseBtn: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
  },
  lockerCloseBtnGradient: {
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  lockerCloseBtnText: { fontSize: 15, fontFamily: fonts.bold, color: "#fff" },
  failIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  closeTextBtn: {
    width: "100%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#f5f6f8",
  },
  closeTextBtnText: { fontSize: 15, fontFamily: fonts.regular, color: "#555" },
  testBtn: {
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
  },
  testBtnText: { fontSize: 13, fontFamily: fonts.regular, color: "#aaa" },
});
