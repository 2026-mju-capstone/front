<<<<<<< HEAD
import { fonts } from "@/constants/typography";
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
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ModalType = "owner" | "locker_success" | "locker_fail" | null;

const DUMMY_OWNER = {
  nickname: "김민준",
  department: "컴퓨터공학과",
  itemName: "학생증",
};

export default function QRScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [modalType, setModalType] = useState<ModalType>(null);

  const handleScanStart = () => {
    Alert.alert("테스트", "어떤 모달 볼까요?", [
      { text: "ownerQR", onPress: () => setModalType("owner") },
      { text: "보관완료", onPress: () => setModalType("locker_success") },
      { text: "권한없음", onPress: () => setModalType("locker_fail") },
      { text: "취소", style: "cancel" },
    ]);
  };

  const handleGallery = () => {
    Alert.alert("준비중", "갤러리 QR 인식은 준비중이에요.");
  };

  const handleChat = () => {
    setModalType(null);
    router.push("/(tabs)/chat");
  };

  const handleLockerClose = () => {
    // TODO: 사물함 닫기 API 연결
    setModalType(null);
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>QR 스캔</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/notifications")}
          >
            <Bell size={20} color="#444" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/mypage")}
          >
            <User size={20} color="#444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 바디 */}
      <View style={styles.body}>
        {/* 안내 텍스트 */}
        <Text style={styles.guideText}>
          사물함 QR을 스캔하여 물건을 회수하세요
        </Text>

        {/* QR 프레임 */}
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
            <Text style={styles.ownerName}>{DUMMY_OWNER.nickname}</Text>
            <Text style={styles.ownerDept}>{DUMMY_OWNER.department}</Text>
            <Text style={styles.ownerDesc}>
              {DUMMY_OWNER.nickname}님의 잃어버린 물건{" "}
              <Text style={styles.ownerItem}>
                &ldquo;{DUMMY_OWNER.itemName}&rdquo;
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
            <TouchableOpacity
              style={styles.closeTextBtn}
              onPress={() => setModalType(null)}
            >
              <Text style={styles.closeTextBtnText}>닫기</Text>
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
=======
import {Camera} from "expo-camera";
import {useEffect} from "react";
import {Text, View} from "react-native";

export default function Scan() {
    useEffect(() => {
        (async () => {
            await Camera.requestCameraPermissionsAsync();
        })();
    }, []);

    return (
        <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
            <Text>스캔</Text>
        </View>
    );
>>>>>>> 67551bb (Feat: image upload in lost-item)
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
});
